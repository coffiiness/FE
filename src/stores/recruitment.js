import { defineStore } from 'pinia'
import { ref } from 'vue'
import { recruitmentApi } from '@/api/recruitment'
import { applicationTemplateApi } from '@/api/applicationTemplate'
import { normalizeTemplateStatus } from '@/utils/templateStatus'

export const useRecruitmentStore = defineStore('recruitment', () => {
  const jobs = ref([])
  const loading = ref(false)
  const error = ref(null)
  const interviewSchedules = ref([])
  const templates = ref([])

  const parseError = (err) => {
    const status = err.response?.status
    const message = err.response?.data?.message

    if (status === 400) {
      return { type: 'VALIDATION', message: message || '입력값을 확인해주세요.' }
    }
    if (status === 403 || (status === 400 && message?.includes('권한'))) {
      return { type: 'FORBIDDEN', message: '접근 권한이 없습니다.' }
    }
    if (status === 401) return { type: 'UNAUTHORIZED', message: '로그인이 필요합니다.' }
    return { type: 'SERVER_ERROR', message: '일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
  }

  const parseCustomFields = (value) => {
    if (Array.isArray(value)) return value

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return parseCustomFields(parsed)
      } catch (_) {
        return []
      }
    }

    if (value && typeof value === 'object') {
      const nestedCandidates = [
        value.customFields,
        value.customFieldsJson,
        value.questions,
        value.questionsJson,
        value.questionFields,
        value.fields,
        value.items
      ]

      for (const candidate of nestedCandidates) {
        const parsedCandidate = parseCustomFields(candidate)
        if (parsedCandidate.length > 0) return parsedCandidate
      }

      const objectValues = Object.values(value)
      if (objectValues.length > 0 && objectValues.every((item) => item && typeof item === 'object')) {
        const looksLikeField = objectValues.every((item) => 'label' in item || 'type' in item)
        if (looksLikeField) return objectValues
      }
    }

    return []
  }

  const resolveTemplateId = (template = {}) => {
    const rawId =
      template.id ??
      template.templateId ??
      template.applicationTemplateId ??
      template.applicationFormTemplateId

    const numericId = Number(rawId)
    return Number.isFinite(numericId) ? numericId : null
  }
  const sanitizeCustomFields = (fields) => {
    const normalizeOptions = (value) => {
      if (Array.isArray(value)) {
        return value.map((item) => String(item || '').trim()).filter(Boolean)
      }
      if (typeof value === 'string') {
        return value
          .split(/[\/,\n]/)
          .map((item) => item.trim())
          .filter(Boolean)
      }
      return []
    }

    const toNumberOrNull = (value) => {
      const number = Number(value)
      return Number.isFinite(number) && number > 0 ? number : null
    }

    return parseCustomFields(fields)
      .map((field, index) => ({
        id: field?.id ?? `custom_${Date.now()}_${index}`,
        label: String(field?.label || '').trim(),
        type: String(field?.type || '').trim(),
        required: Boolean(field?.required),
        options: normalizeOptions(field?.options),
        maxLength: toNumberOrNull(field?.maxLength),
        multiline: Boolean(field?.multiline),
        accept: String(field?.accept || '*/*').trim() || '*/*',
        maxFileSizeMB: toNumberOrNull(field?.maxFileSizeMB)
      }))
      .filter((field) => field.label && field.type)
  }

  const buildTemplatePayload = (template = {}) => {
    const normalizedStatus = normalizeTemplateStatus(template.status)
    const normalizedCustomFields = sanitizeCustomFields(template.customFields)

    return {
      title: String(template.title || '').trim(),
      status: normalizedStatus,
      templateStatus: normalizedStatus,
      useStatus: normalizedStatus,
      customFields: normalizedCustomFields,
      customFieldsJson: JSON.stringify(normalizedCustomFields),
      questions: normalizedCustomFields,
      questionsJson: JSON.stringify(normalizedCustomFields),
      questionFields: normalizedCustomFields,
      customQuestions: normalizedCustomFields,
      templateFields: normalizedCustomFields
    }
  }

  const mapTemplate = (template) => ({
    id: resolveTemplateId(template),
    name: template.name || template.title || template.templateName || '',
    title: template.title || template.name || template.templateName || '',
    createdAt: template.createdAt || '',
    updatedAt: template.updatedAt || '',
    status: normalizeTemplateStatus(template.status ?? template.templateStatus ?? template.useStatus),
    used: Boolean(template.used),
    recruitmentCount: Number(template.recruitmentCount || 0),
    customFields: parseCustomFields(
      template.customFields ??
      template.customFieldsJson ??
      template.questions ??
      template.questionsJson ??
      template.questionFields ??
      template.customQuestions
    )
  })

  const fetchRecruitments = async (params = {}) => {
    loading.value = true
    error.value = null
    try {
      const res = await recruitmentApi.getRecruitments(params)
      jobs.value = res.data.data || []
      return jobs.value
    } catch (err) {
      error.value = parseError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const createRecruitment = async (data) => {
    loading.value = true
    error.value = null
    try {
      const res = await recruitmentApi.createRecruitment(data)
      return res.data.data
    } catch (err) {
      error.value = parseError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateRecruitment = async (recruitmentId, data) => {
    loading.value = true
    error.value = null
    try {
      const res = await recruitmentApi.updateRecruitment(recruitmentId, data)
      const updated = res.data.data || null
      if (updated?.id) {
        const index = jobs.value.findIndex((job) => Number(job.id) === Number(updated.id))
        if (index !== -1) {
          jobs.value[index] = { ...jobs.value[index], ...updated }
        }
      }
      return updated
    } catch (err) {
      error.value = parseError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateRecruitmentInterviewers = async (recruitmentId, interviewerIds) => {
    loading.value = true
    error.value = null
    try {
      const res = await recruitmentApi.updateRecruitmentInterviewers(recruitmentId, interviewerIds)
      const updated = res.data.data || null
      if (updated?.id) {
        const index = jobs.value.findIndex((job) => Number(job.id) === Number(updated.id))
        if (index !== -1) {
          const assignees = Array.isArray(updated.interviewers)
            ? updated.interviewers.map((interviewer) => ({
                userId: interviewer.userId,
                name: interviewer.name
              }))
            : jobs.value[index].assignees
          jobs.value[index] = {
            ...jobs.value[index],
            assignees,
            interviewerIds: assignees.map((interviewer) => interviewer.userId)
          }
        }
      }
      return updated
    } catch (err) {
      error.value = parseError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const publishRecruitment = async (recruitmentId) => {
    loading.value = true
    error.value = null
    try {
      const res = await recruitmentApi.publishRecruitment(recruitmentId)
      const updated = res.data.data || null
      if (updated?.id) {
        const index = jobs.value.findIndex((job) => Number(job.id) === Number(updated.id))
        if (index !== -1) {
          const assignees = Array.isArray(updated.interviewers)
            ? updated.interviewers.map((interviewer) => ({
                userId: interviewer.userId,
                name: interviewer.name
              }))
            : jobs.value[index].assignees

          jobs.value[index] = {
            ...jobs.value[index],
            status: updated.recruitmentStatus || updated.status || jobs.value[index].status,
            recruitmentStatus:
              updated.recruitmentStatus || updated.status || jobs.value[index].recruitmentStatus,
            startDate: updated.startDate || jobs.value[index].startDate,
            endDate: updated.endDate || jobs.value[index].endDate,
            leadGroupId: updated.leadGroupId ?? jobs.value[index].leadGroupId,
            leadGroupName: updated.leadGroupName ?? jobs.value[index].leadGroupName,
            referenceGroupIds: updated.referenceGroupIds ?? jobs.value[index].referenceGroupIds,
            assignees,
            interviewerIds: assignees.map((interviewer) => interviewer.userId)
          }
        }
      }
      return updated
    } catch (err) {
      error.value = parseError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const deleteRecruitment = async (recruitmentId) => {
    loading.value = true
    error.value = null
    try {
      await recruitmentApi.deleteRecruitment(recruitmentId)
      jobs.value = jobs.value.filter((job) => Number(job.id) !== Number(recruitmentId))
      return recruitmentId
    } catch (err) {
      error.value = parseError(err)
      throw err
    } finally {
      loading.value = false
    }
  }
  const fetchInterviewSchedules = async (recruitmentId, yearMonth) => {
    loading.value = true
    error.value = null
    try {
      const res = await recruitmentApi.getInterviewSchedules(recruitmentId, yearMonth)
      interviewSchedules.value = res.data.data || []
      return interviewSchedules.value
    } catch (err) {
      error.value = parseError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchTemplates = async () => {
    loading.value = true
    error.value = null
    try {
      const res = await applicationTemplateApi.getTemplates()
      const rawTemplates = res?.data?.data || []
      templates.value = rawTemplates
        .map(mapTemplate)
        .filter((template) => template.id !== null)
      return templates.value
    } catch (err) {
      error.value = parseError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const addTemplate = async (template) => {
    loading.value = true
    error.value = null
    try {
      const payload = buildTemplatePayload(template)
      const res = await applicationTemplateApi.createTemplate(payload)
      const created = mapTemplate(res?.data?.data || payload)
      templates.value.unshift(created)
      return created
    } catch (err) {
      error.value = parseError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateTemplate = async (updatedTemplate) => {
    loading.value = true
    error.value = null
    try {
      const templateId = Number(updatedTemplate.id)
      const payload = buildTemplatePayload(updatedTemplate)
      const res = await applicationTemplateApi.updateTemplate(templateId, payload)
      const mapped = mapTemplate(res?.data?.data || { ...updatedTemplate, id: templateId })
      const index = templates.value.findIndex((t) => t.id === templateId)
      if (index !== -1) templates.value[index] = mapped
      else templates.value.unshift(mapped)
      return mapped
    } catch (err) {
      error.value = parseError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateTemplateStatus = async (id, status) => {
    loading.value = true
    error.value = null
    try {
      await applicationTemplateApi.updateTemplateStatus(id, normalizeTemplateStatus(status))
      const index = templates.value.findIndex((t) => t.id === Number(id))
      if (index !== -1) {
        templates.value[index] = {
          ...templates.value[index],
          status: normalizeTemplateStatus(status)
        }
      }
    } catch (err) {
      error.value = parseError(err)
      throw err
    } finally {
      loading.value = false
    }
  }


  const fetchTemplateById = async (templateId) => {
    loading.value = true
    error.value = null
    try {
      const res = await applicationTemplateApi.getTemplate(templateId)
      const mapped = mapTemplate(res?.data?.data || {})
      const index = templates.value.findIndex((template) => template.id === mapped.id)
      if (index !== -1) templates.value[index] = mapped
      else if (mapped.id !== null) templates.value.unshift(mapped)
      return mapped
    } catch (err) {
      error.value = parseError(err)
      throw err
    } finally {
      loading.value = false
    }
  }
  const fetchApplicationTemplates = fetchTemplates

  const deleteTemplate = async (id) => {
    loading.value = true
    error.value = null
    try {
      await applicationTemplateApi.deleteTemplate(id)
      templates.value = templates.value.filter((t) => t.id !== Number(id))
    } catch (err) {
      error.value = parseError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  const updateJob = (updatedJob) => {
    const index = jobs.value.findIndex((job) => Number(job.id) === Number(updatedJob.id))
    if (index !== -1) jobs.value[index] = { ...jobs.value[index], ...updatedJob }
  }

  const deleteJob = (id) => {
    jobs.value = jobs.value.filter((job) => Number(job.id) !== Number(id))
  }
  return {
    jobs,
    loading,
    error,
    interviewSchedules,
    templates,
    fetchRecruitments,
    createRecruitment,
    updateRecruitment,
    updateRecruitmentInterviewers,
    publishRecruitment,
    deleteRecruitment,
    fetchInterviewSchedules,
    fetchTemplates,
    fetchApplicationTemplates,
    fetchTemplateById,
    addTemplate,
    updateTemplate,
    updateTemplateStatus,
    deleteTemplate,
    updateJob,
    deleteJob
  }
})




