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

    if (status === 400) return { type: 'VALIDATION', message: message || '입력값을 확인해 주세요.' }
    if (status === 403 || (status === 400 && message?.includes('권한'))) {
      return { type: 'FORBIDDEN', message: '해당 요청을 수행할 권한이 없습니다.' }
    }
    if (status === 401) return { type: 'UNAUTHORIZED', message: '로그인이 필요합니다.' }
    return { type: 'SERVER_ERROR', message: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }
  }

  const parseCustomFields = (value) => {
    if (Array.isArray(value)) return value
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
      } catch (_) {
        return []
      }
    }
    return []
  }

  const sanitizeCustomFields = (fields) => {
    return parseCustomFields(fields).map((field, index) => ({
      id: field?.id ?? `custom_${Date.now()}_${index}`,
      label: String(field?.label || '').trim(),
      type: String(field?.type || '').trim(),
      required: Boolean(field?.required),
      options: field?.options ?? ''
    })).filter((field) => field.label && field.type)
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
      questionFields: normalizedCustomFields
    }
  }

  const mapTemplate = (template) => ({
    id: Number(template.id ?? template.templateId),
    name: template.name || template.title || '',
    title: template.title || template.name || '',
    createdAt: template.createdAt || '',
    updatedAt: template.updatedAt || '',
    status: normalizeTemplateStatus(template.status ?? template.templateStatus ?? template.useStatus),
    used: Boolean(template.used),
    recruitmentCount: Number(template.recruitmentCount || 0),
    customFields: parseCustomFields(
      template.customFields ??
      template.questions ??
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
      templates.value = rawTemplates.map(mapTemplate)
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
    fetchInterviewSchedules,
    fetchTemplates,
    fetchApplicationTemplates,
    addTemplate,
    updateTemplate,
    updateTemplateStatus,
    deleteTemplate,
    updateJob,
    deleteJob
  }
})


