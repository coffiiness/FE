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

  return { jobs, addJob, deleteJob, updateJob }
})
