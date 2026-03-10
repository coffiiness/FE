<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRecruitmentStore } from '@/stores/recruitment'
import { useOrganizationStore } from '@/stores/organization'
import { storeToRefs } from 'pinia'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const router = useRouter()
const store = useRecruitmentStore()
const orgStore = useOrganizationStore()
const { organizations, allMembers } = storeToRefs(orgStore)
const loading = ref(false)
const showSuccessModal = ref(false)

// --- 1. 기본 정보 데이터 ---
const form = ref({
  title: '',
  targetCount: 1,
  startDate: '',
  endDate: '',
  applicationTemplateId: '',
  contents: '',
  teamId: [],
  interviewerIds: [],
  // Added fields
  leadTeamId: '',
  referenceTeamIds: [],
  careerType: 'NEW',
  experienceYears: { min: 0, max: 0 }
})

// --- 2. 채용 프로세스 데이터 ---
const processes = ref([
  { stageName: '서류 전형', stageType: 'DOCUMENT' },
  { stageName: '실무 면접', stageType: 'INTERVIEW' },
  { stageName: '최종 합격', stageType: 'PASS' }
])

const stageTypes = [
  { label: '서류 심사', value: 'DOCUMENT' },
  { label: '면접', value: 'INTERVIEW' },
  { label: '과제/테스트', value: 'TEST' },
  { label: '최종 합격', value: 'PASS' },
]

const templates = computed(() => {
  return store.templates.map((template) => ({
    id: template.id,
    name: template.name || template.title || ''
  }))
})

onMounted(async () => {
  try {
    await store.fetchApplicationTemplates()
  } catch (error) {
    console.error('템플릿 목록을 불러오지 못했습니다:', error)
  }
})

// --- 조직도 트리 상태 ---
const expandedDepts = ref(new Set())
const expandedTeams = ref(new Set())
const leadExpandedDepts = ref(new Set())
const refExpandedDepts = ref(new Set())
const interviewerSearchQuery = ref('')

const toggleDept = (deptId) => {
  if (expandedDepts.value.has(deptId)) expandedDepts.value.delete(deptId)
  else expandedDepts.value.add(deptId)
}

const toggleTeam = (teamId) => {
  if (expandedTeams.value.has(teamId)) expandedTeams.value.delete(teamId)
  else expandedTeams.value.add(teamId)
}

// 검색 필터: 이름 또는 직책
const filteredOrganizations = computed(() => {
  const query = interviewerSearchQuery.value.trim().toLowerCase()
  if (!query) return organizations.value

  return organizations.value
    .map(dept => ({
      ...dept,
      teams: dept.teams
        .map(team => ({
          ...team,
          members: team.members.filter(m =>
            m.name.toLowerCase().includes(query) || m.position.toLowerCase().includes(query)
          )
        }))
        .filter(team => team.members.length > 0)
    }))
    .filter(dept => dept.teams.length > 0)
})

// 선택된 면접관 상세 정보
const selectedInterviewerDetails = computed(() => {
  return form.value.interviewerIds.map(id => {
    const member = allMembers.value.find(m => m.id === id)
    return member || { id, name: '알 수 없음', position: '', teamName: '' }
  })
})

// 전체 팀 목록 (담당/참조 조직 선택용)
const allTeams = computed(() => {
  return organizations.value.flatMap(dept =>
    dept.teams.map(team => ({ id: team.id, name: `${dept.name} > ${team.name}` }))
  )
})

// 선택된 담당 조직 이름
const selectedLeadTeamName = computed(() => {
  const team = allTeams.value.find(t => t.id === form.value.leadTeamId)
  return team ? team.name : null
})

// 선택된 참조 조직 이름들
const selectedRefTeamNames = computed(() => {
  return form.value.referenceTeamIds.map(id => {
    const team = allTeams.value.find(t => t.id === id)
    return team ? { id, name: team.name } : { id, name: '?' }
  })
})

const toggleLeadDept = (deptId) => {
  if (leadExpandedDepts.value.has(deptId)) leadExpandedDepts.value.delete(deptId)
  else leadExpandedDepts.value.add(deptId)
}

const toggleRefDept = (deptId) => {
  if (refExpandedDepts.value.has(deptId)) refExpandedDepts.value.delete(deptId)
  else refExpandedDepts.value.add(deptId)
}

// --- Helper Functions ---
const toggleSelection = (list, id) => {
  const index = list.indexOf(id)
  if (index === -1) {
    list.push(id)
  } else {
    list.splice(index, 1)
  }
}

const removeInterviewer = (id) => {
  const index = form.value.interviewerIds.indexOf(id)
  if (index !== -1) form.value.interviewerIds.splice(index, 1)
}

const addStage = () => {
  const insertIndex = Math.max(0, processes.value.length - 1)
  const newStage = { stageName: '새 단계', stageType: 'INTERVIEW' }
  processes.value.splice(insertIndex, 0, newStage)
}

const removeStage = (index) => {
  if (processes.value.length <= 2) {
    alert('최소 2개 이상의 단계가 필요합니다.')
    return
  }
  processes.value.splice(index, 1)
}

// --- Drag and Drop Logic (Enhanced) ---
const dragIndex = ref(null)      // 현재 드래그 중인 아이템의 인덱스
const dragOverIndex = ref(null)  // 드래그한 아이템이 올라가 있는 위치의 인덱스

const onDragStart = (index) => {
  dragIndex.value = index
}

// 드래그한 아이템이 다른 아이템 위로 들어왔을 때
const onDragEnter = (index) => {
  // 자기 자신이 아닐 때만 타겟 인덱스 업데이트
  if (index !== dragIndex.value) {
    dragOverIndex.value = index
  }
}

const onDrop = (dropIndex) => {
  const draggedItem = processes.value[dragIndex.value]
  processes.value.splice(dragIndex.value, 1)
  processes.value.splice(dropIndex, 0, draggedItem)

  // 상태 초기화
  dragIndex.value = null
  dragOverIndex.value = null
}

// 드래그가 끝났을 때 (취소되거나 드롭되었을 때) 초기화
const onDragEnd = () => {
  dragIndex.value = null
  dragOverIndex.value = null
}

const handleSubmit = async () => {
  // 필수 필드 검증
  if (!form.value.title || !form.value.startDate || !form.value.endDate || !form.value.leadTeamId) {
    alert('필수 정보를 모두 입력해주세요.')
    return
  }

  if (!form.value.applicationTemplateId) {
    alert('지원서 템플릿을 선택해주세요.')
    return
  }

  if (!form.value.contents) {
    alert('공고 내용을 입력해주세요.')
    return
  }

  // 면접관 최소 1명 검증 (BE @Size(min=1) 규칙)
  if (!form.value.interviewerIds || form.value.interviewerIds.length === 0) {
    alert('면접관은 최소 1명 이상 선택해야 합니다.')
    return
  }

  loading.value = true

  try {
    // RecruitmentCreateRequest 형식에 맞는 payload 구성
    const payload = {
      title: form.value.title,
      targetCount: form.value.targetCount || 1,
      applicationTemplateId: Number(form.value.applicationTemplateId),
      contents: form.value.contents,
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      careerType: form.value.careerType,
      minExperienceYears: form.value.careerType === 'EXPERIENCED' ? (form.value.experienceYears.min || 0) : null,
      maxExperienceYears: form.value.careerType === 'EXPERIENCED' ? (form.value.experienceYears.max || 0) : null,
      leadGroupId: Number(form.value.leadTeamId),
      referenceGroupIds: form.value.referenceTeamIds.map(Number),
      interviewerIds: form.value.interviewerIds.map(Number),
      stages: processes.value.map((p, index) => ({
        stageName: p.stageName,
        stageType: p.stageType,
        stageStep: index + 1
      }))
    }

    console.log('생성 요청 데이터:', payload)

    await store.createRecruitment(payload)
    showSuccessModal.value = true

  } catch (err) {
    const status = err.response?.status
    const msg = err.response?.data?.message

    if (status === 400) {
      alert(msg || '입력값을 확인해주세요.')
    } else if (status === 403) {
      alert('채용 공고를 생성할 권한이 없습니다.')
      router.push('/recruitment/home')
    } else {
      alert('일시적 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    }
    console.error('채용 공고 생성 실패:', err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="w-full space-y-6 animate-fade-in-up">

    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
      <div>
        <h2 class="text-2xl font-display font-bold text-slate-900">새 채용 공고 만들기</h2>
      </div>
      <div class="flex gap-3">
        <button @click="router.back()" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
          취소
        </button>
        <button @click="handleSubmit"
                :disabled="loading"
                class="px-4 py-2 bg-brand-600 text-white font-medium hover:bg-brand-700 rounded-lg transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
          <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          공고 게시하기
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">

      <div class="lg:col-span-2 xl:col-span-3 space-y-6">

        <div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <span class="w-1.5 h-6 bg-brand-500 mr-2 rounded-full"></span>
            기본 정보
          </h3>

          <div class="space-y-6">
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-2">공고 제목 <span class="text-rose-500">*</span></label>
              <input v-model="form.title" type="text" placeholder="예) 2026년 상반기 백엔드 개발자 채용"
                     class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm">
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">채용 목표 인원</label>
                <div class="relative">
                  <input v-model="form.targetCount" type="number" min="1"
                         class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all pr-12 shadow-sm">
                  <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">명</span>
                </div>
              </div>

              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">지원서 양식 선택</label>
                <div class="relative">
                  <select v-model="form.applicationTemplateId"
                          class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all appearance-none cursor-pointer shadow-sm">
                    <option value="" disabled selected>템플릿을 선택하세요</option>
                    <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
                  </select>
                  <svg class="w-5 h-5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">시작일시 <span class="text-rose-500">*</span></label>
                <input v-model="form.startDate" type="datetime-local"
                       class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm">
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">마감일시 <span class="text-rose-500">*</span></label>
                <input v-model="form.endDate" type="datetime-local"
                       class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm">
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <span class="w-1.5 h-6 bg-brand-500 mr-2 rounded-full"></span>
            담당 조직 및 면접관
          </h3>

          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">경력 구분</label>
                <div class="flex gap-4">
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" v-model="form.careerType" value="NEW" class="w-4 h-4 text-brand-600 focus:ring-brand-500">
                    <span class="text-sm font-medium text-slate-700">신입</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" v-model="form.careerType" value="EXPERIENCED" class="w-4 h-4 text-brand-600 focus:ring-brand-500">
                    <span class="text-sm font-medium text-slate-700">경력</span>
                  </label>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input type="radio" v-model="form.careerType" value="IRRELEVANT" class="w-4 h-4 text-brand-600 focus:ring-brand-500">
                    <span class="text-sm font-medium text-slate-700">무관</span>
                  </label>
                </div>
              </div>

              <div v-if="form.careerType === 'EXPERIENCED'">
                <label class="block text-sm font-bold text-slate-700 mb-2">경력 연차 (년)</label>
                <div class="flex items-center gap-2">
                  <input v-model="form.experienceYears.min" type="number" min="0" placeholder="최소"
                         class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-bold focus:outline-none focus:border-brand-500 transition-all shadow-sm">
                  <span class="text-slate-500">~</span>
                  <input v-model="form.experienceYears.max" type="number" min="0" placeholder="최대"
                         class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-bold focus:outline-none focus:border-brand-500 transition-all shadow-sm">
                </div>
              </div>
            </div>

            <!-- 담당 조직 (Lead Team) - 트리 선택 -->
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-3">담당 조직 (Lead Team) <span class="text-rose-500">*</span></label>
              
              <!-- 선택된 담당 조직 표시 -->
              <div v-if="selectedLeadTeamName" class="flex items-center gap-2 mb-3 p-2.5 bg-brand-50 rounded-xl border border-brand-200">
                <svg class="w-4 h-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                <span class="text-sm font-bold text-brand-700">{{ selectedLeadTeamName }}</span>
                <button @click="form.leadTeamId = ''" type="button" class="ml-auto text-slate-400 hover:text-rose-500 transition-colors">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div class="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm max-h-[240px] overflow-y-auto">
                <div v-for="dept in organizations" :key="'lead_' + dept.id">
                  <button @click="toggleLeadDept(dept.id)" type="button"
                          class="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 transition-colors">
                    <div class="flex items-center gap-2">
                      <svg :class="['w-3.5 h-3.5 text-slate-400 transition-transform duration-200', leadExpandedDepts.has(dept.id) ? 'rotate-90' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span class="text-sm font-bold text-slate-700">{{ dept.name }}</span>
                    </div>
                    <span class="text-[10px] text-slate-400">{{ dept.teams.length }}팀</span>
                  </button>
                  <div v-if="leadExpandedDepts.has(dept.id)">
                    <button v-for="team in dept.teams" :key="team.id"
                            @click="form.leadTeamId = team.id"
                            type="button"
                            class="w-full flex items-center pl-10 pr-4 py-2.5 border-b border-slate-100 transition-all text-left"
                            :class="form.leadTeamId === team.id ? 'bg-brand-50' : 'hover:bg-slate-50'">
                      <div class="w-4 h-4 rounded-full border-2 mr-3 flex items-center justify-center transition-colors"
                           :class="form.leadTeamId === team.id ? 'border-brand-500 bg-brand-500' : 'border-slate-300'">
                        <div v-if="form.leadTeamId === team.id" class="w-1.5 h-1.5 rounded-full bg-white"></div>
                      </div>
                      <svg class="w-3.5 h-3.5 text-brand-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span class="text-sm font-medium" :class="form.leadTeamId === team.id ? 'text-brand-700 font-bold' : 'text-slate-600'">{{ team.name }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 참조 조직 (Reference Team) - 트리 선택 -->
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                참조 조직 (Reference Team)
                <span class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-normal">조회 권한만 부여</span>
              </label>

              <!-- 선택된 참조 조직 칩 -->
              <div v-if="selectedRefTeamNames.length > 0" class="flex flex-wrap gap-2 mb-3">
                <div v-for="team in selectedRefTeamNames" :key="'ref_chip_' + team.id"
                     class="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-700">
                  {{ team.name }}
                  <button @click="toggleSelection(form.referenceTeamIds, team.id)" type="button" class="text-slate-400 hover:text-rose-500 transition-colors">
                    <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>

              <div class="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm max-h-[240px] overflow-y-auto">
                <div v-for="dept in organizations" :key="'ref_' + dept.id">
                  <button @click="toggleRefDept(dept.id)" type="button"
                          class="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 transition-colors">
                    <div class="flex items-center gap-2">
                      <svg :class="['w-3.5 h-3.5 text-slate-400 transition-transform duration-200', refExpandedDepts.has(dept.id) ? 'rotate-90' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span class="text-sm font-bold text-slate-700">{{ dept.name }}</span>
                    </div>
                    <span class="text-[10px] text-slate-400">{{ dept.teams.length }}팀</span>
                  </button>
                  <div v-if="refExpandedDepts.has(dept.id)">
                    <button v-for="team in dept.teams" :key="team.id"
                            @click="toggleSelection(form.referenceTeamIds, team.id)"
                            type="button"
                            class="w-full flex items-center pl-10 pr-4 py-2.5 border-b border-slate-100 transition-all text-left"
                            :class="form.referenceTeamIds.includes(team.id) ? 'bg-slate-100' : 'hover:bg-slate-50'">
                      <div class="w-4 h-4 rounded border mr-3 flex items-center justify-center transition-colors"
                           :class="form.referenceTeamIds.includes(team.id) ? 'border-slate-600 bg-slate-600' : 'border-slate-300 bg-white'">
                        <svg v-if="form.referenceTeamIds.includes(team.id)" class="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <svg class="w-3.5 h-3.5 text-slate-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span class="text-sm font-medium" :class="form.referenceTeamIds.includes(team.id) ? 'text-slate-800 font-bold' : 'text-slate-600'">{{ team.name }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 배정 면접관 -->
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-1">배정 면접관 <span class="text-rose-500">*</span></label>
              <p class="text-xs text-slate-400 mb-3">조직도에서 면접관을 선택하세요. 최소 1명 이상 필수입니다.</p>
              
              <!-- 선택된 면접관 칩 -->
              <div v-if="selectedInterviewerDetails.length > 0" class="flex flex-wrap gap-2 mb-4 p-3 bg-brand-50/50 rounded-xl border border-brand-100">
                <div v-for="member in selectedInterviewerDetails" :key="member.id"
                     class="inline-flex items-center gap-1.5 bg-white border border-brand-200 rounded-lg px-2.5 py-1.5 shadow-sm">
                  <div class="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 text-[10px] font-bold">
                    {{ member.name?.substring(0, 1) }}
                  </div>
                  <span class="text-xs font-bold text-slate-700">{{ member.name }}</span>
                  <span class="text-[10px] text-slate-400">{{ member.teamName }}</span>
                  <button @click="removeInterviewer(member.id)" type="button" class="ml-0.5 text-slate-400 hover:text-rose-500 transition-colors">
                    <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
                <span class="text-xs text-brand-600 font-bold self-center ml-1">{{ selectedInterviewerDetails.length }}명 선택</span>
              </div>

              <!-- 검색창 -->
              <div class="relative mb-3">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input v-model="interviewerSearchQuery" type="text" placeholder="이름 또는 직책으로 검색..."
                       class="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 shadow-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all">
              </div>

              <!-- 조직도 트리 -->
              <div class="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm max-h-[400px] overflow-y-auto">
                <div v-for="dept in filteredOrganizations" :key="dept.id">
                  <!-- 본부(Department) 레벨 -->
                  <button @click="toggleDept(dept.id)" type="button"
                          class="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 transition-colors">
                    <div class="flex items-center gap-2">
                      <svg :class="['w-4 h-4 text-slate-400 transition-transform duration-200', expandedDepts.has(dept.id) ? 'rotate-90' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span class="text-sm font-bold text-slate-700">{{ dept.name }}</span>
                    </div>
                    <span class="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                      {{ dept.teams.reduce((sum, t) => sum + t.members.length, 0) }}명
                    </span>
                  </button>

                  <!-- 팀(Team) 레벨 -->
                  <div v-if="expandedDepts.has(dept.id)">
                    <div v-for="team in dept.teams" :key="team.id">
                      <button @click="toggleTeam(team.id)" type="button"
                              class="w-full flex items-center justify-between pl-8 pr-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 transition-colors">
                        <div class="flex items-center gap-2">
                          <svg :class="['w-3.5 h-3.5 text-slate-400 transition-transform duration-200', expandedTeams.has(team.id) ? 'rotate-90' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                          </svg>
                          <svg class="w-3.5 h-3.5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span class="text-sm font-medium text-slate-600">{{ team.name }}</span>
                        </div>
                        <span class="text-[10px] text-slate-400 font-medium">{{ team.members.length }}명</span>
                      </button>

                      <!-- 멤버(Member) 레벨 -->
                      <div v-if="expandedTeams.has(team.id)">
                        <button v-for="member in team.members" :key="member.id"
                                @click="toggleSelection(form.interviewerIds, member.id)"
                                type="button"
                                class="w-full flex items-center pl-14 pr-4 py-2.5 border-b border-slate-50 transition-all text-left"
                                :class="form.interviewerIds.includes(member.id) ? 'bg-brand-50' : 'hover:bg-slate-50'">
                          <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 transition-colors"
                               :class="form.interviewerIds.includes(member.id) ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'">
                            {{ member.name.substring(0, 1) }}
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="text-sm font-medium text-slate-700">{{ member.name }}</p>
                            <p class="text-[11px] text-slate-400">{{ member.position }}</p>
                          </div>
                          <div v-if="form.interviewerIds.includes(member.id)">
                            <svg class="w-5 h-5 text-brand-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 조직이 없을 때 -->
                <div v-if="filteredOrganizations.length === 0" class="p-8 text-center text-sm text-slate-400">
                  <svg class="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  검색 결과가 없습니다.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <span class="w-1.5 h-6 bg-brand-500 mr-2 rounded-full"></span>
            상세 내용
          </h3>
          <textarea v-model="form.contents" rows="12" placeholder="채용 공고에 표시될 상세 내용을 입력하세요..."
                    class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all resize-none shadow-sm"></textarea>
        </div>

      </div>

      <div class="lg:col-span-1 xl:col-span-1">
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm sticky top-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-lg font-bold text-slate-800 flex items-center">
              <span class="w-1.5 h-6 bg-brand-500 mr-2 rounded-full"></span>
              채용 단계 설정
            </h3>
            <button @click="addStage" class="text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-200 transition-colors">
              + 단계 추가
            </button>
          </div>

          <div class="space-y-4 relative">
            <div class="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-200 -z-10"></div>

            <div
              v-for="(stage, idx) in processes"
              :key="idx"
              class="relative pl-0 group cursor-move"
              draggable="true"
              @dragstart="onDragStart(idx)"
              @dragenter="onDragEnter(idx)"
              @dragend="onDragEnd"
              @dragover.prevent
              @drop="onDrop(idx)"
            >
              <div
                class="flex items-start gap-3 bg-white border rounded-xl p-3 shadow-sm transition-all duration-200"
                :class="{
                  'opacity-40 scale-95 border-dashed border-slate-300': dragIndex === idx, // 드래그 중인 아이템 스타일
                  'border-2 border-brand-500 bg-brand-50 scale-105 shadow-md z-10': dragOverIndex === idx && dragIndex !== idx, // 드롭 대상(가까워질 때) 스타일
                  'border-slate-200 hover:border-brand-300 hover:shadow-md': dragIndex !== idx && dragOverIndex !== idx // 평상시 스타일
                }"
              >
                <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 z-10 transition-colors shadow-sm mt-1"
                     :class="{
                        'bg-brand-500 text-white border-brand-500': dragOverIndex === idx && dragIndex !== idx,
                        'bg-white text-brand-600 border-brand-500': stage.stageType === 'PASS' && dragOverIndex !== idx,
                        'bg-white text-slate-500 border-slate-300 group-hover:border-brand-400 group-hover:text-brand-500': stage.stageType !== 'PASS' && dragOverIndex !== idx
                     }">
                  {{ idx + 1 }}
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start mb-2">
                    <div class="relative">
                      <select v-model="stage.stageType"
                              class="text-xs font-bold pl-2 pr-6 py-1.5 rounded bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 appearance-none cursor-pointer text-slate-700 w-full transition-colors"
                              :class="{'bg-white': dragOverIndex === idx && dragIndex !== idx}">
                        <option v-for="type in stageTypes" :key="type.value" :value="type.value">
                          {{ type.label }}
                        </option>
                      </select>
                      <svg class="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    <button v-if="processes.length > 2" @click.stop="removeStage(idx)" class="text-slate-300 hover:text-rose-500 transition-colors p-1 ml-1 cursor-pointer">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>

                  <input v-model="stage.stageName" type="text" placeholder="단계명 입력"
                         class="w-full border rounded px-2 py-1.5 text-sm text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors"
                         :class="dragOverIndex === idx && dragIndex !== idx ? 'bg-white border-brand-200' : 'bg-white border-slate-200'">
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 p-4 bg-brand-50 rounded-xl border border-brand-100 text-xs text-brand-800 leading-relaxed">
            <p class="font-bold mb-1 flex items-center">
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              도움말
            </p>
            카드를 클릭하고 드래그하여 순서를 변경할 수 있습니다.
          </div>
        </div>
      </div>

    </div>
  </div>

  <ConfirmModal
    :show="showSuccessModal"
    title="공고 등록 완료"
    message="공고가 성공적으로 등록되었습니다."
    confirm-text="확인"
    :show-cancel="false"
    type="info"
    @confirm="router.push('/recruitment')"
    @cancel="showSuccessModal = false"
  />
</template>

<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out forwards;
}
</style>

