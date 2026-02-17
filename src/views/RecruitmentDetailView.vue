<script setup>
import { reactive, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

// --- 상태 관리 ---
const activeTab = ref('CALENDAR') // 'CALENDAR' | 'APPLICANTS'
const applicantSearchQuery = ref('')
const isInterviewerEditModalOpen = ref(false)
const draggingCardId = ref(null)
const draggingOverColumnId = ref(null)

// --- Calendar State (New) ---
const calendarState = reactive({
  currentMonth: new Date(2024, 1, 14), // 2024년 2월
})

const selectedDay = ref(null)
const expandedBookingIds = ref(new Set())

// --- Constants ---
const labels = {
  allInterviewers: '전체 면접관',
  todayMove: '오늘로 이동',
  more: '더보기',
  dayNone: '등록된 면접이 없습니다.',
  dayPick: '날짜를 선택하세요',
  dayBookings: '당일 면접',
  daySuffix: '면접 일정',
  host: '면접관',
  detail: '면접 상세 보기',
  noDesc: '설명이 없습니다.',
  close: '닫기'
}

const koDays = ['일', '월', '화', '수', '목', '금', '토']

// --- Mock Data ---
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

const interviewers = ref([
  { 
    id: 1, 
    name: '김기술', 
    position: '백엔드 리드',
    bgClass: 'bg-blue-600', 
    borderClass: 'border-blue-700',
    badgeTextClass: 'text-blue-700',
    lightBgClass: 'bg-blue-50',
    lightBorderClass: 'border-blue-100',
    color: '#2563eb', // blue-600
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
    color: '#10b981', // emerald-500
    checked: true 
  },
])

const allInterviewers = ref([
  { id: 1, name: '김기술', position: '백엔드 리드' },
  { id: 2, name: '박팀장', position: '인사 팀장' },
  { id: 105, name: '이디자인', position: '프로덕트 디자이너' },
  { id: 106, name: '최프론트', position: '프론트엔드 개발자' },
])

const schedules = ref([
  { id: 1, date: '2024-02-08', time: '14:00', endTime: '15:00', title: '김지원 면접', interviewerId: 1 },
  { id: 2, date: '2024-02-09', time: '14:00', endTime: '15:00', title: '이수민 면접', interviewerId: 1 },
  { id: 3, date: '2024-02-14', time: '10:00', endTime: '11:00', title: '최진우 면접', interviewerId: 1 },
  { id: 4, date: '2024-02-14', time: '14:00', endTime: '15:00', title: '박동현 면접', interviewerId: 2 },
  { id: 5, date: '2024-02-15', time: '09:00', endTime: '18:00', title: '박팀장 휴가', interviewerId: 2, type: 'off' },
  { id: 6, date: '2024-02-16', time: '14:00', endTime: '15:00', title: '정하늘 면접', interviewerId: 1 },
  { id: 10, date: '2024-02-16', time: '15:00', endTime: '16:00', title: '강민수 면접', interviewerId: 2 },
])

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

// --- Helper Functions ---
const formatTime = (timeStr) => timeStr

const getInterviewerColor = (interviewerId) => {
  const interviewer = interviewers.value.find(i => i.id === interviewerId)
  return interviewer?.color || '#94a3b8'
}

const getInterviewerName = (interviewerId) => {
  const interviewer = interviewers.value.find(i => i.id === interviewerId)
  return interviewer?.name || '미배정'
}

// --- Calendar Logic ---
const monthStart = computed(() => new Date(calendarState.currentMonth.getFullYear(), calendarState.currentMonth.getMonth(), 1))
const monthEnd = computed(() => new Date(calendarState.currentMonth.getFullYear(), calendarState.currentMonth.getMonth() + 1, 0))

const daysInMonth = computed(() => {
  const days = []
  const date = new Date(monthStart.value)
  while (date <= monthEnd.value) {
    days.push(new Date(date))
    date.setDate(date.getDate() + 1)
  }
  return days
})

const calendarDays = computed(() => {
  const firstDay = monthStart.value.getDay()
  const empties = Array(firstDay).fill(null)
  const days = [...empties, ...daysInMonth.value]
  while (days.length < 35) {
    days.push(null)
  }
  return days
})

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate()
}

const isSameMonth = (d1, d2) => {
  if (!d1 || !d2) return false
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth()
}

const toDateString = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const getBookingsForDay = (day) => {
  if (!day) return []
  const dateStr = toDateString(day)
  
  // 체크된 면접관 ID 목록
  const checkedInterviewerIds = interviewers.value.filter(i => i.checked).map(i => i.id)

  return schedules.value.filter(s => {
    // 체크된 면접관의 일정만 필터링
    if (!checkedInterviewerIds.includes(s.interviewerId)) return false
    return s.date === dateStr
  })
}

const goPrevMonth = () => {
  calendarState.currentMonth = new Date(calendarState.currentMonth.getFullYear(), calendarState.currentMonth.getMonth() - 1, 1)
}
const goNextMonth = () => {
  calendarState.currentMonth = new Date(calendarState.currentMonth.getFullYear(), calendarState.currentMonth.getMonth() + 1, 1)
}
const goToday = () => {
  calendarState.currentMonth = new Date()
}

const getDayColor = (index) => {
  if (index === 0) return 'text-rose-500'
  if (index === 6) return 'text-blue-500'
  return 'text-slate-500'
}

// --- Interaction ---
const openDayDetail = (day) => {
  selectedDay.value = day
  expandedBookingIds.value = new Set()
}

const closeDayDetail = () => {
  selectedDay.value = null
  expandedBookingIds.value = new Set()
}

const toggleBooking = (bookingId) => {
  const next = new Set(expandedBookingIds.value)
  if (next.has(bookingId)) next.delete(bookingId)
  else next.add(bookingId)
  expandedBookingIds.value = next
}

const selectedDayTitle = computed(() => {
  if (!selectedDay.value) return ''
  return `${selectedDay.value.getFullYear()}년 ${selectedDay.value.getMonth() + 1}월 ${selectedDay.value.getDate()}일`
})

const selectedDayBookings = computed(() => {
  if (!selectedDay.value) return []
  return getBookingsForDay(selectedDay.value)
})

// --- Applicants & Other Logic ---
const filteredApplicants = computed(() => {
  const query = applicantSearchQuery.value.trim().toLowerCase()
  if (!query) return applicants.value
  return applicants.value.filter(a => 
    a.name.toLowerCase().includes(query) || a.email.toLowerCase().includes(query)
  )
})

const getApplicantsByProcess = (pid) => filteredApplicants.value.filter(a => a.processId === pid)

const copyRecruitmentLink = () => {
  const dummyLink = `https://careers.nexus.ai/jobs/${recruitment.value.id}`
  navigator.clipboard.writeText(dummyLink).then(() => {
    alert('공고 링크가 클립보드에 복사되었습니다.')
  })
}

const toggleInterviewerAssignment = (intr) => {
  const index = interviewers.value.findIndex(i => i.id === intr.id)
  if (index === -1) {
    interviewers.value.push({
      ...intr,
      bgClass: 'bg-slate-600',
      borderClass: 'border-slate-700',
      badgeTextClass: 'text-slate-700',
      lightBgClass: 'bg-slate-50',
      lightBorderClass: 'border-slate-100',
      color: '#475569',
      checked: true
    })
  } else {
    interviewers.value.splice(index, 1)
  }
}

const onDragStart = (evt, aid) => { draggingCardId.value = aid; evt.dataTransfer.effectAllowed = 'move' }
const onDrop = (evt, pid) => {
  const app = applicants.value.find(a => a.id === draggingCardId.value)
  if (app) app.processId = pid
  draggingCardId.value = null; draggingOverColumnId.value = null
}

const goInterview = () => {
  router.push({
    path: '/recruitment/interview/select',
    query: { jobId: recruitment.value.id }
  })
}
</script>

<template>
  <div class="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden relative">
    
    <!-- Sidebar -->
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

        <button @click="goInterview" class="w-full mt-4 bg-brand-600 text-white py-2 rounded-lg font-bold hover:bg-brand-700 transition">
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
      <!-- Header -->
      <header class="flex-none px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white z-10">
        <div class="flex space-x-1 bg-slate-100 p-1 rounded-lg">
          <button @click="activeTab = 'CALENDAR'" class="px-4 py-1.5 text-sm font-bold rounded-md transition-all" :class="activeTab === 'CALENDAR' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'">면접 일정</button>
          <button @click="activeTab = 'APPLICANTS'" class="px-4 py-1.5 text-sm font-bold rounded-md transition-all" :class="activeTab === 'APPLICANTS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'">지원자 관리</button>
        </div>
        
        <div v-if="activeTab === 'APPLICANTS'" class="flex items-center gap-3">
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input v-model="applicantSearchQuery" type="text" placeholder="지원자 이름/이메일 검색" 
                   class="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-1.5 text-xs focus:outline-none focus:border-brand-500 w-64 transition-all">
          </div>
        </div>
      </header>

      <!-- Calendar View (New Design) -->
      <div v-if="activeTab === 'CALENDAR'" class="flex-1 p-6 overflow-hidden">
        <div class="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 h-full">
          <!-- Main Calendar Grid -->
          <div class="bg-white border border-slate-300 rounded-[28px] overflow-hidden shadow-sm flex flex-col h-full">
            <!-- Calendar Header -->
            <div class="p-6 border-b border-slate-300 flex items-center justify-between bg-white">
              <div class="flex items-center gap-4">
                <!-- Dropdown Removed -->
              </div>
              <div class="flex items-center gap-4">
                <button @click="goToday" class="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition-all shadow-sm text-sm font-bold">
                  {{ labels.todayMove }}
                </button>
                <div class="flex items-center gap-6">
                  <button @click="goPrevMonth" class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-all">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <h2 class="text-2xl font-display font-bold text-slate-800 tracking-tight w-40 text-center">
                    {{ calendarState.currentMonth.getFullYear() }}년 {{ calendarState.currentMonth.getMonth() + 1 }}월
                  </h2>
                  <button @click="goNextMonth" class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-all">
                    <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <!-- Days Header -->
            <div class="grid grid-cols-7 text-center border-b border-slate-300 bg-slate-50/50">
              <div v-for="(day, idx) in koDays" :key="day" class="py-2.5 text-[10px] font-black tracking-[0.12em]" :class="getDayColor(idx)">
                {{ day }}
              </div>
            </div>

            <!-- Calendar Grid Body -->
            <div class="grid grid-cols-7 grid-rows-5 flex-1 bg-white">
              <div
                v-for="(day, index) in calendarDays"
                :key="day ? day.toISOString() : `empty-${index}`"
                class="border-r border-b border-slate-300 p-2.5 transition-all relative group h-full overflow-hidden"
                :class="{
                  'bg-slate-50/30': !day || !isSameMonth(day, calendarState.currentMonth),
                  'border-r-0': (index + 1) % 7 === 0,
                  'cursor-pointer hover:bg-slate-50/50': day && isSameMonth(day, calendarState.currentMonth),
                  'cursor-default': !day || !isSameMonth(day, calendarState.currentMonth)
                }"
                @click="day && openDayDetail(day)"
              >
                <div class="flex items-center justify-between">
                  <span
                    v-if="day"
                    :class="[
                      'text-sm font-bold flex items-center justify-center w-7 h-7 rounded-full',
                      isSameDay(day, new Date()) ? 'bg-brand-600 text-white shadow-md' : (day.getDay() === 0 ? 'text-rose-500' : day.getDay() === 6 ? 'text-blue-500' : 'text-slate-500')
                    ]"
                  >
                    {{ day.getDate() }}
                  </span>
                </div>
                <div class="space-y-1 h-[calc(100%-28px)] overflow-hidden" v-if="day">
                  <div
                    v-for="booking in getBookingsForDay(day).slice(0, 2)"
                    :key="booking.id"
                    class="text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity text-slate-800 font-bold"
                    :style="{
                      backgroundColor: `${getInterviewerColor(booking.interviewerId)}20`,
                      borderLeft: `2px solid ${getInterviewerColor(booking.interviewerId)}`
                    }"
                    @click.stop="openDayDetail(day)"
                  >
                    <span>{{ getInterviewerName(booking.interviewerId) }}</span>
                    <span class="ml-1 text-[9px] text-slate-500 font-semibold">{{ formatTime(booking.time) }}</span>
                  </div>
                  <button
                    v-if="getBookingsForDay(day).length > 2"
                    class="text-[10px] text-slate-500 px-1.5 font-semibold text-right w-full"
                    @click.stop="openDayDetail(day)"
                  >
                    외 {{ getBookingsForDay(day).length - 2 }}개
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Selected Day Details Sidebar -->
          <div class="bg-white border border-slate-300 rounded-[28px] shadow-sm p-6 overflow-y-auto">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h3 class="text-sm font-bold text-slate-800">
                  {{ selectedDay ? `${selectedDayTitle} ${labels.daySuffix}` : labels.dayPick }}
                </h3>
              </div>
              <button v-if="selectedDay" class="text-xs text-slate-500 hover:text-slate-700" @click="closeDayDetail">{{ labels.close }}</button>
            </div>

            <div class="space-y-3">
              <div v-if="selectedDayBookings.length === 0" class="flex flex-col items-center justify-center h-32 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <p class="font-medium text-sm">{{ labels.dayNone }}</p>
              </div>

              <div
                v-for="booking in selectedDayBookings"
                :key="booking.id"
                class="group p-4 border rounded-[20px] transition-all cursor-pointer shadow-sm"
                :style="{
                  backgroundColor: `${getInterviewerColor(booking.interviewerId)}0f`,
                  borderColor: `${getInterviewerColor(booking.interviewerId)}40`
                }"
                @click="toggleBooking(booking.id)"
              >
                <div class="flex justify-between items-start mb-2">
                  <span class="text-[9px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-widest"
                        :style="{
                          backgroundColor: `${getInterviewerColor(booking.interviewerId)}1a`,
                          color: '#0f172a'
                        }">
                    {{ getInterviewerName(booking.interviewerId) }}
                  </span>
                  <span class="text-[10px] text-slate-500 font-bold">{{ formatTime(booking.time) }} - {{ formatTime(booking.endTime || booking.time) }}</span>
                </div>
                <h4 class="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">{{ booking.title }}</h4>
                <p class="text-[11px] text-slate-500 mt-1.5 font-medium">{{ labels.host }}: {{ getInterviewerName(booking.interviewerId) }}</p>

                <div v-if="expandedBookingIds.has(booking.id)" class="mt-3 pt-3 border-t border-slate-200">
                  <div class="text-xs text-slate-600">
                    {{ booking.title }} 상세 내용...
                  </div>
                  <button class="mt-2 text-xs text-brand-600 hover:text-brand-700">
                    {{ labels.detail }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Applicants List View (Existing) -->
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
