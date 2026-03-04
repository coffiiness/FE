import { defineStore } from 'pinia'
import { ref } from 'vue'
import recruitmentData from '@/data/recruitment.json'

export const useRecruitmentStore = defineStore('recruitment', () => {
  const jobs = ref(recruitmentData)

  const addJob = (job) => {
    // ID 생성 로직 (기존 max ID + 1)
    const maxId = jobs.value.length > 0 ? Math.max(...jobs.value.map(j => j.id)) : 0
    const newJob = {
      ...job,
      id: maxId + 1,
      createdAt: new Date().toISOString().split('T')[0],
      totalApplicants: 0,
      status: 'active', // 기본 상태
      dday: 'D-New', // D-Day 계산 로직은 별도로 필요할 수 있음
      ddayValue: 99,
      funnel: job.processes ? job.processes.map(p => ({ step: p.stageName, count: 0, active: false })) : [
        { step: '서류', count: 0, active: true }
      ]
    }

    // D-Day 계산
    if (job.endDate) {
      const end = new Date(job.endDate)
      const now = new Date()
      const diffTime = end - now
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      newJob.ddayValue = diffDays
      newJob.dday = diffDays > 0 ? `D-${diffDays}` : (diffDays === 0 ? 'D-Day' : '마감')
      if (diffDays <= 0) newJob.status = 'closed'
      else if (diffDays <= 3) newJob.status = 'urgent'
    }

    jobs.value.unshift(newJob)
  }

  const deleteJob = (id) => {
    jobs.value = jobs.value.filter(job => job.id !== id)
  }

  const updateJob = (updatedJob) => {
    const index = jobs.value.findIndex(job => job.id === updatedJob.id)
    if (index !== -1) {
      jobs.value[index] = updatedJob
    }
  }

  const templates = ref([
    { id: 1, name: '백엔드 개발자 지원서', title: '백엔드 개발자 지원서', createdAt: '2024.01.15', updatedAt: '2024.01.20', status: '사용중', customFields: [{ id: 'intro', label: '자기소개', type: 'long_text', required: true }] },
    { id: 2, name: '프론트엔드 개발자 지원서', title: '프론트엔드 개발자 지원서', createdAt: '2024.01.18', updatedAt: '2024.01.25', status: '사용중', customFields: [] },
  ])

  // 템플릿 생성 (생성 페이지에서 호출)
  const addTemplate = (template) => {
    const maxId = templates.value.length > 0 ? Math.max(...templates.value.map(t => t.id)) : 0
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '.') // YYYY.MM.DD 형식

    templates.value.unshift({
      id: maxId + 1,
      name: template.title,
      title: template.title,
      status: '미사용',
      createdAt: today,
      updatedAt: '',
      customFields: template.customFields || []
    })
  }

  // 템플릿 수정 (편집 페이지에서 호출)
  const updateTemplate = (updatedTemplate) => {
    const index = templates.value.findIndex(t => t.id === updatedTemplate.id)
    if (index !== -1) {
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '.')
      templates.value[index] = {
        ...templates.value[index],
        ...updatedTemplate,
        name: updatedTemplate.title,
        updatedAt: today
      }
    }
  }

  // 템플릿 삭제 (목록 페이지에서 호출)
  const deleteTemplate = (id) => {
    templates.value = templates.value.filter(t => t.id !== id)
  }

  return { jobs, addJob, deleteJob, updateJob,
    templates, addTemplate, updateTemplate, deleteTemplate }
})
