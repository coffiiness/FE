<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const jobId = route.params.id // URL에서 수정할 공고 ID 가져오기
const loading = ref(false)
const dataLoading = ref(true) // 초기 데이터 로딩 상태

// --- 1. 기본 정보 데이터 ---
const form = ref({
  title: '',
  status: 'ACTIVE', // 수정 화면에만 존재하는 필드
  targetCount: 1,
  startDate: '',
  endDate: '',
  applicationTemplateId: '',
  contents: '',
  teamId: [],
  interviewerIds: []
})

// --- 2. 채용 프로세스 데이터 ---
const processes = ref([])

// 옵션 데이터
const statusOptions = [
  { label: '진행 중 (ACTIVE)', value: 'ACTIVE' },
  { label: '시작 대기 (WAITING)', value: 'WAITING' },
  { label: '마감됨 (CLOSED)', value: 'CLOSED' },
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

// 기존 데이터 불러오기 (Mock API)
const fetchJobDetail = async () => {
  dataLoading.value = true
  // TODO: 실제 API 호출 -> axios.get(`/recruitment/jobs/${jobId}`)
  
  // 시뮬레이션 데이터
  setTimeout(() => {
    form.value = {
      title: '2026년 상반기 백엔드 개발자 채용',
      status: 'ACTIVE',
      targetCount: 3,
      startDate: '2026-03-01T09:00',
      endDate: '2026-03-31T18:00',
      applicationTemplateId: 1,
      contents: '백엔드 개발자를 모십니다. 주요 업무는...',
      teamId: [10, 13],
      interviewerIds: [101, 102, 105]
    }
    processes.value = [
      { stageName: '서류 전형', stageType: 'DOCUMENT', stageStep: 1 },
      { stageName: '코딩 테스트', stageType: 'TEST', stageStep: 2 },
      { stageName: '실무 면접', stageType: 'INTERVIEW', stageStep: 3 },
      { stageName: '최종 합격', stageType: 'PASS', stageStep: 4 }
    ]
    dataLoading.value = false
  }, 500)
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
const dragIndex = ref(null)
const dragOverIndex = ref(null)

const onDragStart = (idx) => { dragIndex.value = idx }
const onDragEnter = (idx) => { if (idx !== dragIndex.value) dragOverIndex.value = idx }
const onDragEnd = () => { dragIndex.value = null; dragOverIndex.value = null }
const onDrop = (dropIdx) => {
  const item = processes.value[dragIndex.value]
  processes.value.splice(dragIndex.value, 1)
  processes.value.splice(dropIdx, 0, item)
  onDragEnd()
}

const handleUpdate = async () => {
  if (!form.value.title) return alert('제목을 입력해주세요.')
  
  loading.value = true
  try {
    const payload = {
      ...form.value,
      processes: processes.value.map((p, index) => ({
        ...p,
        stageStep: index + 1
      }))
    }
    console.log('수정 요청 데이터:', payload)
    
    // TODO: axios.put(`/recruitment/jobs/${jobId}`, payload)
    
    setTimeout(() => {
      alert('공고가 수정되었습니다.')
      router.push(`/recruitment/jobs/${jobId}`) // 상세 페이지로 이동
    }, 1000)
  } catch (e) {
    alert('수정 중 오류가 발생했습니다.')
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
              채용 단계
            </h3>
            <button @click="addStage" class="text-xs font-bold text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg border border-brand-200 transition-colors">
              + 추가
            </button>
          </div>

          <div class="space-y-4 relative">
            <div class="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-200 -z-10"></div>

            <div v-for="(stage, idx) in processes" :key="idx" 
                 class="relative pl-0 group cursor-move"
                 draggable="true" @dragstart="onDragStart(idx)" @dragenter="onDragEnter(idx)" @dragend="onDragEnd" @dragover.prevent @drop="onDrop(idx)">
              
              <div class="flex items-start gap-3 bg-white border rounded-xl p-3 shadow-sm transition-all duration-200"
                   :class="{
                     'opacity-40 scale-95 border-dashed border-slate-300': dragIndex === idx,
                     'border-2 border-brand-500 bg-brand-50 scale-105 z-10': dragOverIndex === idx && dragIndex !== idx,
                     'border-slate-200 hover:border-brand-300': dragIndex !== idx && dragOverIndex !== idx
                   }">
                
                <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 z-10 transition-colors shadow-sm mt-1"
                     :class="stage.stageType === 'PASS' ? 'bg-white text-brand-600 border-brand-500' : 'bg-white text-slate-500 border-slate-300'">
                  {{ idx + 1 }}
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start mb-2">
                    <select v-model="stage.stageType" class="text-xs font-bold pl-2 pr-6 py-1.5 rounded bg-slate-50 border border-slate-200 focus:outline-none focus:border-brand-500 w-full appearance-none cursor-pointer">
                      <option v-for="type in stageTypes" :key="type.value" :value="type.value">{{ type.label }}</option>
                    </select>
                    <button v-if="processes.length > 2" @click.stop="removeStage(idx)" class="text-slate-300 hover:text-rose-500 p-1 ml-1">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  <input v-model="stage.stageName" type="text" class="w-full border border-slate-200 rounded px-2 py-1.5 text-sm text-slate-900 font-bold focus:outline-none focus:border-brand-500">
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
@keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; }
</style>