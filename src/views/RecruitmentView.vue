<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// --- 상태 관리 ---
const activeMenuId = ref(null) // 현재 열려있는 드롭다운 메뉴의 ID

// --- 데이터 (Mock) ---
const stats = ref([
  { label: '진행 중인 공고', value: 5, unit: '건', color: 'text-slate-900', bg: 'bg-white' },
  { label: '이번 주 면접 예정', value: 12, unit: '명', color: 'text-brand-600', bg: 'bg-brand-50/50' },
  { label: '조율 대기 (병목)', value: 3, unit: '건', color: 'text-rose-600', bg: 'bg-rose-50/50', glow: true },
])

const jobs = ref([
  {
    id: 1,
    title: 'Backend Server Developer',
    position: 'Junior (1-3년)',
    team: 'Platform Team',
    status: 'active',
    dday: 'D-5',
    totalApplicants: 42,
    funnel: [
      { step: '서류', count: 15, active: false },
      { step: '코딩테스트', count: 8, active: false },
      { step: '면접', count: 4, active: true },
      { step: '처우', count: 1, active: false },
    ],
    interviewers: ['김', '이', 'Park']
  },
  {
    id: 2,
    title: 'Product Designer (UX/UI)',
    position: 'Senior (5년 이상)',
    team: 'Design Group',
    status: 'urgent',
    dday: 'D-2',
    totalApplicants: 28,
    funnel: [
      { step: '서류', count: 5, active: true },
      { step: '코딩테스트', count: 2, active: false },
      { step: '면접', count: 0, active: false },
      { step: '처우', count: 0, active: false },
    ],
    interviewers: ['Choi', 'Jung']
  },
  {
    id: 3,
    title: 'DevOps Engineer',
    position: 'Mid-Level',
    team: 'Infra Unit',
    status: 'active',
    dday: 'D-12',
    totalApplicants: 15,
    funnel: [
      { step: '서류', count: 8, active: false },
      { step: '면접', count: 2, active: true },
      { step: '최종', count: 0, active: false },
    ],
    interviewers: ['Lee', 'Kim', 'Ho']
  },
  {
    id: 4,
    title: 'Frontend Developer',
    position: 'All Levels',
    team: 'Web Core',
    status: 'closed',
    dday: '마감',
    totalApplicants: 156,
    funnel: [
      { step: '종료', count: 156, active: false },
    ],
    interviewers: ['Park']
  },
])

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
</script>

<template>
  <div v-if="activeMenuId !== null" @click="activeMenuId = null" class="fixed inset-0 z-10 cursor-default"></div>

  <div class="space-y-8 animate-fade-in-up p-2 relative z-0">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h2 class="text-3xl font-display font-bold text-slate-900 tracking-tight">채용 공고 관리</h2>
        <p class="text-slate-500 mt-1">현재 진행 중인 채용 프로세스를 한눈에 파악하고 병목 현상을 해결하세요.</p>
      </div>
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

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
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

    <div class="flex flex-col sm:flex-row gap-4">
      <div class="relative flex-1">
        <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text" 
          placeholder="공고명, 부서명 또는 담당자 검색..." 
          class="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all shadow-sm"
        >
      </div>
      <div class="flex gap-2">
        <select class="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:border-brand-500 shadow-sm transition-all">
          <option>전체 상태</option>
          <option>진행 중</option>
          <option>마감 임박</option>
          <option>종료됨</option>
        </select>
        <select class="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:border-brand-500 shadow-sm transition-all">
          <option>최신순</option>
          <option>지원자순</option>
          <option>마감일순</option>
        </select>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      <div v-for="job in jobs" :key="job.id" 
           class="group relative bg-white border border-slate-200 rounded-2xl p-6 hover:border-brand-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 shadow-sm">
        
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
              
              <button class="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center transition-colors">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                공고 수정
              </button>
              
              <button class="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center transition-colors">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                링크 복사
              </button>
              
              <button class="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-brand-600 flex items-center transition-colors">
                 <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                면접관 설정
              </button>

              <div class="border-t border-slate-100 my-1"></div>

              <button class="w-full text-left px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50 flex items-center transition-colors font-medium">
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
                            step.active 
                              ? 'bg-brand-500 text-white translate-y-0 opacity-100' 
                              : 'bg-white border border-slate-200 text-slate-600 -translate-y-1 opacity-0 group-hover/step:opacity-100 group-hover/step:translate-y-0']">
                {{ step.count }}
              </div>
              <div v-else class="h-[26px]"></div>

              <div class="w-full h-2 rounded-full mb-2 overflow-hidden bg-slate-200">
                <div :class="['h-full rounded-full transition-all duration-500', 
                              step.active ? 'bg-brand-500 w-full' : 'bg-slate-300 w-full']"></div>
              </div>
              
              <span :class="['text-sm font-bold text-center truncate w-full transition-colors', 
                             step.active ? 'text-brand-600' : 'text-slate-600']">
                {{ step.step }}
              </span>
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center border-t border-slate-100 pt-4">
          <div class="flex -space-x-2">
            <div v-for="(intr, iIdx) in job.interviewers" :key="iIdx" 
                 class="w-8 h-8 rounded-full bg-white border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-600 ring-2 ring-white shadow-sm">
              {{ intr }}
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
      
      <div 
        @click="router.push('/recruitment/create')"
        class="border-2 border-dashed border-slate-300 hover:border-brand-400 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:text-brand-600 hover:bg-slate-50 transition-all cursor-pointer group min-h-[250px]"
      >
        <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-brand-100 group-hover:scale-110 transition-all">
          <svg class="w-6 h-6 text-slate-500 group-hover:text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <span class="font-bold">새 공고 추가하기</span>
      </div>
    </div>
  </div>
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
</style>