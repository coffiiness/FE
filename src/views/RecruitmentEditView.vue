<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecruitmentStore } from '@/stores/recruitment'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const jobId = Number(route.params.id) // URL에서 수정할 공고 ID 가져오기
const loading = ref(false)
const dataLoading = ref(true) // 초기 데이터 로딩 상태
const showSuccessModal = ref(false)

const store = useRecruitmentStore()
const { jobs } = storeToRefs(store)

// --- 1. 기본 정보 데이터 ---
const form = ref({
  id: null,
  title: '',
  status: 'ACTIVE', // 수정 화면에만 존재하는 필드
  targetCount: 1,
  startDate: '',
  endDate: '',
  applicationTemplateId: '',
  contents: '',
  teamId: [],
  interviewerIds: [],
  careerType: 'NEW',
  minExperienceYears: null,
  maxExperienceYears: null,
  leadGroupId: null,
  referenceGroupIds: []
})

// --- 2. 채용 프로세스 데이터 ---
const processes = ref([])

// 옵션 데이터
const statusOptions = [
  { label: '진행 중 (ACTIVE)', value: 'active' },
  { label: '시작 대기 (WAITING)', value: 'waiting' },
  { label: '마감됨 (CLOSED)', value: 'closed' },
]

const stageTypes = [
  { label: '서류 심사', value: 'DOCUMENT' },
  { label: '면접', value: 'INTERVIEW' },
  { label: '과제/테스트', value: 'TEST' },
  { label: '최종 합격', value: 'PASS' },
]

const templates = ref([
  { id: 1, name: '기본 개발직군 지원서' },
  { id: 2, name: '디자인 포트폴리오 포함 지원서' },
  { id: 3, name: '경력직 공통 지원서' },
])

const teams = ref([
  { id: 1, name: '디자인팀' },
  { id: 2, name: '개발본부' },
  { id: 3, name: '마케팅' },
  { id: 10, name: '플랫폼팀' },
  { id: 13, name: '인프라팀' },
])

const interviewers = ref([
  { id: 101, name: '김기술', position: '백엔드 리드', teamId: 2 },
  { id: 102, name: '박팀장', position: '인사 팀장', teamId: 3 },
  { id: 105, name: '이디자인', position: '프로덕트 디자이너', teamId: 1 },
  { id: 106, name: '최프론트', position: '프론트엔드 개발자', teamId: 2 },
  { id: 107, name: '정플랫폼', position: '인프라 엔지니어', teamId: 10 },
  { id: 108, name: '강인사', position: '인사 담당자', teamId: 3 },
])

// --- Search & Filter Logic ---
const interviewerSearchQuery = ref('')

// 선택된 팀에 속한 면접관들 (자동 추천)
const recommendedInterviewers = computed(() => {
  if (form.value.teamId.length === 0) return []
  return interviewers.value.filter(i => form.value.teamId.includes(i.teamId))
})

// 검색 결과 (추천된 사람 제외하고 검색어에 맞는 사람들)
const searchResultInterviewers = computed(() => {
  const query = interviewerSearchQuery.value.trim().toLowerCase()
  if (!query) return []
  
  return interviewers.value.filter(i => {
    const matchesQuery = i.name.toLowerCase().includes(query) || i.position.toLowerCase().includes(query)
    const isAlreadyRecommended = recommendedInterviewers.value.some(ri => ri.id === i.id)
    return matchesQuery && !isAlreadyRecommended
  })
})

// --- Helper Functions ---

const toggleSelection = (list, id) => {
  const index = list.indexOf(id)
  if (index === -1) {
    list.push(id)
  } else {
    list.splice(index, 1)
  }
}

const toDateTimeLocal = (value) => {
  if (!value) return ''

  if (typeof value === 'string') {
    const normalized = value.replace(' ', 'T')
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized)) return normalized.slice(0, 16)
    if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return `${normalized}T09:00`
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}
// 기존 데이터 불러오기 (Mock API)
const fetchJobDetail = async () => {
  dataLoading.value = true

  try {
    let job = jobs.value.find(j => Number(j.id) === jobId)

    // 새로고침 진입 시 스토어가 비어있을 수 있어 목록을 1회 보강 조회
    if (!job) {
      await store.fetchRecruitments()
      job = jobs.value.find(j => Number(j.id) === jobId)
    }

    if (!job) {
      alert('공고를 찾을 수 없습니다.')
      router.push('/recruitment')
      return
    }

    // 팀 ID 역추적 (이름 기반 데이터 호환용)
    const teamNameMap = {
      '디자인팀': [1],
      'Design Group': [1],
      '개발본부': [2],
      'Platform Team': [2],
      'Web Core': [2],
      '마케팅': [3],
      '플랫폼팀': [10],
      'Infra Unit': [13],
      '인프라팀': [13]
    }

    // 면접관 ID 역추적 (이름 기반 데이터 호환용)
    const interviewerNameMap = {}
    interviewers.value.forEach(i => { interviewerNameMap[i.name] = i.id })

    const leadGroupId = Number(job.leadGroupId || 0)
    const referenceGroupIds = Array.isArray(job.referenceGroupIds)
      ? job.referenceGroupIds.map(Number).filter(id => Number.isFinite(id) && id > 0)
      : []
    const fallbackTeamIds = teamNameMap[job.team] || []
    const teamIds = [...new Set([leadGroupId, ...referenceGroupIds, ...fallbackTeamIds].filter(id => Number(id) > 0))]

    const interviewerIds = Array.isArray(job.assignees)
      ? job.assignees.map(a => Number(a.id)).filter(id => Number.isFinite(id) && id > 0)
      : (job.interviewers || []).map(name => interviewerNameMap[name]).filter(id => Number(id) > 0)

    form.value = {
      id: job.id,
      title: job.title || '',
      status: job.status || 'ACTIVE',
      targetCount: job.targetCount || 1,
      startDate: toDateTimeLocal(job.startDate || job.createdAt),
      endDate: toDateTimeLocal(job.endDate),
      applicationTemplateId: job.applicationTemplateId || 1,
      contents: job.contents || '',
      teamId: teamIds,
      interviewerIds,
      careerType: job.careerType || 'NEW',
      minExperienceYears: job.minExperienceYears ?? null,
      maxExperienceYears: job.maxExperienceYears ?? null,
      leadGroupId: leadGroupId || teamIds[0] || null,
      referenceGroupIds
    }

    // 프로세스 복원 (신규 stages 우선, 기존 funnel 형식 호환)
    if (Array.isArray(job.stages) && job.stages.length > 0) {
      processes.value = [...job.stages]
        .sort((a, b) => (a.stageStep || 0) - (b.stageStep || 0))
        .map((s, idx) => ({
          stageName: s.stageName,
          stageType: s.stageType || 'INTERVIEW',
          stageStep: Number(s.stageStep) || (idx + 1)
        }))
    } else if (Array.isArray(job.funnel) && job.funnel.length > 0) {
      processes.value = job.funnel.map((f, idx) => ({
        stageName: f.step,
        stageType: 'INTERVIEW',
        stageStep: idx + 1
      }))
    } else {
      processes.value = [
        { stageName: '서류 전형', stageType: 'DOCUMENT', stageStep: 1 },
        { stageName: '실무 면접', stageType: 'INTERVIEW', stageStep: 2 },
        { stageName: '최종 합격', stageType: 'PASS', stageStep: 3 }
      ]
    }
  } finally {
    dataLoading.value = false
  }
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

// Drag & Drop Logic
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

const handleUpdate = async () => {
  if (!form.value.title) return alert('제목을 입력해주세요.')
  if (!form.value.startDate || !form.value.endDate) return alert('시작일시와 마감일시를 입력해주세요.')
  if (!form.value.applicationTemplateId) return alert('지원서 양식을 선택해주세요.')

  loading.value = true
  try {
    const selectedTeamIds = [...new Set((form.value.teamId || []).map(Number).filter(id => Number.isFinite(id) && id > 0))]
    if (selectedTeamIds.length === 0) return alert('담당 조직을 최소 1개 선택해주세요.')

    const interviewerIds = (form.value.interviewerIds || []).map(Number).filter(id => Number.isFinite(id) && id > 0)
    if (interviewerIds.length === 0) return alert('면접관은 최소 1명 이상 선택해주세요.')

    const leadGroupIdCandidate = Number(form.value.leadGroupId || 0)
    const leadGroupId = selectedTeamIds.includes(leadGroupIdCandidate) ? leadGroupIdCandidate : selectedTeamIds[0]
    const referenceGroupIds = selectedTeamIds.filter(id => id !== leadGroupId)

    // RecruitmentUpdateRequest 형식 payload
    const payload = {
      title: form.value.title,
      targetCount: Number(form.value.targetCount || 1),
      applicationTemplateId: Number(form.value.applicationTemplateId),
      contents: form.value.contents || '',
      startDate: form.value.startDate,
      endDate: form.value.endDate,
      careerType: form.value.careerType || 'NEW',
      minExperienceYears: (form.value.careerType || 'NEW') === 'EXPERIENCED'
        ? Number(form.value.minExperienceYears ?? 0)
        : null,
      maxExperienceYears: (form.value.careerType || 'NEW') === 'EXPERIENCED'
        ? Number(form.value.maxExperienceYears ?? 0)
        : null,
      leadGroupId,
      referenceGroupIds,
      interviewerIds,
      stages: processes.value.map((p, index) => ({
        stageName: p.stageName,
        stageType: p.stageType,
        stageStep: index + 1
      }))
    }

    await store.updateRecruitment(jobId, payload)
    showSuccessModal.value = true
  } catch (e) {
    console.error(e)
    const message = e?.response?.data?.message || '수정 중 오류가 발생했습니다.'
    alert(message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchJobDetail()
})
</script>

<template>
  <div class="w-full space-y-6 animate-fade-in-up">
    
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
      <div>
        <div class="flex items-center gap-3 mb-1">
          <span class="px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
            ID: {{ jobId }}
          </span>
          <h2 class="text-2xl font-display font-bold text-slate-900">공고 수정하기</h2>
        </div>
        <p class="text-slate-500 mt-1">등록된 채용 공고의 내용을 수정합니다.</p>
      </div>
      <div class="flex gap-3">
        <button @click="router.back()" class="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors">
          취소
        </button>
        <button @click="handleUpdate" 
                :disabled="loading || dataLoading"
                class="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center disabled:opacity-50">
          <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
          변경사항 저장
        </button>
      </div>
    </div>

    <div v-if="dataLoading" class="h-96 flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      
      <div class="lg:col-span-2 xl:col-span-3 space-y-6">
        
        <div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h3 class="text-lg font-bold text-slate-800 mb-6 flex items-center">
            <span class="w-1.5 h-6 bg-brand-500 mr-2 rounded-full"></span>
            기본 정보
          </h3>
          
          <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="md:col-span-2">
                <label class="block text-sm font-bold text-slate-700 mb-2">공고 제목</label>
                <input v-model="form.title" type="text" class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-brand-500 transition-all">
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">진행 상태</label>
                <select v-model="form.status" class="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-500 transition-all"
                        :class="form.status === 'ACTIVE' ? 'text-brand-600' : 'text-slate-600'">
                  <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">채용 목표 인원</label>
                <div class="relative">
                  <input v-model="form.targetCount" type="number" min="1" class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-brand-500 pr-12">
                  <span class="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">명</span>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">지원서 양식</label>
                <select v-model="form.applicationTemplateId" class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-brand-500 appearance-none cursor-pointer">
                  <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">시작일시</label>
                <input v-model="form.startDate" type="datetime-local" class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-brand-500">
              </div>
              <div>
                <label class="block text-sm font-bold text-slate-700 mb-2">마감일시</label>
                <input v-model="form.endDate" type="datetime-local" class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-brand-500">
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
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-3">배정 팀 (중복 선택 가능)</label>
              <div class="flex flex-wrap gap-2">
                <button v-for="team in teams" :key="team.id"
                        @click="toggleSelection(form.teamId, team.id)"
                        type="button"
                        class="px-4 py-2 rounded-xl text-sm font-bold transition-all border"
                        :class="form.teamId.includes(team.id)
                          ? 'bg-brand-50 border-brand-500 text-brand-600 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'">
                  {{ team.name }}
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-bold text-slate-700 mb-3">배정 면접관</label>
              
              <!-- 검색창 -->
              <div class="relative mb-4">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </span>
                <input v-model="interviewerSearchQuery" type="text" placeholder="이름 또는 직책으로 면접관 검색..."
                       class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-all">
              </div>

              <!-- 검색 결과가 있을 때 -->
              <div v-if="searchResultInterviewers.length > 0" class="mb-6">
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">검색 결과</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button v-for="interviewer in searchResultInterviewers" :key="interviewer.id"
                          @click="toggleSelection(form.interviewerIds, interviewer.id)"
                          type="button"
                          class="flex items-center p-3 rounded-xl border transition-all text-left"
                          :class="form.interviewerIds.includes(interviewer.id) ? 'bg-brand-50 border-brand-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'">
                    <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-brand-600 font-bold mr-3">
                      {{ interviewer.name.substring(0, 1) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-bold text-slate-700 truncate">{{ interviewer.name }}</p>
                      <p class="text-xs text-slate-400 truncate">{{ interviewer.position }}</p>
                    </div>
                    <div v-if="form.interviewerIds.includes(interviewer.id)" class="ml-2">
                      <svg class="w-5 h-5 text-brand-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                    </div>
                  </button>
                </div>
              </div>

              <!-- 추천 면접관 (선택된 팀원들) -->
              <div v-if="recommendedInterviewers.length > 0" class="mb-6">
                <p class="text-[11px] font-bold text-brand-600 uppercase tracking-wider mb-2 flex items-center">
                  <span class="w-1 h-1 bg-brand-500 rounded-full mr-1.5"></span>
                  선택된 팀의 팀원 (추천)
                </p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button v-for="interviewer in recommendedInterviewers" :key="interviewer.id"
                          @click="toggleSelection(form.interviewerIds, interviewer.id)"
                          type="button"
                          class="flex items-center p-3 rounded-xl border transition-all text-left"
                          :class="form.interviewerIds.includes(interviewer.id) ? 'bg-brand-50 border-brand-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'">
                    <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-brand-600 font-bold mr-3">
                      {{ interviewer.name.substring(0, 1) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-bold text-slate-700 truncate">{{ interviewer.name }}</p>
                      <p class="text-xs text-slate-400 truncate">{{ interviewer.position }}</p>
                    </div>
                    <div v-if="form.interviewerIds.includes(interviewer.id)" class="ml-2">
                      <svg class="w-5 h-5 text-brand-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                    </div>
                  </button>
                </div>
              </div>

              <!-- 그 외 현재 선택된 면접관 (팀 소속이 아니지만 선택된 경우) -->
              <div v-if="form.interviewerIds.some(id => !recommendedInterviewers.some(ri => ri.id === id))">
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">추가된 면접관</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <template v-for="id in form.interviewerIds" :key="id">
                    <button v-if="!recommendedInterviewers.some(ri => ri.id === id)"
                            @click="toggleSelection(form.interviewerIds, id)"
                            type="button"
                            class="flex items-center p-3 rounded-xl border bg-brand-50 border-brand-500 shadow-sm text-left">
                      <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-brand-600 font-bold mr-3">
                        {{ interviewers.find(i => i.id === id)?.name.substring(0, 1) }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-bold text-brand-700 truncate">{{ interviewers.find(i => i.id === id)?.name }}</p>
                        <p class="text-xs text-slate-400 truncate">{{ interviewers.find(i => i.id === id)?.position }}</p>
                      </div>
                      <div class="ml-2">
                        <svg class="w-5 h-5 text-brand-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                      </div>
                    </button>
                  </template>
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
          <textarea v-model="form.contents" rows="12" class="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:border-brand-500 resize-none"></textarea>
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
    title="공고 수정 완료"
    message="공고가 수정되었습니다."
    confirm-text="목록으로 이동"
    :show-cancel="false"
    type="info"
    @confirm="router.push('/recruitment')"
    @cancel="showSuccessModal = false"
  />
</template>

<style scoped>
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
</style>