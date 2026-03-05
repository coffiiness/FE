<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import InterviewDetailModal from '@/components/recruitment/InterviewDetailModal.vue'
// Stores
import { useRecruitmentStore } from '@/stores/recruitment'
import { useScheduleStore } from '@/stores/schedule'
import { useOrganizationStore } from '@/stores/organization'
import { storeToRefs } from 'pinia'
import applicantData from '@/data/applicant.json' // Import dummy data

const route = useRoute()
const router = useRouter()
const jobId = Number(route.params.id)

const recruitmentStore = useRecruitmentStore()
const scheduleStore = useScheduleStore()
const organizationStore = useOrganizationStore()

const { jobs } = storeToRefs(recruitmentStore)
const { schedules: allSchedules } = storeToRefs(scheduleStore)
const { organizations } = storeToRefs(organizationStore)

// --- 상태 관리 ---
const activeTab = ref('CALENDAR') // 'CALENDAR' | 'APPLICANTS'
const applicantSearchQuery = ref('')
const applicants = ref(applicantData) // Initialize applicants data
const isInterviewerEditModalOpen = ref(false)
const draggingCardId = ref(null)
const draggingOverColumnId = ref(null)

// --- Modal State ---
const isInterviewDetailModalOpen = ref(false)
const selectedInterview = ref(null)
const showCopyModal = ref(false) // 링크 복사 모달

// --- Calendar State (New) ---
const calendarState = reactive({
  currentMonth: new Date(), // 현재 날짜로 초기화
})

const currentView = ref('MONTH')
const viewOptions = [
  { label: '일', value: 'DAY' },
  { label: '주', value: 'WEEK' },
  { label: '월', value: 'MONTH' }
]

const timeSlots = Array.from({ length: 12 }, (_, i) => `${i + 9 < 10 ? '0' : ''}${i + 9}:00`)

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

// --- Recruitment Data from API ---
const recruitment = computed(() => {
  const job = jobs.value.find(j => j.id === jobId)
  if (!job) return {}

  // D-Day 계산
  let ddayText = '-'
  let statusText = job.status || 'DRAFT'
  if (job.endDate) {
    const end = new Date(job.endDate)
    const now = new Date()
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) { ddayText = '마감'; statusText = 'CLOSED' }
    else if (diffDays <= 3) { ddayText = `D-${diffDays}`; statusText = 'URGENT' }
    else { ddayText = `D-${diffDays}` }
  }

  // 경력 텍스트
  let positionText = '경력 무관'
  if (job.careerType === 'NEW') positionText = '신입'
  else if (job.careerType === 'EXPERIENCED') {
    const min = job.minExperienceYears
    const max = job.maxExperienceYears
    if (min && max) positionText = `경력 ${min}~${max}년`
    else if (min) positionText = `경력 ${min}년 이상`
    else positionText = '경력'
  }

  // 기간 텍스트
  const startStr = job.startDate ? new Date(job.startDate).toLocaleDateString('ko-KR') : '미정'
  const endStr = job.endDate ? new Date(job.endDate).toLocaleDateString('ko-KR') : '미정'

  return {
    id: job.id,
    title: job.title,
    period: `${startStr} ~ ${endStr}`,
    status: statusText,
    dday: ddayText,
    totalApplicants: (job.stages || []).reduce((sum, s) => sum + (s.applicantCount || 0), 0),
    ongoingInterviews: 0,
    completionRate: 0,
    interviewers: (job.assignees || []).map(a => a.name || '?'),
    position: positionText,
    leadGroupName: job.leadGroupName || '-',
    stages: job.stages || []
  }
})

// (Removed duplicate)

const interviewers = ref([])

// 조직도에서 전체 직원 가져오기
const allEmployees = computed(() => {
  if (!organizations.value) return []
  return organizations.value.flatMap(dept => dept.teams.flatMap(team => team.members))
})

// Initialize interviewers based on recruitment data
watch([recruitment, allEmployees], ([newVal, employees]) => {
  if (newVal && newVal.id && newVal.interviewers && employees.length > 0) {
    interviewers.value = employees
      .filter(emp => newVal.interviewers.includes(emp.name))
      .map((emp, idx) => ({
        ...emp,
        bgClass: 'bg-blue-600',
        borderClass: 'border-blue-700',
        badgeTextClass: 'text-blue-700',
        lightBgClass: 'bg-blue-50',
        lightBorderClass: 'border-blue-100',
        color: idx % 3 === 0 ? '#2563eb' : (idx % 3 === 1 ? '#10b981' : '#6366f1'),
        checked: true
      }))
  }
}, { immediate: true })

const schedules = computed(() => {
  if (!allSchedules.value) return []
  return allSchedules.value
    .filter(s => s.recruitmentId === jobId)
    .map(s => ({
      ...s
    }))
})

// ...

const openInterviewDetail = (booking) => {
  selectedInterview.value = {
    ...booking,
    host: getInterviewerName(booking.interviewerId),
    // Use store's attendees if available, otherwise allow modal to handle it or fallback
    attendees: booking.attendees || (booking.applicantName ? [booking.applicantName] : []), 
  }
  isInterviewDetailModalOpen.value = true
}

// --- Computed ---

const selectedDayTitle = computed(() => {
  if (!selectedDay.value) return ''
  return `${selectedDay.value.getFullYear()}년 ${selectedDay.value.getMonth() + 1}월 ${selectedDay.value.getDate()}일`
})

const selectedDayBookings = computed(() => {
  if (!selectedDay.value) return []
  return getBookingsForDay(selectedDay.value)
})

const currentDayTitle = computed(() => {
  const d = calendarState.currentMonth
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
})

const currentWeekTitle = computed(() => {
  if (currentWeekDays.value.length === 0) return ''
  const start = currentWeekDays.value[0]
  const end = currentWeekDays.value[6]
  const startMonth = start.getMonth() + 1
  const endMonth = end.getMonth() + 1
  
  if (start.getFullYear() !== end.getFullYear()) {
     return `${start.getFullYear()}년 ${startMonth}월 ${start.getDate()}일 - ${end.getFullYear()}년 ${endMonth}월 ${end.getDate()}일`
  }
  if (startMonth !== endMonth) {
     return `${start.getFullYear()}년 ${startMonth}월 ${start.getDate()}일 - ${endMonth}월 ${end.getDate()}일`
  }
  return `${start.getFullYear()}년 ${startMonth}월 ${start.getDate()}일 - ${end.getDate()}일`
})

// --- Computed for Week View ---
const currentWeekDays = computed(() => {
  const curr = new Date(calendarState.currentMonth)
  const dayOfWeek = curr.getDay()
  const startDay = new Date(curr)
  startDay.setDate(curr.getDate() - dayOfWeek)

  const week = []
  for (let i = 0; i < 7; i++) {
    const next = new Date(startDay)
    next.setDate(startDay.getDate() + i)
    week.push(new Date(next))
  }
  return week
})

// --- Helper for Week View Styles ---
const getEventStyle = (booking) => {
  if (!booking.startTime || !booking.endTime) return {}
  const startHour = parseInt(booking.startTime.split(':')[0])
  const startMin = parseInt(booking.startTime.split(':')[1])
  const endHour = parseInt(booking.endTime.split(':')[0])
  const endMin = parseInt(booking.endTime.split(':')[1])

  const baseHour = 9
  const slotHeight = 60

  const top = ((startHour - baseHour) * slotHeight) + ((startMin / 60) * slotHeight)
  const durationHour = endHour - startHour
  const durationMin = endMin - startMin
  const height = Math.max((durationHour * slotHeight) + ((durationMin / 60) * slotHeight), 30)

  return {
    top: `${top}px`,
    height: `${height}px`
  }
}

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
    showCopyModal.value = true
  }).catch(err => {
    console.error('링크 복사 실패', err)
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

// --- Calendar Logic ---
const goToday = () => { calendarState.currentMonth = new Date() }
const goPrev = () => {
  const d = new Date(calendarState.currentMonth)
  if (currentView.value === 'WEEK') d.setDate(d.getDate() - 7)
  else if (currentView.value === 'DAY') d.setDate(d.getDate() - 1)
  else d.setMonth(d.getMonth() - 1)
  calendarState.currentMonth = d
}
const goNext = () => {
  const d = new Date(calendarState.currentMonth)
  if (currentView.value === 'WEEK') d.setDate(d.getDate() + 7)
  else if (currentView.value === 'DAY') d.setDate(d.getDate() + 1)
  else d.setMonth(d.getMonth() + 1)
  calendarState.currentMonth = d
}

const isSameMonth = (d1, d2) => d1 && d2 && d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()
const isSameDay = (d1, d2) => d1 && d2 && d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()

const calendarDays = computed(() => {
  const curr = new Date(calendarState.currentMonth)
  const year = curr.getFullYear()
  const month = curr.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const days = []
  const inputDate = new Date(firstDay)
  while (inputDate.getDay() > 0) {
    inputDate.setDate(inputDate.getDate() - 1)
    days.unshift(new Date(inputDate))
  }
  
  const currentMonthDays = []
  for (let i = 1; i <= lastDay.getDate(); i++) {
    currentMonthDays.push(new Date(year, month, i))
  }
  
  const totalDays = [...days, ...currentMonthDays]
  const remaining = 35 - totalDays.length
  
  const nextMonthDate = new Date(lastDay)
  for (let i = 1; i <= remaining; i++) {
    nextMonthDate.setDate(nextMonthDate.getDate() + 1)
    totalDays.push(new Date(nextMonthDate))
  }
  
  return totalDays
})

const getBookingsForDay = (date) => {
  if (!date || !schedules.value) return []
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return schedules.value.filter(s => s.date === dateStr).sort((a,b) => a.startTime.localeCompare(b.startTime))
}

const getInterviewerName = (id) => {
  if (!id) return '미지정'
  const emp = allEmployees.value.find(e => e.id === id)
  return emp ? emp.name : 'Unknown'
}

const getInterviewerColor = (id) => {
  // Simple hash for color
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  return colors[id % colors.length] || '#64748b'
}

const openDayDetail = (day) => {
  selectedDay.value = day
}
const closeDayDetail = () => {
  selectedDay.value = null
}
const toggleBooking = (id) => {
  if (expandedBookingIds.value.has(id)) expandedBookingIds.value.delete(id)
  else expandedBookingIds.value.add(id)
}

const handleInterviewDelete = (interviewId) => {
  // TODO: 실제 면접 삭제 API 호출
  // axios.delete(`/recruitment/interviews/${interviewId}`)
  isInterviewDetailModalOpen.value = false
  setTimeout(() => {
    alert('면접 일정이 삭제되었습니다.')
    // 실제 데이터에서 제거하는 로직은 생략 (Mock)
  }, 300)
}
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const [hour, min] = timeStr.split(':').map(Number)
  const ampm = hour >= 12 ? '오후' : '오전'
  // 12 -> 12, 13 -> 1, 0 -> 12
  const formattedHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
  return `${ampm} ${formattedHour}:${String(min).padStart(2, '0')}`
}

const getDayColor = (index) => {
  if (index === 0) return 'text-rose-500' // Sunday
  if (index === 6) return 'text-blue-500' // Saturday
  return 'text-slate-500'
}
</script>

<template>
  <div v-if="!recruitment.id" class="flex h-screen items-center justify-center bg-slate-50">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
      <p class="text-slate-500 font-bold">공고 정보를 불러오는 중입니다...</p>
    </div>
  </div>

  <div v-else class="flex h-[calc(100vh-4rem)] bg-slate-50 overflow-hidden relative">
    
    <!-- Sidebar -->
    <aside class="w-80 bg-white border-r border-slate-200 flex flex-col z-20 shadow-sm flex-none">
      <div class="p-6 space-y-6 overflow-y-auto">
        <button @click="router.push('/recruitment/home')" class="flex items-center text-slate-500 hover:text-brand-600 text-sm font-bold mb-2">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          목록으로
        </button>

        <div>
          <h5 class="text-xs font-bold text-slate-500 mb-2">공고 상세 정보</h5>
          <h1 class="text-2xl font-display font-bold text-slate-900 leading-tight mb-1">{{ recruitment.title }}</h1>
          <p class="text-sm font-bold text-brand-600 mb-2">{{ recruitment.position }}</p>
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
              <div class="flex items-center gap-2">
                 <div class="flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
                  <button
                      v-for="opt in viewOptions"
                      :key="opt.value"
                      @click="currentView = opt.value"
                      class="px-2.5 py-1 text-[11px] font-bold rounded transition-all"
                      :class="currentView === opt.value ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
                  >
                    {{ opt.label }}
                  </button>
                </div>
                <button @click="goToday" class="px-3 py-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-md transition-all text-[11px] font-bold">
                  {{ labels.todayMove }}
                </button>
              </div>
              <div class="flex items-center gap-3">
                <button @click="goPrev" class="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-all">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div class="text-center min-w-[180px]">
                  <h2 class="text-lg font-display font-bold text-slate-800 tracking-tight">
                    {{ calendarState.currentMonth.getFullYear() }}년 {{ calendarState.currentMonth.getMonth() + 1 }}월
                  </h2>
                  <p v-if="currentView === 'WEEK'" class="text-[11px] font-bold text-brand-600">{{ currentWeekTitle }}</p>
                  <p v-if="currentView === 'DAY'" class="text-[11px] font-bold text-brand-600">{{ currentDayTitle }}</p>
                </div>
                <button @click="goNext" class="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-all">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- MONTH VIEW -->
            <template v-if="currentView === 'MONTH'">
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
                        isSameDay(day, new Date()) ? 'bg-brand-600 text-white shadow-md' : 
                        (selectedDay && isSameDay(day, selectedDay)) ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-200' :
                        (day.getDay() === 0 ? 'text-rose-500' : day.getDay() === 6 ? 'text-blue-500' : 'text-slate-500')
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
                      @click.stop="openInterviewDetail(booking)"
                    >
                      <span>{{ getInterviewerName(booking.interviewerId) }}</span>
                      <span class="ml-1 text-[9px] text-slate-500 font-semibold">{{ booking.startTime }}</span>
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
            </template>

            <!-- WEEK VIEW -->
            <template v-else-if="currentView === 'WEEK'">
              <div class="flex flex-col h-full overflow-hidden">
                 <!-- Week Header -->
                <div class="grid grid-cols-[60px_1fr] border-b border-slate-300 bg-slate-50/50 sticky top-0 z-30">
                  <div class="border-r border-slate-300"></div>
                  <div class="grid grid-cols-7">
                    <div v-for="(day, idx) in currentWeekDays" :key="day.toISOString()"
                         class="py-3 text-center border-r border-slate-300 last:border-0 flex flex-col items-center gap-1 group cursor-pointer hover:bg-slate-100 transition-colors"
                         @click="calendarState.currentMonth = new Date(day); selectedDay = day; currentView = 'DAY'">
                      <span class="text-[10px] font-black tracking-widest uppercase" :class="getDayColor(idx)">{{ koDays[idx] }}</span>
                      <span class="text-lg font-display font-bold leading-none w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                            :class="{
                              'bg-brand-600 text-white shadow-md': isSameDay(day, new Date()),
                              'ring-1 ring-brand-600 text-brand-600': isSameDay(day, calendarState.currentMonth) && !isSameDay(day, new Date()),
                              'text-slate-700 group-hover:text-brand-600': !isSameDay(day, new Date()) && !isSameDay(day, calendarState.currentMonth)
                            }">
                        {{ day.getDate() }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Time Grid -->
                <div class="flex flex-1 overflow-y-auto custom-scrollbar">
                  <div class="w-[60px] border-r border-slate-300 shrink-0 bg-slate-50/10">
                    <div v-for="time in timeSlots" :key="time" class="h-[60px] border-b border-slate-300 text-[10px] font-bold text-slate-500 flex items-start justify-center pt-2">
                      {{ time }}
                    </div>
                  </div>
                  <div class="flex-1 grid grid-cols-7 relative">
                    <div v-for="(day, dayIdx) in currentWeekDays" :key="dayIdx" class="relative border-r border-slate-300 last:border-0 group">
                      <div v-for="time in timeSlots" :key="time" class="h-[60px] border-b border-slate-300 hover:bg-slate-50/30 transition-colors"></div>

                      <div v-for="evt in getBookingsForDay(day)" :key="evt.id"
                           @click="openInterviewDetail(evt)"
                           class="absolute left-1 right-1 p-1.5 rounded-lg shadow-sm z-20 cursor-pointer hover:scale-[1.02] transition-transform overflow-hidden border-l-4"
                           :style="{
                             ...getEventStyle(evt),
                             backgroundColor: `${getInterviewerColor(evt.interviewerId)}`,
                             borderColor: getInterviewerColor(evt.interviewerId),
                             color: '#fff'
                           }">
                        <div class="flex flex-col h-full justify-center">
                           <!-- <p class="text-[9px] font-bold opacity-90 mb-0.5">{{ evt.time }}</p> -->
                           <p class="text-[10px] font-extrabold truncate leading-tight">{{ evt.applicantName }}</p>
                           <p class="text-[9px] font-medium truncate opacity-90">{{ evt.title }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- DAY VIEW -->
            <template v-else>
              <div class="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div class="space-y-4 max-w-3xl mx-auto">
                  <div v-if="getBookingsForDay(calendarState.currentMonth).length === 0" class="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[28px] border border-dashed border-slate-300">
                     <p class="text-sm font-bold text-slate-400">등록된 면접 일정이 없습니다.</p>
                  </div>

                  <div v-for="evt in getBookingsForDay(calendarState.currentMonth)" :key="evt.id"
                       @click="openInterviewDetail(evt)"
                       class="group p-6 rounded-[24px] border border-slate-200 bg-white hover:border-brand-300 hover:shadow-lg hover:shadow-brand-500/10 transition-all cursor-pointer flex items-center gap-6">
                    
                    <div class="w-20 text-center shrink-0 border-r-2 border-slate-100 pr-4">
                      <span class="block text-xl font-black text-slate-800 tracking-tighter">{{ evt.time }}</span>
                    </div>

                    <div class="flex-1 min-w-0">
                      <span class="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-1"
                            :style="{
                              backgroundColor: `${getInterviewerColor(evt.interviewerId)}20`,
                              color: getInterviewerColor(evt.interviewerId)
                            }">
                        {{ getInterviewerName(evt.interviewerId) }}
                      </span>
                      <h4 class="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">{{ evt.title }}</h4>
                      <p class="text-sm text-slate-500 mt-1 font-medium">{{ evt.description }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </template>
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
                  <span class="text-[10px] text-slate-500 font-bold">{{ booking.time }}</span>
                </div>
                <h4 class="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">{{ booking.title }}</h4>
                <p class="text-[11px] text-slate-500 mt-1.5 font-medium">{{ labels.host }}: {{ getInterviewerName(booking.interviewerId) }}</p>

                <div v-if="expandedBookingIds.has(booking.id)" class="mt-3 pt-3 border-t border-slate-200">
                  <div class="text-xs text-slate-600 mb-2">
                    {{ booking.description }}
                  </div>
                  <button @click.stop="openInterviewDetail(booking)" class="text-xs text-brand-600 hover:text-brand-700 font-bold hover:underline">
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
          <div v-for="intr in allEmployees" :key="intr.id" 
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

    <!-- 모달: 링크 복사 성공 -->
    <Transition name="fade">
      <div v-if="showCopyModal" class="fixed inset-0 z-[70] flex items-center justify-center" role="dialog">
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

    <!-- 모달: 면접 상세 보기 -->
    <InterviewDetailModal 
      :show="isInterviewDetailModalOpen" 
      :event="selectedInterview || {}" 
      @close="isInterviewDetailModalOpen = false"
      @delete="handleInterviewDelete"
    />

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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
