import { defineStore } from 'pinia'
import { ref } from 'vue'
import { recruitmentApi } from '@/api/recruitment'

export const useRecruitmentStore = defineStore('recruitment', () => {
  const jobs = ref([])
  const loading = ref(false)
  const error = ref(null)
  const interviewSchedules = ref([])

  // ── 채용 공고 목록 조회 (GET) ──
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

  // ── 채용 공고 생성 (POST) ──
  const createRecruitment = async (data) => {
    loading.value = true
    error.value = null
    try {
      const res = await recruitmentApi.createRecruitment(data)
      return res.data.data // 생성된 recruitmentId 반환
    } catch (err) {
      error.value = parseError(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // ── 채용 공고 수정 (PUT) ──
  const updateRecruitment = async (recruitmentId, data) => {
    loading.value = true
    error.value = null
    try {
      const res = await recruitmentApi.updateRecruitment(recruitmentId, data)
      const updated = res.data.data || null

      // 서버가 상세 응답을 내려줄 경우 목록에도 반영
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

  // ── 채용 공고 삭제 (DELETE) ──
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

  // ── 기존 화면 호환용: 로컬 공고 갱신 ──
  const updateJob = (updatedJob) => {
    const index = jobs.value.findIndex((job) => Number(job.id) === Number(updatedJob?.id))
    if (index === -1) return
    jobs.value[index] = { ...jobs.value[index], ...updatedJob }
  }

  // ── 기존 화면 호환용: 삭제 API 연결 ──
  const deleteJob = async (id) => {
    return deleteRecruitment(id)
  }

  // ── 면접 일정 조회 (GET) ──
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

  // ── 에러 파싱 ──
  const parseError = (err) => {
    const status = err.response?.status
    const message = err.response?.data?.message

    if (status === 400) {
      return { type: 'VALIDATION', message: message || '입력값을 확인해주세요.' }
    }
    if (status === 403 || (status === 400 && message?.includes('권한'))) {
      return { type: 'FORBIDDEN', message: '접근 권한이 없습니다.' }
    }
    if (status === 401) {
      return { type: 'UNAUTHORIZED', message: '로그인이 필요합니다.' }
    }
    if (status === 404) {
      return { type: 'NOT_FOUND', message: message || '대상을 찾을 수 없습니다.' }
    }
    if (status === 409) {
      return { type: 'CONFLICT', message: message || '현재 상태에서는 처리할 수 없습니다.' }
    }
    return { type: 'SERVER_ERROR', message: '일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }
  }

  // ── 기존 호환용 (templates 관련) ──
  const templates = ref([
    { id: 1, name: '백엔드 개발자 지원서', title: '백엔드 개발자 지원서', createdAt: '2024.01.15', updatedAt: '2024.01.20', status: '사용중', customFields: [{ id: 'intro', label: '자기소개', type: 'long_text', required: true }] },
    { id: 2, name: '프론트엔드 개발자 지원서', title: '프론트엔드 개발자 지원서', createdAt: '2024.01.18', updatedAt: '2024.01.25', status: '사용중', customFields: [] },
  ])

  const addTemplate = (template) => {
    const maxId = templates.value.length > 0 ? Math.max(...templates.value.map(t => t.id)) : 0
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '.')
    templates.value.unshift({
      id: maxId + 1, name: template.title, title: template.title,
      status: '미사용', createdAt: today, updatedAt: '',
      customFields: template.customFields || []
    })
  }

  const updateTemplate = (updatedTemplate) => {
    const index = templates.value.findIndex(t => t.id === updatedTemplate.id)
    if (index !== -1) {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '.')
      templates.value[index] = {
        ...templates.value[index], ...updatedTemplate,
        name: updatedTemplate.title, updatedAt: today
      }
    }
  }

  const deleteTemplate = (id) => {
    templates.value = templates.value.filter(t => t.id !== id)
  }

  return {
    jobs, loading, error, interviewSchedules,
    fetchRecruitments, createRecruitment, updateRecruitment, deleteRecruitment, updateJob, deleteJob, fetchInterviewSchedules,
    templates, addTemplate, updateTemplate, deleteTemplate
  }
})
