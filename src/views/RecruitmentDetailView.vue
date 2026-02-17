<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// --- 상태 관리 ---
const activeTab = ref('CALENDAR') // 'CALENDAR' | 'APPLICANTS'
const calendarView = ref('MONTH') // 'MONTH' | 'WEEK' | 'DAY'
const currentDate = ref(new Date(2024, 1, 14)) // 기준일: 2024년 2월 14일

// 검색어 상태
const applicantSearchQuery = ref('')

// 모달 관련 상태
const isDayModalOpen = ref(false)
const isInterviewerEditModalOpen = ref(false) // 면접관 수정 모달
const selectedDateTitle = ref('')
const selectedDateEvents = ref([])

const draggingCardId = ref(null)
const draggingOverColumnId = ref(null)

// --- 링크 복사 기능 ---
const copyRecruitmentLink = () => {
  const dummyLink = `https://careers.nexus.ai/jobs/${recruitment.value.id}`
  navigator.clipboard.writeText(dummyLink).then(() => {
    alert('공고 링크가 클립보드에 복사되었습니다.')
  })
}

// --- 지원자 검색 필터링 ---
const filteredApplicants = computed(() => {
  const query = applicantSearchQuery.value.trim().toLowerCase()
  if (!query) return applicants.value
  return applicants.value.filter(a => 
    a.name.toLowerCase().includes(query) || a.email.toLowerCase().includes(query)
  )
})

const getApplicantsByProcess = (pid) => filteredApplicants.value.filter(a => a.processId === pid)

// --- 면접관 관리 ---
// 전체 면접관 목록 (수정 모달용)
const allInterviewers = ref([
  { id: 1, name: '김기술', position: '백엔드 리드' },
  { id: 2, name: '박팀장', position: '인사 팀장' },
  { id: 105, name: '이디자인', position: '프로덕트 디자이너' },
  { id: 106, name: '최프론트', position: '프론트엔드 개발자' },
])

const interviewers = ref([
  { 
    id: 1, 
    name: '김기술', 
    position: '백엔드 리드',
    // 달력 바 색상
    bgClass: 'bg-blue-600', 
    // 달력 바 테두리 (hover용)
    borderClass: 'border-blue-700',
    // 시간 배지 텍스트 색상 (흰 배경 위)
    badgeTextClass: 'text-blue-700',
    // 모달/리스트용 연한 배경
    lightBgClass: 'bg-blue-50',
    lightBorderClass: 'border-blue-100',
    checked: true 
  },
  { 
    id: 2, 
    name: '박팀장', 
    position: '인사 팀장',
    bgClass: 'bg-emerald-500', 
    borderClass: 'border-emerald-600',
    badgeTextClass: 'text-emerald-700',
    lightBgClass: 'bg-emerald-50',
    lightBorderClass: 'border-emerald-100',
    checked: true 
  },
])

// 면접관 추가/삭제 토글
const toggleInterviewerAssignment = (intr) => {
  const index = interviewers.value.findIndex(i => i.id === intr.id)
  if (index === -1) {
    // 추가 (기본 스타일 할당)
    interviewers.value.push({
      ...intr,
      bgClass: 'bg-slate-600',
      borderClass: 'border-slate-700',
      badgeTextClass: 'text-slate-700',
      lightBgClass: 'bg-slate-50',
      lightBorderClass: 'border-slate-100',
      checked: true
    })
  } else {
    // 삭제
    interviewers.value.splice(index, 1)
  }
}

// --- Mock Data: 채용 공고 & 통계 ---
const recruitment = ref({
  id: 1,
  title: '2024 상반기 백엔드 개발자 공개채용',
  period: '2024.02.01 ~ 2024.02.28',
  status: 'ACTIVE',
  dday: 'D-15',
  totalApplicants: 42,
  ongoingInterviews: 5,
  completionRate: 1.71,
})

// --- Mock Data: 일정 (시간 포함) ---
const schedules = ref([
  { id: 1, date: '2024-02-08', time: '14:00', title: '김지원 면접', interviewerId: 1 },
  { id: 2, date: '2024-02-09', time: '14:00', title: '이수민 면접', interviewerId: 1 },
  { id: 3, date: '2024-02-14', time: '10:00', title: '최진우 면접', interviewerId: 1 },
  { id: 4, date: '2024-02-14', time: '14:00', title: '박동현 면접', interviewerId: 2 },
  { id: 5, date: '2024-02-15', time: '09:00', title: '박팀장 휴가', interviewerId: 2, type: 'off' },
  { id: 6, date: '2024-02-16', time: '14:00', title: '정하늘 면접', interviewerId: 1 },
  { id: 10, date: '2024-02-16', time: '15:00', title: '강민수 면접', interviewerId: 2 },
])

// --- Mock Data: 칸반 보드 ---
const processes = ref([
  { id: 101, stageName: '서류 전형', count: 12 },
  { id: 102, stageName: '실무 면접', count: 5 },
  { id: 103, stageName: '임원 면접', count: 2 },
  { id: 104, stageName: '최종 합격', count: 1 }
])

const applicants = ref([
  { id: 1, name: '한지훈', email: 'han@test.com', processId: 101, tags: ['Java'] },
  { id: 2, name: '김민지', email: 'kim@test.com', processId: 101, tags: ['Node'] },
  { id: 3, name: '이철수', email: 'lee@test.com', processId: 102, tags: ['Spring'], hasInterview: true },
  { id: 4, name: '박영희', email: 'park@test.com', processId: 103, tags: ['Senior'], hasInterview: true },
])

// --- Calendar Logic ---

const toDateString = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const calendarHeaderDate = computed(() => {
  const y = currentDate.value.getFullYear()
  const m = currentDate.value.getMonth() + 1
  if (calendarView.value === 'DAY') {
    return `${y}년 ${m}월 ${currentDate.value.getDate()}일`
  }
  return `${y}년 ${m}월`
})

const calendarGrid = computed(() => {
  const year = currentDate.value.getFullYear()
  const month = currentDate.value.getMonth()
  const days = []

  if (calendarView.value === 'MONTH') {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDayOfWeek = firstDay.getDay() // 0:일요일

    // 지난달
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      days.push({ date: toDateString(d), day: d.getDate(), prevMonth: true, obj: d })
    }
    // 이번달
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i)
      days.push({ date: toDateString(d), day: i, obj: d })
    }
    // 다음달
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({ date: toDateString(d), day: i, nextMonth: true, obj: d })
    }

  } else if (calendarView.value === 'WEEK') {
    const curr = new Date(currentDate.value)
    const dayOfWeek = curr.getDay() 
    const diffToSunday = curr.getDate() - dayOfWeek
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr)
      d.setDate(diffToSunday + i)
      days.push({ date: toDateString(d), day: d.getDate(), obj: new Date(d) })
    }
  } else if (calendarView.value === 'DAY') {
    days.push({ date: toDateString(currentDate.value), day: currentDate.value.getDate(), obj: currentDate.value })
  }
  return days
})

const timeSlots = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

// --- Actions ---
const moveDate = (direction) => {
  const newDate = new Date(currentDate.value)
  if (calendarView.value === 'MONTH') newDate.setMonth(newDate.getMonth() + direction)
  else if (calendarView.value === 'WEEK') newDate.setDate(newDate.getDate() + (direction * 7))
  else newDate.setDate(newDate.getDate() + direction)
  currentDate.value = newDate
}

const setToday = () => { currentDate.value = new Date() }

const getFilteredEvents = (dateStr) => {
  const checkedIds = interviewers.value.filter(i => i.checked).map(i => i.id)
  return schedules.value.filter(s => s.date === dateStr && checkedIds.includes(s.interviewerId))
}

const getFilteredEventsByTime = (dateStr, time) => {
  const events = getFilteredEvents(dateStr)
  return events.filter(e => e.time && e.time.startsWith(time.split(':')[0]))
}

// 면접관 스타일 가져오기 헬퍼
const getInterviewerStyle = (interviewerId) => {
  const interviewer = interviewers.value.find(i => i.id === interviewerId)
  return interviewer || interviewers.value[0]
}

// --- Modal Actions ---
const openDayModal = (dateStr) => {
  selectedDateTitle.value = dateStr
  selectedDateEvents.value = getFilteredEvents(dateStr)
  isDayModalOpen.value = true
}

const closeDayModal = () => {
  isDayModalOpen.value = false
}

// --- Drag & Drop ---
const onDragStart = (evt, aid) => { draggingCardId.value = aid; evt.dataTransfer.effectAllowed = 'move' }
const onDrop = (evt, pid) => {
  const app = applicants.value.find(a => a.id === draggingCardId.value)
  if (app) app.processId = pid
  draggingCardId.value = null; draggingOverColumnId.value = null
}

const goInterview = () => {
  router.push({
    path: '/recruitment/interview/select',
    query: {
      jobId: recruitment.value.id
    }
  })
}


</script>

<template>
  <div class="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden relative">
    
    <aside class="w-80 bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm flex-none">
      <div class="p-6 space-y-6 overflow-y-auto">
        
        <button @click="router.push('/recruitment/home')" class="flex items-center text-slate-500 hover:text-brand-600 text-sm font-bold mb-2">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          목록으로
        </button>

        <div>
          <h5 class="text-xs font-bold text-slate-500 mb-2">공고 상세 정보</h5>
          <h1 class="text-2xl font-display font-bold text-slate-900 leading-tight mb-2">{{ recruitment.title }}</h1>
          <p class="text-xs text-slate-500 font-medium mb-4">기간: {{ recruitment.period }}</p>
          
          <button @click="copyRecruitmentLink" class="w-full flex items-center justify-center gap-2 py-2.5 bg-brand-50 text-brand-600 border border-brand-200 rounded-xl text-xs font-bold hover:bg-brand-100 transition-colors">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            공고 링크 복사
          </button>
        </div>

        <!-- 면접 생성 버튼 -->
        <button
            @click="goInterview"
            class="w-full mt-4 bg-brand-600 text-white py-2 rounded-lg font-bold hover:bg-brand-700 transition"
        >
          + 면접 생성하기
        </button>

        <div>
          <h2 class="text-sm font-bold text-slate-800 mb-3">총 지원자: {{ recruitment.totalApplicants }}명</h2>
          <div class="grid grid-cols-2 gap-3">
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span class="text-xs text-slate-500 block mb-1">진행 중 면접</span>
              <span class="text-xl font-bold text-blue-600">{{ recruitment.ongoingInterviews }}건</span>
            </div>
            <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span class="text-xs text-slate-500 block mb-1">마감일</span>
              <span class="text-xl font-bold text-slate-800">{{ recruitment.dday }}</span>
            </div>
          </div>
        </div>

        <hr class="border-slate-100">

        <div>
          <div class="flex justify-between items-center mb-4">
            <h5 class="text-xs font-bold text-slate-500">담당 면접관</h5>
            <button @click="isInterviewerEditModalOpen = true" class="text-[10px] font-bold text-brand-600 hover:underline">편집</button>
          </div>
          <div class="space-y-3">
            <div v-for="member in interviewers" :key="member.id" class="flex items-center">
              <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 mr-3 border border-slate-200">
                {{ member.name[0] }}
              </div>
              <div class="flex-1"><p class="text-sm font-bold text-slate-800">{{ member.name }}</p></div>
              <label class="flex items-center cursor-pointer">
                <input type="checkbox" v-model="member.checked" class="hidden">
                <div class="w-5 h-5 rounded border flex items-center justify-center transition-colors"
                     :class="member.checked ? member.bgClass + ' border-transparent' : 'bg-white border-slate-300'">
                  <svg v-if="member.checked" class="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </label>
            </div>
          </div>
        </div>

      </div>
    </aside>

    <main class="flex-1 flex flex-col min-w-0 bg-white">
      
      <header class="flex-none px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white z-10">
        <div class="flex space-x-1 bg-slate-100 p-1 rounded-lg">
          <button @click="activeTab = 'CALENDAR'" class="px-4 py-1.5 text-sm font-bold rounded-md transition-all" :class="activeTab === 'CALENDAR' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'">면접 일정</button>
          <button @click="activeTab = 'APPLICANTS'" class="px-4 py-1.5 text-sm font-bold rounded-md transition-all" :class="activeTab === 'APPLICANTS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'">지원자 관리</button>
        </div>
        
        <div v-if="activeTab === 'CALENDAR'" class="flex items-center space-x-2">
          <span class="text-sm font-bold text-slate-600">면접관 일정 동기화</span>
          <div class="relative inline-block w-10 mr-2 align-middle select-none">
            <input type="checkbox" checked class="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
            <div class="toggle-label block overflow-hidden h-5 rounded-full bg-brand-500 cursor-pointer"></div>
          </div>
        </div>

        <div v-if="activeTab === 'APPLICANTS'" class="flex items-center gap-3">
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input v-model="applicantSearchQuery" type="text" placeholder="지원자 이름 또는 이메일 검색..." 
                   class="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-brand-500 w-64 transition-all">
          </div>
        </div>
      </header>

      <div v-if="activeTab === 'CALENDAR'" class="flex-1 p-6 overflow-hidden flex flex-col">
        <div class="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col h-full overflow-hidden">
          
          <div class="flex-none p-4 flex items-center justify-between border-b border-slate-200">
            <div class="flex items-center space-x-4">
              <h2 class="text-xl font-bold text-slate-900 min-w-[140px]">{{ calendarHeaderDate }}</h2>
              <div class="flex bg-slate-100 rounded-lg p-0.5">
                <button @click="moveDate(-1)" class="p-1.5 hover:bg-white rounded-md shadow-sm text-slate-500">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <button @click="setToday" class="px-3 text-xs font-bold text-slate-600 hover:bg-white rounded-md shadow-sm">오늘</button>
                <button @click="moveDate(1)" class="p-1.5 hover:bg-white rounded-md shadow-sm text-slate-500">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>
            <div class="flex bg-slate-100 p-1 rounded-lg">
              <button v-for="view in ['MONTH', 'WEEK', 'DAY']" :key="view" @click="calendarView = view"
                      class="px-3 py-1.5 text-xs font-bold rounded-md transition-all"
                      :class="calendarView === view ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'">
                {{ view === 'MONTH' ? '월' : view === 'WEEK' ? '주' : '일' }}
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-auto bg-white">
            
            <div v-if="calendarView !== 'DAY'" class="grid grid-cols-7 h-full" 
                 :class="calendarView === 'WEEK' ? 'grid-rows-1' : 'grid-rows-5'">
              
              <div v-for="day in ['일','월','화','수','목','금','토']" :key="day" 
                   class="bg-slate-50 border-b border-r border-slate-200 p-2 text-center text-xs font-bold text-slate-500 h-10 flex items-center justify-center last:border-r-0">
                {{ day }}
              </div>

              <div 
                v-for="(day, idx) in calendarGrid" 
                :key="idx" 
                @click="openDayModal(day.date)"
                class="border-r border-b border-slate-200 p-1 relative flex flex-col group transition-colors hover:bg-slate-50 cursor-pointer"
                :class="[
                  {'bg-slate-50/50 text-slate-400': day.prevMonth || day.nextMonth},
                  (idx + 1) % 7 === 0 ? 'border-r-0' : '',
                  calendarView === 'WEEK' ? 'min-h-[400px]' : 'min-h-[100px]'
                ]"
              >
                <div class="flex justify-start p-1">
                  <span class="text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full" 
                        :class="toDateString(day.obj) === toDateString(new Date()) ? 'bg-brand-600 text-white' : 'text-slate-700'">
                    {{ day.day }}
                  </span>
                </div>
                
                <div class="flex-1 overflow-y-auto space-y-1 p-1 custom-scrollbar">
                  <div v-for="event in getFilteredEvents(day.date)" :key="event.id"
                       class="px-2 py-1.5 rounded-md text-[11px] font-bold text-white shadow-sm hover:shadow-md hover:scale-[1.02] transition-all flex items-center gap-2 cursor-pointer border-l-2 border-white/20"
                       :class="getInterviewerStyle(event.interviewerId).bgClass">
                    
                    <span class="bg-white px-1 rounded-[3px] font-extrabold tracking-tight"
                          :class="getInterviewerStyle(event.interviewerId).badgeTextClass">
                      {{ event.time }}
                    </span>
                    
                    <span class="truncate flex-1 tracking-tight">{{ event.title }}</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else class="flex flex-col h-full">
              <div class="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <div class="border-l-2 border-slate-200 ml-12 space-y-0 relative">
                  <div v-for="time in timeSlots" :key="time" class="relative pl-6 pb-10 last:pb-0 min-h-[80px]">
                    <span class="absolute -left-[60px] top-0 text-sm font-bold text-slate-400 w-12 text-right">{{ time }}</span>
                    <div class="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-white border-2 border-brand-400 z-10"></div>
                    
                    <div class="space-y-2 pt-1">
                      <div v-for="event in getFilteredEventsByTime(calendarGrid[0].date, time)" :key="event.id"
                           @click="openDayModal(calendarGrid[0].date)"
                           class="p-3 rounded-xl border-l-4 shadow-sm bg-white border border-slate-100 hover:shadow-md transition-all flex justify-between items-center cursor-pointer group"
                           :class="getInterviewerStyle(event.interviewerId).borderClass.replace('border', 'border-l')"> <div>
                           <p class="text-sm font-bold text-slate-800 group-hover:text-brand-600 transition-colors">{{ event.title }}</p>
                           <p class="text-xs text-slate-500 mt-0.5">면접관: {{ event.interviewerId === 1 ? '김기술' : '박팀장' }}</p>
                         </div>
                         <span class="text-sm font-black bg-slate-100 text-slate-700 px-2 py-1 rounded">{{ event.time }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <div v-else class="flex-1 overflow-x-auto p-6 bg-slate-50">
        <div class="flex h-full gap-6 min-w-max">
          <div 
            v-for="process in processes" :key="process.id"
            class="flex flex-col w-80 bg-slate-100 rounded-2xl border border-slate-200"
            @dragover.prevent="draggingOverColumnId = process.id"
            @drop="onDrop($event, process.id)"
            :class="{'ring-2 ring-brand-300 bg-brand-50': draggingOverColumnId === process.id}"
          >
            <div class="flex-none p-4 flex items-center justify-between border-b border-slate-200 bg-white rounded-t-2xl">
              <h3 class="font-bold text-slate-700">{{ process.stageName }}</h3>
              <span class="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-500">{{ getApplicantsByProcess(process.id).length }}</span>
            </div>
            <div class="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
              <div v-for="app in getApplicantsByProcess(process.id)" :key="app.id"
                   draggable="true" @dragstart="onDragStart($event, app.id)"
                   class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-grab active:cursor-grabbing hover:border-brand-400 hover:shadow-md transition-all"
                   :class="{'opacity-50 border-dashed': draggingCardId === app.id}">
                <div class="flex justify-between items-start mb-2">
                  <span class="font-bold text-slate-900">{{ app.name }}</span>
                  <div v-if="app.hasInterview" class="text-brand-600 bg-brand-50 p-1 rounded-full"><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg></div>
                </div>
                <p class="text-xs text-slate-500 mb-2">{{ app.email }}</p>
                <div class="flex gap-1">
                  <span v-for="tag in app.tags" :key="tag" class="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">{{ tag }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>

    <!-- 모달: 일일 일정 -->
    <div v-if="isDayModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="closeDayModal">
      <div class="bg-white rounded-2xl shadow-2xl w-[400px] max-w-[90%] overflow-hidden flex flex-col max-h-[600px] animate-fade-in-up border border-slate-200">
        <div class="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 class="text-xl font-bold text-slate-900 tracking-tight">{{ selectedDateTitle }}</h3>
            <p class="text-xs text-slate-500 font-medium mt-1">총 {{ selectedDateEvents.length }}건의 일정</p>
          </div>
          <button @click="closeDayModal" class="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-full shadow-sm border border-slate-200 transition-all">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          <div v-if="selectedDateEvents.length === 0" class="flex flex-col items-center justify-center h-40 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <p class="font-medium">등록된 일정이 없습니다.</p>
          </div>
          <div v-for="evt in selectedDateEvents" :key="evt.id" 
               class="p-4 rounded-xl border flex items-center space-x-4 hover:shadow-md hover:translate-x-1 transition-all bg-white group cursor-default"
               :class="[getInterviewerStyle(evt.interviewerId).lightBorderClass, getInterviewerStyle(evt.interviewerId).lightBgClass]">
            <div class="flex-none flex items-center justify-center w-16 h-12 rounded-lg bg-white border shadow-sm text-slate-800" :class="getInterviewerStyle(evt.interviewerId).lightBorderClass">
              <span class="text-base font-black tracking-tight">{{ evt.time }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-base font-bold text-slate-900 truncate group-hover:text-brand-700 transition-colors">{{ evt.title }}</h4>
              <div class="flex items-center mt-1">
                 <div class="w-2 h-2 rounded-full mr-2" :class="getInterviewerStyle(evt.interviewerId).bgClass"></div>
                 <span class="text-xs text-slate-600 font-bold">{{ evt.interviewerId === 1 ? '김기술 면접관' : '박팀장' }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="p-4 border-t border-slate-100 bg-slate-50 text-right">
          <button class="text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2 rounded-lg transition-colors shadow-sm">
            + 일정 추가하기
          </button>
        </div>
      </div>
    </div>

    <!-- 모달: 면접관 수정 -->
    <div v-if="isInterviewerEditModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="isInterviewerEditModalOpen = false">
      <div class="bg-white rounded-2xl shadow-2xl w-[450px] max-w-[95%] overflow-hidden flex flex-col max-h-[80vh] animate-fade-in-up">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 class="text-xl font-bold text-slate-900">담당 면접관 수정</h3>
            <p class="text-xs text-slate-500 mt-1">이 공고의 면접을 담당할 면접관을 배정합니다.</p>
          </div>
          <button @click="isInterviewerEditModalOpen = false" class="text-slate-400 hover:text-slate-600">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <div v-for="intr in allInterviewers" :key="intr.id" 
               @click="toggleInterviewerAssignment(intr)"
               class="flex items-center p-3 rounded-xl border cursor-pointer transition-all"
               :class="interviewers.some(i => i.id === intr.id) ? 'bg-brand-50 border-brand-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'">
            <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-brand-600 font-bold mr-3">
              {{ intr.name[0] }}
            </div>
            <div class="flex-1">
              <p class="text-sm font-bold text-slate-800">{{ intr.name }}</p>
              <p class="text-xs text-slate-400">{{ intr.position }}</p>
            </div>
            <div v-if="interviewers.some(i => i.id === intr.id)" class="text-brand-500">
              <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
            </div>
          </div>
        </div>
        <div class="p-6 border-t border-slate-100 flex justify-end">
          <button @click="isInterviewerEditModalOpen = false" class="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-800 transition-colors">
            저장 후 닫기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.toggle-checkbox:checked { right: 0; border-color: #0d9488; }
.toggle-checkbox:checked + .toggle-label { background-color: #0d9488; }
.toggle-checkbox { right: 0; z-index: 1; border-color: #e2e8f0; transition: all 0.3s; }
.toggle-label { width: 2.5rem; height: 1.25rem; background-color: #cbd5e1; }

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out forwards;
}
</style>
