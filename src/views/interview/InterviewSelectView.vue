<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRecruitmentStore } from '@/stores/recruitment'
import { storeToRefs } from 'pinia'
import { recruitmentApi } from '@/api/recruitment'
import { interviewApi } from '@/api/interview'

const router = useRouter()
const route = useRoute()

const recruitmentStore = useRecruitmentStore()
const { jobs } = storeToRefs(recruitmentStore)

const currentStep = ref(1)
const jobId = Number(route.query.jobId)
const recruitmentDetail = ref(null)
const pendingInterviewStages = ref([])
const isLoadingApplicants = ref(false)

const recruitment = computed(() => {
  const job = jobs.value.find((item) => Number(item.id) === Number(jobId))
  const detail = recruitmentDetail.value

  if (!job && !detail) {
    return { title: '공고 정보를 불러올 수 없습니다.', stages: [], assignees: [] }
  }

  return {
    ...(job || {}),
    ...(detail || {}),
    title: detail?.title || job?.title || '공고 정보를 불러올 수 없습니다.',
    stages: Array.isArray(detail?.stages)
      ? detail.stages
      : Array.isArray(job?.stages)
        ? job.stages
        : [],
    assignees: Array.isArray(job?.assignees) ? job.assignees : []
  }
})

const interviewSteps = computed(() => {
  if (Array.isArray(pendingInterviewStages.value) && pendingInterviewStages.value.length > 0) {
    return pendingInterviewStages.value.map((stage) => ({
      id: stage.recruitmentStageId,
      step: stage.stageName,
      count: stage.pendingApplicantCount || 0,
      stageStep: stage.stageStep,
      applicants: Array.isArray(stage.applicants)
        ? stage.applicants
          .map((applicant) => {
            const applicantId = Number(applicant?.applicantId)
            const applicationId = Number(applicant?.applicationId)
            if (!Number.isFinite(applicantId) || !Number.isFinite(applicationId)) return null

            return {
              id: applicantId,
              applicantId,
              applicationId,
              name: applicant?.name ?? '-',
              email: applicant?.email ?? '-'
            }
          })
          .filter(Boolean)
        : []
    }))
  }

  if (Array.isArray(recruitment.value.stages) && recruitment.value.stages.length > 0) {
    return recruitment.value.stages
      .filter((stage) => stage?.stageType === 'INTERVIEW' || String(stage?.stageName || '').includes('면접'))
      .map((stage) => ({
        id: stage.id,
        step: stage.stageName,
        count: 0,
        stageStep: stage.stageStep,
        applicants: []
      }))
  }

  if (Array.isArray(recruitment.value.funnel)) {
    return recruitment.value.funnel.filter((stage) => stage.step && stage.step.includes('면접'))
  }

  return []
})

const selectedStep = ref(null)

watch(
  interviewSteps,
  (steps) => {
    if (steps.length === 0) {
      selectedStep.value = null
      return
    }

    const matchedStep = steps.find((step) => step.id === selectedStep.value?.id)
    if (matchedStep) {
      selectedStep.value = matchedStep
      return
    }

    if (steps.length === 1) {
      selectedStep.value = steps[0]
    }
  },
  { immediate: true }
)

const selectStep = (step) => {
  selectedStep.value = step
}

const searchInterviewer = ref('')
const selectedInterviewers = ref([])

const getInterviewerUserId = (interviewer) => {
  const rawId = Number(interviewer?.userId ?? interviewer?.id ?? interviewer?.memberId)
  return Number.isFinite(rawId) && rawId > 0 ? rawId : null
}

const assignedInterviewers = computed(() => {
  const job = jobs.value.find((item) => Number(item.id) === Number(jobId))
  const detailInterviewers = Array.isArray(recruitmentDetail.value?.interviewers)
    ? recruitmentDetail.value.interviewers
    : []
  const assignees = Array.isArray(job?.assignees) ? job.assignees : []

  const normalizedFromDetail = detailInterviewers
    .map((interviewer) => ({
      id: getInterviewerUserId(interviewer),
      userId: getInterviewerUserId(interviewer),
      name: String(interviewer?.name || '').trim(),
      label: '담당 면접관'
    }))
    .filter((interviewer) => Number.isFinite(interviewer.id) && interviewer.name)

  if (normalizedFromDetail.length > 0) {
    return normalizedFromDetail
  }

  return assignees
    .map((assignee) => ({
      id: getInterviewerUserId(assignee),
      userId: getInterviewerUserId(assignee),
      name: String(assignee?.name || '').trim(),
      label: '담당 면접관'
    }))
    .filter((assignee) => Number.isFinite(assignee.id) && assignee.name)
})

const filteredInterviewers = computed(() => {
  const keyword = searchInterviewer.value.trim().toLowerCase()
  if (!keyword) return assignedInterviewers.value

  return assignedInterviewers.value.filter((member) =>
    member.name.toLowerCase().includes(keyword)
  )
})

const toggleInterviewer = (member) => {
  const targetUserId = getInterviewerUserId(member)
  if (!targetUserId) return

  const index = selectedInterviewers.value.findIndex((item) => item.id === targetUserId)
  if (index > -1) {
    selectedInterviewers.value.splice(index, 1)
    return
  }
  selectedInterviewers.value.push({
    ...member,
    id: targetUserId,
    userId: targetUserId
  })
}

const removeInterviewer = (id) => {
  const index = selectedInterviewers.value.findIndex((item) => item.id === id)
  if (index > -1) {
    selectedInterviewers.value.splice(index, 1)
  }
}

watch(
  assignedInterviewers,
  (members) => {
    const allowedIds = new Set(members.map((member) => getInterviewerUserId(member)).filter(Boolean))
    selectedInterviewers.value = selectedInterviewers.value.filter((member) =>
      allowedIds.has(getInterviewerUserId(member))
    )
  },
  { immediate: true }
)

const searchApplicant = ref('')
const selectedApplicants = ref([])

const applicants = computed(() => {
  return Array.isArray(selectedStep.value?.applicants) ? selectedStep.value.applicants : []
})

const filteredApplicants = computed(() => {
  const keyword = searchApplicant.value.trim().toLowerCase()
  if (!keyword) return applicants.value

  return applicants.value.filter((applicant) => {
    const name = String(applicant.name || '').toLowerCase()
    const email = String(applicant.email || '').toLowerCase()
    return name.includes(keyword) || email.includes(keyword)
  })
})

const toggleApplicant = (applicant) => {
  const index = selectedApplicants.value.findIndex((item) => item.id === applicant.id)
  if (index > -1) {
    selectedApplicants.value.splice(index, 1)
    return
  }
  selectedApplicants.value.push(applicant)
}

const removeApplicant = (id) => {
  const index = selectedApplicants.value.findIndex((item) => item.id === id)
  if (index > -1) {
    selectedApplicants.value.splice(index, 1)
  }
}

watch(
  applicants,
  (items) => {
    const allowedIds = new Set(items.map((item) => item.id))
    selectedApplicants.value = selectedApplicants.value.filter((item) => allowedIds.has(item.id))
  },
  { immediate: true }
)

const canProceed = computed(() => {
  if (currentStep.value === 1) return !!selectedStep.value
  if (currentStep.value === 2) return selectedInterviewers.value.length > 0
  if (currentStep.value === 3) return selectedApplicants.value.length > 0
  return false
})

const goNext = () => {
  if (!canProceed.value) return

  if (currentStep.value < 3) {
    currentStep.value += 1
    return
  }

  const stageText = selectedStep.value?.step || ''
  const stepNo = Number(selectedStep.value?.stageStep || 1)
  const round = stepNo >= 2 || stageText.includes('2차') ? 'SECOND' : 'FIRST'

  router.push({
    path: '/recruitment/interview/schedule',
    query: {
      recruitmentId: jobId,
      recruitmentTitle: recruitment.value?.title || '',
      recruitmentStageId: selectedStep.value?.id ?? '',
      round,
      stage: selectedStep.value?.step || '',
      interviewers: JSON.stringify(selectedInterviewers.value),
      applicants: JSON.stringify(selectedApplicants.value)
    }
  })
}

const goPrev = () => {
  if (currentStep.value > 1) {
    currentStep.value -= 1
    return
  }
  router.back()
}

const loadPendingApplicants = async () => {
  if (!jobId) return

  isLoadingApplicants.value = true
  try {
    const response = await interviewApi.getPendingApplicants(jobId)
    const payload = interviewApi.extractResponseData(response)
    pendingInterviewStages.value = Array.isArray(payload) ? payload : []
  } catch (error) {
    pendingInterviewStages.value = []
    console.error('면접 단계별 대기 지원자 조회 실패:', error)
  } finally {
    isLoadingApplicants.value = false
  }
}

onMounted(async () => {
  if (!jobs.value.length) {
    await recruitmentStore.fetchRecruitments().catch((error) => {
      console.error('채용 공고 데이터 조회 실패:', error)
    })
  }

  if (jobId) {
    await recruitmentApi
      .getRecruitmentDetail(jobId)
      .then((response) => {
        recruitmentDetail.value = response?.data?.data || null
      })
      .catch((error) => {
        console.error('채용 공고 상세 조회 실패:', error)
      })
    await loadPendingApplicants()
  }
})
</script>

<template>
  <div class="page">
    <div class="header">
      <div class="flex flex-col gap-1">
        <span class="text-xs font-bold text-slate-500">일정 생성</span>
        <h1 class="title">{{ recruitment.title }}</h1>
      </div>

      <div class="flex items-center gap-2">
        <div v-for="step in 3" :key="step" class="flex items-center">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300"
            :class="step <= currentStep ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-500'"
          >
            {{ step }}
          </div>
          <div v-if="step < 3" class="w-8 h-0.5 mx-2" :class="step < currentStep ? 'bg-brand-600' : 'bg-slate-200'"></div>
        </div>
      </div>
    </div>

    <div class="content-area">
      <div v-if="currentStep === 1" class="step-container animate-fade-in">
        <h2 class="step-title">어떤 면접을 진행하시나요?</h2>
        <p class="step-desc">진행할 면접 단계를 선택해주세요.</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 max-w-2xl">
          <div
            v-for="step in interviewSteps"
            :key="step.id"
            @click="selectStep(step)"
            class="p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md flex items-center justify-between group"
            :class="selectedStep?.id === step.id ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 bg-white hover:border-brand-300'"
          >
            <div>
              <h3 class="font-bold text-lg text-slate-800 group-hover:text-brand-700">{{ step.step }}</h3>
              <p class="text-sm text-slate-500 mt-1">대기중인 지원자: <span class="font-bold text-slate-800">{{ step.count || 0 }}명</span></p>
            </div>
            <div
              class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
              :class="selectedStep?.id === step.id ? 'border-brand-600 bg-brand-600' : 'border-slate-300'"
            >
              <svg v-if="selectedStep?.id === step.id" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        <div v-if="interviewSteps.length === 0" class="mt-8 p-8 bg-slate-50 rounded-xl border border-dotted border-slate-300 text-center">
          <p class="text-slate-500 font-bold">이 공고에는 예정된 면접 단계가 없습니다.</p>
          <p class="text-slate-400 text-sm mt-1">공고 관리에서 전형 단계를 수정해주세요.</p>
        </div>
      </div>

      <div v-else-if="currentStep === 2" class="step-container animate-fade-in">
        <h2 class="step-title">면접관을 선택해주세요</h2>
        <p class="step-desc">채용공고에 실제로 지정된 면접관만 표시됩니다.</p>

        <div class="flex gap-6 mt-4 h-[500px]">
          <div class="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-slate-100 bg-slate-50">
              <input
                v-model="searchInterviewer"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-brand-500 text-sm"
                placeholder="이름으로 검색..."
              >
            </div>
            <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              <div
                v-for="member in filteredInterviewers"
                :key="member.id"
                @click="toggleInterviewer(member)"
                class="flex items-center p-3 rounded-lg cursor-pointer transition-colors"
                :class="selectedInterviewers.find((item) => item.id === getInterviewerUserId(member)) ? 'bg-brand-50 border border-brand-200' : 'hover:bg-slate-50 border border-transparent'"
              >
                <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 mr-3">
                  {{ member.name[0] }}
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-sm text-slate-900">{{ member.name }}</span>
                  </div>
                  <div class="text-xs text-slate-500">{{ member.label }}</div>
                </div>
                <div
                  class="w-5 h-5 rounded border flex items-center justify-center"
                  :class="selectedInterviewers.find((item) => item.id === getInterviewerUserId(member)) ? 'bg-brand-600 border-brand-600' : 'border-slate-300'"
                >
                  <svg v-if="selectedInterviewers.find((item) => item.id === getInterviewerUserId(member))" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <div v-if="filteredInterviewers.length === 0" class="h-40 flex flex-col items-center justify-center text-slate-400">
                <p class="text-xs">선택 가능한 면접관이 없습니다.</p>
              </div>
            </div>
          </div>

          <div class="w-80 flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <div class="p-4 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
              <span>선택됨 ({{ selectedInterviewers.length }})</span>
              <button
                @click="selectedInterviewers = []"
                class="text-xs text-rose-500 hover:text-rose-700"
                :disabled="!selectedInterviewers.length"
              >
                전체 해제
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              <div v-if="selectedInterviewers.length === 0" class="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <p>선택된 면접관이 없습니다.</p>
              </div>
              <div
                v-for="member in selectedInterviewers"
                :key="member.id"
                class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between animate-fade-in-up"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                    {{ member.name[0] }}
                  </div>
                  <div>
                    <div class="font-bold text-sm text-slate-900">{{ member.name }}</div>
                    <div class="text-xs text-slate-500">{{ member.label }}</div>
                  </div>
                </div>
                <button @click="removeInterviewer(member.id)" class="text-slate-400 hover:text-slate-600 p-1">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="step-container animate-fade-in">
        <h2 class="step-title">지원자를 선택해주세요</h2>
        <p class="step-desc">선택한 면접 단계에서 대기중인 지원자만 표시됩니다.</p>

        <div class="flex gap-6 mt-6 h-[500px]">
          <div class="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-slate-100 bg-slate-50">
              <input
                v-model="searchApplicant"
                class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-brand-500 text-sm"
                placeholder="이름, 이메일로 검색..."
              >
            </div>
            <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              <div v-if="isLoadingApplicants" class="h-40 flex flex-col items-center justify-center text-slate-400">
                <p class="text-xs">지원자 목록을 불러오는 중입니다.</p>
              </div>

              <template v-else>
                <div
                  v-for="app in filteredApplicants"
                  :key="app.id"
                  @click="toggleApplicant(app)"
                  class="flex items-center p-3 rounded-lg cursor-pointer transition-colors"
                  :class="selectedApplicants.find((item) => item.id === app.id) ? 'bg-brand-50 border border-brand-200' : 'hover:bg-slate-50 border border-transparent'"
                >
                  <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-600 mr-3">
                    {{ app.name[0] }}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-sm text-slate-900">{{ app.name }}</span>
                      <span class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold border border-slate-200">{{ selectedStep?.step || '면접 단계' }}</span>
                    </div>
                    <div class="text-xs text-slate-500">{{ app.email }}</div>
                  </div>
                  <div
                    class="w-5 h-5 rounded border flex items-center justify-center"
                    :class="selectedApplicants.find((item) => item.id === app.id) ? 'bg-brand-600 border-brand-600' : 'border-slate-300'"
                  >
                    <svg v-if="selectedApplicants.find((item) => item.id === app.id)" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                <div v-if="filteredApplicants.length === 0" class="h-40 flex flex-col items-center justify-center text-slate-400">
                  <p class="text-xs">선택 가능한 지원자가 없습니다.</p>
                </div>
              </template>
            </div>
          </div>

          <div class="w-80 flex flex-col bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
            <div class="p-4 border-b border-slate-200 font-bold text-slate-700 flex justify-between items-center">
              <span>선택됨 ({{ selectedApplicants.length }})</span>
              <button
                @click="selectedApplicants = []"
                class="text-xs text-rose-500 hover:text-rose-700"
                :disabled="!selectedApplicants.length"
              >
                전체 해제
              </button>
            </div>
            <div class="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              <div v-if="selectedApplicants.length === 0" class="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                <p>선택된 지원자가 없습니다.</p>
              </div>
              <div
                v-for="app in selectedApplicants"
                :key="app.id"
                class="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between animate-fade-in-up"
              >
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-xs font-bold text-amber-600">
                    {{ app.name[0] }}
                  </div>
                  <div>
                    <div class="font-bold text-sm text-slate-900">{{ app.name }}</div>
                    <div class="text-xs text-slate-500">{{ app.email }}</div>
                  </div>
                </div>
                <button @click="removeApplicant(app.id)" class="text-slate-400 hover:text-slate-600 p-1">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="footer">
      <button @click="goPrev" class="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 md:w-auto w-full">
        {{ currentStep === 1 ? '취소' : '이전 단계' }}
      </button>
      <button
        @click="goNext"
        :disabled="!canProceed"
        class="px-8 py-3 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-all disabled:opacity-50 disabled:shadow-none md:w-auto w-full"
      >
        {{ currentStep === 3 ? '일정 생성하기' : '다음 단계' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 1000px;
  margin: 0 auto;
  min-height: 500px;
  padding: 40px 20px;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 40px;
}

.title {
  font-size: 24px;
  font-weight: 800;
  color: #0f172a;
  letter-spacing: -0.02em;
}

.step-title {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 8px;
}

.step-desc {
  color: #64748b;
  font-size: 14px;
}

.content-area {
  flex: 1;
}

.footer {
  margin-top: 40px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid #e2e8f0;
  padding-top: 24px;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in {
  animation: fade-in 0.3s ease-out forwards;
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fade-in-up 0.2s ease-out forwards;
}
</style>
