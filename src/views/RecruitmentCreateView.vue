<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRecruitmentStore } from '@/stores/recruitment'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const router = useRouter()
const store = useRecruitmentStore()
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

// 선택된 팀에 속한 면접관들 (자동 추천 - Lead Team 기준)
const recommendedInterviewers = computed(() => {
  if (!form.value.leadTeamId) return []
  return interviewers.value.filter(i => i.teamId === form.value.leadTeamId)
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

            <!-- (Existing Team Picker Replaced with Lead Team) -->
             <div>
              <label class="block text-sm font-bold text-slate-700 mb-3">담담 조직 (Lead Team)</label>
              <div class="flex flex-wrap gap-2">
                <button v-for="team in teams" :key="team.id"
                        @click="form.leadTeamId = team.id"
                        type="button"
                        class="px-4 py-2 rounded-xl text-sm font-bold transition-all border"
                        :class="form.leadTeamId === team.id
                          ? 'bg-brand-50 border-brand-500 text-brand-600 shadow-sm ring-1 ring-brand-500'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'">
                  {{ team.name }}
                </button>
              </div>
            </div>

            <!-- (New Reference Teams) -->
            <div>
              <label class="block text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  참조 조직 (Reference Team)
                  <span class="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 font-normal">조회 권한만 부여</span>
              </label>
              <div class="flex flex-wrap gap-2">
                <button v-for="team in teams" :key="team.id + '_ref'"
                        @click="toggleSelection(form.referenceTeamIds, team.id)"
                        type="button"
                        class="px-4 py-2 rounded-xl text-sm font-bold transition-all border"
                        :class="form.referenceTeamIds.includes(team.id)
                          ? 'bg-slate-100 border-slate-400 text-slate-700 shadow-sm'
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
                       class="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 font-medium placeholder-slate-400 shadow-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all">
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