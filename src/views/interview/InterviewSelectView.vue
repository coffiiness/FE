<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRecruitmentStore } from '@/stores/recruitment'
import { useOrganizationStore } from '@/stores/organization'
import { storeToRefs } from 'pinia'
import { recruitmentApi } from '@/api/recruitment'

const router = useRouter()
const route = useRoute()

// Stores
const recruitmentStore = useRecruitmentStore()
const organizationStore = useOrganizationStore()
const { jobs } = storeToRefs(recruitmentStore)
const { organizations: organization } = storeToRefs(organizationStore)
const recruitmentDetail = ref(null)

// State
const currentStep = ref(1) // 1: 단계, 2: 면접관, 3: 지원자
const jobId = Number(route.query.jobId)

/* 
  1. 채용 공고 & 전형 단계 데이터
*/
const recruitment = computed(() => {
  const job = jobs.value.find(j => Number(j.id) === Number(jobId))
  const detail = recruitmentDetail.value

  if (!job && !detail) {
    return { title: '공고 정보를 불러올 수 없습니다.', stages: [], team: '' }
  }

  const source = {
    ...(job || {}),
    ...(detail || {}),
    assignees: Array.isArray(job?.assignees) ? job.assignees : detail?.interviewers || []
  }

  return {
    ...source,
    title: source.title || '공고 정보를 불러올 수 없습니다.',
    stages: Array.isArray(source.stages) ? source.stages : [],
    team: source.leadGroupName || source.team || ''
  }
})

// API stages 기준으로 면접 단계만 필터링 (기존 funnel 형식도 호환)
const interviewSteps = computed(() => {
  if (Array.isArray(recruitment.value.stages) && recruitment.value.stages.length > 0) {
    return recruitment.value.stages
      .filter((s) => s?.stageType === 'INTERVIEW' || String(s?.stageName || '').includes('면접'))
      .map((s) => ({
        id: s.id,
        step: s.stageName,
        count: s.applicantCount || 0,
        stageStep: s.stageStep
      }))
  }
  if (Array.isArray(recruitment.value.funnel)) {
    return recruitment.value.funnel.filter((s) => s.step && s.step.includes('면접'))
  }
  return []
})

const selectedStep = ref(null)

// 단계가 하나뿐이면 자동 선택
watch(interviewSteps, (steps) => {
  if (steps.length === 1 && !selectedStep.value) {
    selectedStep.value = steps[0]
  }
}, { immediate: true })

const selectStep = (step) => {
  selectedStep.value = step
}

/* 
  2. 면접관 데이터 (조직도 기반)
*/
const searchInterviewer = ref('')
const selectedInterviewers = ref([])

const selectedFilterTeams = ref([])

const configuredInterviewerIds = computed(() => {
  const explicitIds = Array.isArray(recruitment.value?.interviewerIds)
    ? recruitment.value.interviewerIds
    : []
  const detailInterviewers = Array.isArray(recruitmentDetail.value?.interviewers)
    ? recruitmentDetail.value.interviewers
    : []
  const assignees = Array.isArray(recruitment.value?.assignees) ? recruitment.value.assignees : []
  return new Set(
    [...explicitIds, ...assignees.map((a) => a?.id), ...detailInterviewers.map((a) => a?.memberId)]
      .map((id) => Number(id))
      .filter((id) => Number.isFinite(id))
  )
})

// 2-2. 팀 필터 토글
const toggleTeamFilter = (teamId) => {
  const idx = selectedFilterTeams.value.indexOf(teamId)
  if (idx > -1) {
    selectedFilterTeams.value.splice(idx, 1)
  } else {
    selectedFilterTeams.value.push(teamId)
  }
}

// 전체 직원 목록 Flatten (기존 유지)
const allEmployees = computed(() => {
  const employees = []
  organization.value.forEach(dept => {
    dept.teams.forEach(team => {
      team.members.forEach(member => {
        const memberId = Number(member.id)
        const isRecomm = configuredInterviewerIds.value.has(memberId)
        employees.push({
          ...member,
          deptName: dept.name,
          teamName: team.name,
          teamId: team.id, // 팀 ID 추가
          isRecommended: isRecomm
        })
      })
    })
  })
  return employees
})

const allowedInterviewers = computed(() => {
  return allEmployees.value
    .filter((member) => member.isRecommended)
    .sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'))
})

const allTeams = computed(() => {
  const allowedTeamIds = new Set(allowedInterviewers.value.map((member) => Number(member.teamId)))
  return organization.value
    .flatMap((dept) =>
      dept.teams
        .filter((team) => allowedTeamIds.has(Number(team.id)))
        .map((team) => ({ id: team.id, name: team.name }))
    )
})

const filteredInterviewers = computed(() => {
  // 1. 팀 필터 적용
  let filtered = allowedInterviewers.value
  
  if (selectedFilterTeams.value.length > 0) {
      filtered = filtered.filter(e => selectedFilterTeams.value.includes(e.teamId))
  }

  // 2. 검색어 필터 적용
  const k = searchInterviewer.value.trim().toLowerCase()
  if (!k) return filtered

  return filtered.filter(e => 
    e.name.toLowerCase().includes(k) || 
    e.teamName.toLowerCase().includes(k) ||
    e.position.toLowerCase().includes(k)
  )
})

const toggleInterviewer = (member) => {
  const idx = selectedInterviewers.value.findIndex(i => i.id === member.id)
  if (idx > -1) {
    selectedInterviewers.value.splice(idx, 1)
  } else {
    selectedInterviewers.value.push(member)
  }
}

const removeInterviewer = (id) => {
  const idx = selectedInterviewers.value.findIndex(i => i.id === id)
  if (idx > -1) selectedInterviewers.value.splice(idx, 1)
}

watch(
  allowedInterviewers,
  (members) => {
    const allowedIds = new Set(members.map((m) => Number(m.id)))
    selectedInterviewers.value = selectedInterviewers.value.filter((m) =>
      allowedIds.has(Number(m.id))
    )
  },
  { immediate: true }
)

watch(
  allTeams,
  (teams) => {
    const availableTeamIds = new Set(teams.map((t) => Number(t.id)))
    const nextSelected = selectedFilterTeams.value.filter((id) => availableTeamIds.has(Number(id)))
    selectedFilterTeams.value = nextSelected.length ? nextSelected : teams.map((t) => t.id)
  },
  { immediate: true }
)

/* 
  3. 지원자 데이터 (Mock + Store 연동 예시)
*/
import applicantData from '@/data/applicant.json'

const applicants = computed(() => {
  return applicantData.filter(a => a.recruitmentId === jobId)
})

const searchApplicant = ref('')
const selectedApplicants = ref([])

const filteredApplicants = computed(() => {
  const k = searchApplicant.value.trim().toLowerCase()
  if (!k) return applicants.value
  return applicants.value.filter(a => 
    a.name.toLowerCase().includes(k) ||
    a.email.toLowerCase().includes(k)
  )
})

const toggleApplicant = (applicant) => {
  const idx = selectedApplicants.value.findIndex(a => a.id === applicant.id)
  if (idx > -1) {
    selectedApplicants.value.splice(idx, 1)
  } else {
    selectedApplicants.value.push(applicant)
  }
}

const removeApplicant = (id) => {
  const idx = selectedApplicants.value.findIndex(a => a.id === id)
  if (idx > -1) selectedApplicants.value.splice(idx, 1)
}


/* 네비게이션 */
const canProceed = computed(() => {
  if (currentStep.value === 1) return !!selectedStep.value
  if (currentStep.value === 2) return selectedInterviewers.value.length > 0
  if (currentStep.value === 3) return selectedApplicants.value.length > 0
  return false
})

const goNext = () => {
  if (!canProceed.value) return
  if (currentStep.value < 3) {
    currentStep.value++
  } else {
    const stageText = selectedStep.value?.step || ''
    const stepNo = Number(selectedStep.value?.stageStep || 1)
    const round = stepNo >= 2 || stageText.includes('2차') ? 'SECOND' : 'FIRST'
    // 최종 완료 -> 일정 생성 페이지로 이동
    router.push({
      path: '/recruitment/interview/schedule',
      query: {
        recruitmentId: jobId,
        recruitmentTitle: recruitment.value?.title || '',
        recruitmentStageId: selectedStep.value?.id ?? '',
        round,
        stage: selectedStep.value.step,
        interviewers: JSON.stringify(selectedInterviewers.value),
        applicants: JSON.stringify(selectedApplicants.value)
      }
    })
  }
}

const goPrev = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  } else {
    router.back()
  }
}

/* 초기화 */
onMounted(() => {
  // 공고 ID가 없으면 돌아가기 등 예외처리
  if (!jobId) {
    // alert('잘못된 접근입니다.')
    // router.back()
  }
  if (!jobs.value.length) {
    recruitmentStore.fetchRecruitments().catch((error) => {
      console.error('채용 공고 데이터 조회 실패:', error)
    })
  }
  if (jobId) {
    recruitmentApi
      .getRecruitmentDetail(jobId)
      .then((res) => {
        recruitmentDetail.value = res?.data?.data || null
      })
      .catch((error) => {
        console.error('채용 공고 상세 조회 실패:', error)
      })
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
      
      <!-- Progress Steps -->
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
      
      <!-- Step 1: 면접 단계 선택 -->
      <div v-if="currentStep === 1" class="step-container animate-fade-in">
        <h2 class="step-title">어떤 면접을 진행하시나요?</h2>
        <p class="step-desc">진행할 면접 단계를 선택해주세요.</p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 max-w-2xl">
          <div 
            v-for="(step, idx) in interviewSteps" 
            :key="idx"
            @click="selectStep(step)"
            class="p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md flex items-center justify-between group"
            :class="selectedStep?.step === step.step ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500' : 'border-slate-200 bg-white hover:border-brand-300'"
          >
            <div>
              <h3 class="font-bold text-lg text-slate-800 group-hover:text-brand-700">{{ step.step }}</h3>
              <p class="text-sm text-slate-500 mt-1">대기중인 지원자: <span class="font-bold text-slate-800">{{ step.count || 0 }}명</span></p>
            </div>
            <div 
              class="w-6 h-6 rounded-full border-2 flex items-center justify-center"
              :class="selectedStep?.step === step.step ? 'border-brand-600 bg-brand-600' : 'border-slate-300'"
            >
              <svg v-if="selectedStep?.step === step.step" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

      <!-- Step 2: 면접관 선택 -->
      <div v-else-if="currentStep === 2" class="step-container animate-fade-in">
        <h2 class="step-title">면접관을 선택해주세요</h2>
        <p class="step-desc">공고 생성 시 지정한 면접관만 표시됩니다.</p>

        <div class="mt-4 mb-2 flex items-center gap-3">
          <span class="text-xs font-bold text-slate-800 bg-slate-100 border border-slate-300 rounded-md px-2 py-1">
            선택된 인원 {{ selectedInterviewers.length }}명
          </span>
        </div>

        <!-- 팀 필터 -->
        <div class="mt-4 mb-2">
            <span class="text-xs font-bold text-slate-500 mb-2 block">팀 선택</span>
            <div class="flex flex-wrap gap-2">
                <button 
                  v-for="team in allTeams" 
                  :key="team.id"
                  @click="toggleTeamFilter(team.id)"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all border"
                  :class="selectedFilterTeams.includes(team.id) 
                    ? 'bg-brand-600 border-brand-600 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600'"
                >
                  {{ team.name }}
                </button>
            </div>
        </div>

        <div class="flex gap-6 mt-4 h-[500px]">
          <!-- 왼쪽: 검색 및 목록 -->
          <div class="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-slate-100 bg-slate-50">
               <input 
                 v-model="searchInterviewer" 
                 class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-brand-500 text-sm"
                 placeholder="이름, 직급으로 검색..."
               >
            </div>
            <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              <div 
                v-for="member in filteredInterviewers" 
                :key="member.id"
                @click="toggleInterviewer(member)"
                class="flex items-center p-3 rounded-lg cursor-pointer transition-colors"
                :class="selectedInterviewers.find(i => i.id === member.id)
                  ? 'bg-brand-50 border border-brand-200'
                  : 'hover:bg-slate-50 border border-transparent'"
              >
                <div class="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 mr-3">
                  {{ member.name[0] }}
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                     <span class="font-bold text-sm text-slate-900">{{ member.name }}</span>
                  </div>
                  <div class="text-xs text-slate-500">{{ member.teamName }} · {{ member.position }}</div>
                </div>
                <div 
                   class="w-5 h-5 rounded border flex items-center justify-center"
                   :class="selectedInterviewers.find(i => i.id === member.id) ? 'bg-brand-600 border-brand-600' : 'border-slate-300'"
                >
                   <svg v-if="selectedInterviewers.find(i => i.id === member.id)" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                   </svg>
                </div>
              </div>
              
              <!-- 필터 결과 없음 -->
              <div v-if="filteredInterviewers.length === 0" class="h-40 flex flex-col items-center justify-center text-slate-400">
                  <p class="text-xs">해당 팀/검색어에 맞는 면접관이 없습니다.</p>
              </div>
            </div>
          </div>

          <!-- 오른쪽: 선택된 면접관 -->
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
                        <div class="text-xs text-slate-500">{{ member.teamName }}</div>
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

       <!-- Step 3: 지원자 선택 -->
       <div v-else class="step-container animate-fade-in">
        <h2 class="step-title">지원자를 선택해주세요</h2>
        <p class="step-desc">면접을 진행할 지원자를 선택해주세요.</p>

        <div class="flex gap-6 mt-6 h-[500px]">
          <!-- 왼쪽: 검색 및 목록 -->
          <div class="flex-1 flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div class="p-4 border-b border-slate-100 bg-slate-50">
               <input 
                 v-model="searchApplicant" 
                 class="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:border-brand-500 text-sm"
                 placeholder="이름, 이메일로 검색..."
               >
            </div>
            <div class="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              <div 
                v-for="app in filteredApplicants" 
                :key="app.id"
                @click="toggleApplicant(app)"
                class="flex items-center p-3 rounded-lg cursor-pointer transition-colors"
                :class="selectedApplicants.find(a => a.id === app.id) ? 'bg-brand-50 border border-brand-200' : 'hover:bg-slate-50 border border-transparent'"
              >
                <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-600 mr-3">
                  {{ app.name[0] }}
                </div>
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                     <span class="font-bold text-sm text-slate-900">{{ app.name }}</span>
                     <span class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold border border-slate-200">{{ app.status }}</span>
                  </div>
                  <div class="text-xs text-slate-500">{{ app.email }}</div>
                </div>
                <div 
                   class="w-5 h-5 rounded border flex items-center justify-center"
                   :class="selectedApplicants.find(a => a.id === app.id) ? 'bg-brand-600 border-brand-600' : 'border-slate-300'"
                >
                   <svg v-if="selectedApplicants.find(a => a.id === app.id)" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                   </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- 오른쪽: 선택된 지원자 -->
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
  min-height: 500px; /* 최소 높이 완화 */
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


