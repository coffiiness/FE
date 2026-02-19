<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRecruitmentStore } from '@/Stores/recruitment'
import { storeToRefs } from 'pinia'

const router = useRouter()
const store = useRecruitmentStore()
const { jobs } = storeToRefs(store)

// --- 상태 관리 ---
const activeMenuId = ref(null) // 드롭다운 메뉴 상태
const showDeleteModal = ref(false) // 삭제 모달 상태
const showCopyModal = ref(false) // 링크 복사 성공 모달 상태
const deleteTargetId = ref(null) // 삭제할 공고 ID 저장

// --- 데이터 (Mock) ---
const stats = ref([
  { label: '진행 중인 공고', value: 5, unit: '건', color: 'text-slate-900', bg: 'bg-white' },
  { label: '이번 주 면접 예정', value: 12, unit: '명', color: 'text-brand-600', bg: 'bg-brand-50/50' },
  { label: '조율 대기 (병목)', value: 3, unit: '건', color: 'text-rose-600', bg: 'bg-rose-50/50', glow: true },
])

// jobs ref removed in favor of store.jobs

// --- Helper Functions ---
const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'text-brand-700 bg-brand-50 border-brand-200'
    case 'urgent': return 'text-rose-700 bg-rose-50 border-rose-200 animate-pulse'
    case 'closed': return 'text-slate-600 bg-slate-100 border-slate-200'
    default: return 'text-slate-600'
  }
}

const toggleMenu = (id) => {
  if (activeMenuId.value === id) {
    activeMenuId.value = null
  } else {
    activeMenuId.value = id
  }
}

const goToDetail = (id) => {
  router.push(`/recruitment/jobs/${id}`)
}

// 1. 삭제 버튼 클릭 시 모달 열기
const openDeleteModal = (id) => {
  deleteTargetId.value = id
  showDeleteModal.value = true
  activeMenuId.value = null // 열려있는 메뉴 닫기
}

// 2. 모달 닫기
const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteTargetId.value = null
}

// 3. 실제 삭제 수행
const confirmDelete = () => {
  if (deleteTargetId.value) {
    store.deleteJob(deleteTargetId.value)
  }
  closeDeleteModal()
}

// --- 검색 및 필터링 로직 ---
const searchQuery = ref('')
const statusFilter = ref('전체 상태')
const sortBy = ref('최신순')

const filteredJobs = computed(() => {
  let result = [...jobs.value]

  // 1. 검색어 필터링
  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter(job => 
      job.title.toLowerCase().includes(query) ||
      job.team.toLowerCase().includes(query) ||
      job.position.toLowerCase().includes(query) ||
      job.interviewers.some(intr => intr.toLowerCase().includes(query))
    )
  }

  // 2. 상태 필터링
  if (statusFilter.value !== '전체 상태') {
    const statusMap = {
      '진행 중': 'active',
      '마감 임박': 'urgent',
      '종료됨': 'closed'
    }
    const targetStatus = statusMap[statusFilter.value]
    result = result.filter(job => job.status === targetStatus)
  }

  // 3. 정렬
  if (sortBy.value === '최신순') {
    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  } else if (sortBy.value === '지원자순') {
    result.sort((a, b) => b.totalApplicants - a.totalApplicants)
  } else if (sortBy.value === '마감일순') {
    result.sort((a, b) => a.ddayValue - b.ddayValue)
  }

  return result
})

// --- 링크 복사 및 면접관 설정 기능 ---
const allInterviewers = [
  { id: 1, name: '김기술', position: '백엔드 리드' },
  { id: 2, name: '박팀장', position: '인사 팀장' },
  { id: 105, name: '이디자인', position: '프로덕트 디자이너' },
  { id: 106, name: '최프론트', position: '프론트엔드 개발자' },
  { id: 107, name: 'Park', position: 'CTO' },
  { id: 108, name: 'Lee', position: 'HR Manager' },
  { id: 109, name: '정플랫폼', position: '인프라 엔지니어' },
  { id: 110, name: '강인사', position: '인사 담당자' },
]

const isInterviewerModalOpen = ref(false)
const editingJob = ref(null)
const interviewerSearchQuery = ref('')

const searchResultInterviewers = computed(() => {
  const query = interviewerSearchQuery.value.trim().toLowerCase()
  if (!query) return allInterviewers
  return allInterviewers.filter(i => 
    i.name.toLowerCase().includes(query) || i.position.toLowerCase().includes(query)
  )
})

const copyLink = (id) => {
  const link = `${window.location.origin}/careers/${id}`
  navigator.clipboard.writeText(link).then(() => {
    showCopyModal.value = true
    activeMenuId.value = null
  }).catch(err => {
    console.error('링크 복사 실패:', err)
  })
}

const openInterviewerModal = (job) => {
  editingJob.value = JSON.parse(JSON.stringify(job))
  isInterviewerModalOpen.value = true
  interviewerSearchQuery.value = ''
  activeMenuId.value = null
}

const closeInterviewerModal = () => {
  isInterviewerModalOpen.value = false
  editingJob.value = null
}

const toggleInterviewerAssignment = (name) => {
  if (!editingJob.value) return
  const index = editingJob.value.interviewers.indexOf(name)
  if (index === -1) {
    editingJob.value.interviewers.push(name)
  } else {
    editingJob.value.interviewers.splice(index, 1)
  }
}

const saveInterviewers = () => {
  if (editingJob.value) {
    store.updateJob(editingJob.value)
  }
  closeInterviewerModal()
}
</script>

<template>
  <div class="space-y-8 animate-fade-in-up p-2 relative">

    <div v-if="activeMenuId !== null"
         @click="activeMenuId = null"
         class="fixed inset-0 z-10 cursor-default">
    </div>

    <div class="flex flex-col md:flex-row md:items-center justify-end gap-4 relative z-0">
      <button
          @click="router.push('/recruitment/create')"
          class="bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center group z-20"
      >
        <svg class="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        새 공고 만들기
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-0">
      <div v-for="(stat, idx) in stats" :key="idx"
           :class="['relative overflow-hidden border rounded-2xl p-6 transition-all hover:shadow-md', stat.bg, 'border-slate-200 shadow-sm']">
        <div v-if="stat.glow" class="absolute -right-4 -top-4 w-24 h-24 bg-rose-100 rounded-full blur-2xl pointer-events-none"></div>
        <p class="text-sm text-slate-500 font-medium mb-1">{{ stat.label }}</p>
        <div class="flex items-baseline">
          <span :class="['text-4xl font-display font-bold', stat.color]">
            {{ stat.value }}
          </span>
          <span class="ml-2 text-slate-400 font-medium">{{ stat.unit }}</span>
        </div>
      </div>
    </div>

    <div class="flex flex-col sm:flex-row gap-4 relative z-0">
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
            v-model="searchQuery"
            type="text"
            placeholder="공고명, 부서명 또는 담당자 검색..."
            class="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm"
        >
      </div>
      <div class="flex gap-2">
        <select v-model="statusFilter" class="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:border-brand-500 shadow-sm transition-all">
          <option>전체 상태</option>
          <option>진행 중</option>
          <option>마감 임박</option>
          <option>종료됨</option>
        </select>
        <select v-model="sortBy" class="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:border-brand-500 shadow-sm transition-all">
          <option>최신순</option>
          <option>지원자순</option>
          <option>마감일순</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div v-for="job in filteredJobs" :key="job.id"
           class="group relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-brand-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 shadow-sm"
           :class="{'relative z-20 border-brand-300 ring-2 ring-brand-100': activeMenuId === job.id}">

        <div class="flex justify-between items-start mb-4 relative">
          <div class="flex-1 cursor-pointer" @click="goToDetail(job.id)">
            <span :class="['inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold mb-2 border', getStatusColor(job.status)]">
              {{ job.dday }}
            </span>
            <h3 class="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{{ job.title }}</h3>
            <p class="text-sm text-slate-500 mt-1 flex items-center">
              <span class="w-1.5 h-1.5 rounded-full bg-slate-400 mr-2"></span>
              {{ job.team }} · {{ job.position }}
            </p>
          </div>

          <div class="relative">
            <button @click.stop="toggleMenu(job.id)"
                    class="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            <div v-if="activeMenuId === job.id"
                 class="absolute right-0 top-8 w-48 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 animate-fade-in-down origin-top-right">

              <button
                  @click.stop="router.push(`/recruitment/jobs/${job.id}/edit`)"
                  class="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                공고 수정
              </button>

              <button
                  @click.stop="copyLink(job.id)"
                  class="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                링크 복사
              </button>

              <button
                  @click.stop="openInterviewerModal(job)"
                  class="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center transition-colors"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                면접관 설정
              </button>

              <div class="border-t border-slate-100 my-1"></div>

              <button
                  @click.stop="openDeleteModal(job.id)"
                  class="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center transition-colors font-medium"
              >
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                공고 삭제
              </button>
            </div>
          </div>
        </div>

        <div class="mb-6 bg-slate-50 rounded-xl px-4 py-5 border border-slate-100" @click="goToDetail(job.id)">
          <div class="flex items-end space-x-2 h-14">
            <div v-for="(step, sIdx) in job.funnel" :key="sIdx" class="flex-1 flex flex-col items-center group/step relative">
              <div v-if="step.count > 0"
                   :class="['mb-2 px-2 py-0.5 rounded text-xs font-bold shadow-sm transition-all duration-300',
                            step.active ? 'bg-brand-500 text-white translate-y-0 opacity-100' : 'bg-white border border-slate-200 text-slate-600 -translate-y-1 opacity-0 group-hover/step:opacity-100 group-hover/step:translate-y-0']">
                {{ step.count }}
              </div>
              <div v-else class="h-[26px]"></div>
              <div class="w-full h-2 rounded-full mb-2 overflow-hidden bg-slate-200">
                <div :class="['h-full rounded-full transition-all duration-500', step.active ? 'bg-brand-500 w-full' : 'bg-slate-300 w-full']"></div>
              </div>
              <span :class="['text-sm font-bold text-center truncate w-full transition-colors', step.active ? 'text-brand-600' : 'text-slate-600']">
                {{ step.step }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center border-t border-slate-100 pt-4">
          <div class="flex -space-x-2">
            <div v-for="(intr, iIdx) in job.interviewers" :key="iIdx"
                 class="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-600 ring-2 ring-white shadow-sm">
              {{ intr[0] }}
            </div>
          </div>
          <button @click="goToDetail(job.id)"
                  class="text-xs font-bold text-slate-500 hover:text-brand-600 flex items-center transition-colors group/btn">
            관리하기
            <svg class="w-3 h-3 ml-1 group-hover/btn:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

    </div>
  </div>

  <Transition name="fade">
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center" role="dialog">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="closeDeleteModal"></div>

      <div class="relative bg-white rounded-2xl shadow-2xl w-[400px] max-w-[90%] p-6 transform transition-all scale-100 border border-slate-100">

        <div class="flex flex-col items-center text-center">
          <div class="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-4">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>

          <h3 class="text-xl font-bold text-slate-900 mb-2">공고 삭제</h3>
          <p class="text-slate-500 text-sm mb-6 leading-relaxed">
            정말로 이 공고를 삭제하시겠습니까?<br>
            삭제된 데이터는 <span class="text-rose-500 font-bold">복구할 수 없습니다.</span>
          </p>

          <div class="flex gap-3 w-full">
            <button
                @click="closeDeleteModal"
                class="flex-1 py-2.5 px-4 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              취소
            </button>
            <button
                @click="confirmDelete"
                class="flex-1 py-2.5 px-4 bg-rose-500 text-white rounded-xl font-bold hover:bg-rose-600 shadow-md hover:shadow-lg transition-all"
            >
              삭제하기
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 모달: 링크 복사 성공 -->
  <Transition name="fade">
    <div v-if="showCopyModal" class="fixed inset-0 z-50 flex items-center justify-center" role="dialog">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="showCopyModal = false"></div>

      <div class="relative bg-white rounded-2xl shadow-2xl w-[400px] max-w-[90%] p-6 transform transition-all scale-100 border border-slate-100">
        <div class="flex flex-col items-center text-center">
          <div class="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>

          <h3 class="text-xl font-bold text-slate-900 mb-2">링크 복사 완료</h3>
          <p class="text-slate-500 text-sm mb-6 leading-relaxed">
            채용 공고 링크가 클립보드에 복사되었습니다.<br>
            원하는 곳에 붙여넣어 공유해 보세요.
          </p>

          <button
              @click="showCopyModal = false"
              class="w-full py-2.5 px-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 shadow-md hover:shadow-lg transition-all"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 모달: 면접관 수정 -->
  <Transition name="fade">
    <div v-if="isInterviewerModalOpen" class="fixed inset-0 z-50 flex items-center justify-center" role="dialog">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="closeInterviewerModal"></div>

      <div class="relative bg-white rounded-2xl shadow-2xl w-[550px] max-w-[95%] overflow-hidden flex flex-col max-h-[85vh] animate-fade-in-up border border-slate-100">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 class="text-xl font-bold text-slate-900">담당 면접관 수정</h3>
            <p class="text-xs text-slate-500 mt-1">{{ editingJob?.title }} 공고의 면접관을 배정합니다.</p>
          </div>
          <button @click="closeInterviewerModal" class="text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <!-- 검색창 (RecruitmentEditView 스타일) -->
        <div class="px-6 pt-6">
          <div class="relative mb-4">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input v-model="interviewerSearchQuery" type="text" placeholder="이름 또는 직책으로 면접관 검색..."
                   class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-500 transition-all">
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-6 pt-2 custom-scrollbar">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div v-for="intr in searchResultInterviewers" :key="intr.id"
                 @click="toggleInterviewerAssignment(intr.name)"
                 class="flex items-center p-3 rounded-xl border cursor-pointer transition-all"
                 :class="editingJob?.interviewers.includes(intr.name) ? 'bg-brand-50 border-brand-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'">
              <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-brand-600 font-bold mr-3 flex-shrink-0">
                {{ intr.name[0] }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-bold text-slate-800 truncate">{{ intr.name }}</p>
                <p class="text-xs text-slate-400 truncate">{{ intr.position }}</p>
              </div>
              <div v-if="editingJob?.interviewers.includes(intr.name)" class="text-brand-500 ml-2 flex-shrink-0">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
              </div>
            </div>
          </div>

          <div v-if="searchResultInterviewers.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-400">
            <svg class="w-12 h-12 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <p class="text-sm">검색 결과가 없습니다.</p>
          </div>
        </div>

        <div class="p-6 border-t border-slate-100 flex gap-3">
          <button @click="closeInterviewerModal" class="flex-1 py-2.5 px-4 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors">
            취소
          </button>
          <button @click="saveInterviewers" class="flex-1 bg-brand-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-brand-700 shadow-md transition-all">
            저장하기
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-10px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-fade-in-down {
  animation: fadeInDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Modal Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }
</style>