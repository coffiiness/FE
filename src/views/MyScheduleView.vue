<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import ScheduleListModal from '@/components/schedule/ScheduleListModal.vue'
import ScheduleCreateModal from '@/components/schedule/ScheduleCreateModal.vue'
import ScheduleDetailModal from '@/components/schedule/ScheduleDetailModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useRoute } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { useScheduleStore } from '@/stores/schedule'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useRoomStore } from '@/stores/room'

// 1. 상태 및 상수 정의
const currentView = ref('MONTH')
const viewOptions = [
  { label: '일', value: 'DAY' },
  { label: '주', value: 'WEEK' },
  { label: '월', value: 'MONTH' }
]

const koDays = ['일', '월', '화', '수', '목', '금', '토']
const timeSlots = Array.from({ length: 12 }, (_, i) => `${i + 9 < 10 ? '0' : ''}${i + 9}:00`)

const isListModalOpen = ref(false)
const isFormModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const isSuccessModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const isDisconnectConfirmModalOpen = ref(false)
const isDisconnectSuccessModalOpen = ref(false)

// Store
const scheduleStore = useScheduleStore()
const { schedules: allSchedules } = storeToRefs(scheduleStore)
const { getToday } = scheduleStore

// 초기값: 진짜 오늘 날짜로 설정
const selectedDate = ref(getToday())
const selectedEventToEdit = ref(null)
const selectedEventDetail = ref(null)
const targetDeleteId = ref(null)
const route = useRoute()
const notificationStore = useNotificationStore()
const { acceptedSchedules } = storeToRefs(notificationStore)

// 2. 통합 데이터 (오늘 기준으로 자동 생성되어 항상 데이터가 보임) - Store로 이동됨

// [우측 사이드바] 실제 '오늘' 이후의 일정만 필터링
const upcomingEvents = computed(() => {
  const today = getToday()
  return allSchedules.value
      .filter(e => e.date >= today && e.type === 'INTERVIEW') // 오늘 포함 미래의 면접 일정만 필터링
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
      .slice(0, 3) // 최대 3개
})

// [월간 뷰용] 동적 캘린더 데이터 생성
const calendarDays = computed(() => {
  const currDate = new Date(selectedDate.value)
  const year = currDate.getFullYear()
  const month = currDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const startDayOfWeek = firstDayOfMonth.getDay()

  const days = []
  // 빈칸 채우기
  for(let i=0; i<startDayOfWeek; i++) {
    days.push({ date: '', dayDisplay: '', isCurrentMonth: false, events: [] })
  }

  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  for(let i=1; i<=lastDayOfMonth; i++) {
    const dayStr = i < 10 ? `0${i}` : `${i}`
    const monthStr = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`
    const dateStr = `${year}-${monthStr}-${dayStr}`

    const events = allSchedules.value.filter(e => e.date === dateStr)

    days.push({
      date: dateStr,
      dayDisplay: i,
      isCurrentMonth: true,
      dayOfWeek: new Date(year, month, i).getDay(),
      events: events
    })
  }

  while(days.length < 35) {
    days.push({ date: '', dayDisplay: '', isCurrentMonth: false, events: [] })
  }

  return days
})

// --- [Logic] 날짜 계산 및 이동 ---

const goToToday = () => {
  selectedDate.value = getToday()
}

const navigateDate = (direction) => {
  const date = new Date(selectedDate.value)

  if (currentView.value === 'WEEK') {
    date.setDate(date.getDate() + (direction * 7))
  } else if (currentView.value === 'DAY') {
    date.setDate(date.getDate() + direction)
  } else {
    date.setMonth(date.getMonth() + direction)
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  selectedDate.value = `${year}-${month}-${day}`
}

const currentMonthTitle = computed(() => {
  const date = new Date(selectedDate.value)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
})

const dayViewTitle = computed(() => {
  const date = new Date(selectedDate.value)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
})
const dayViewSubtitle = computed(() => {
  const date = new Date(selectedDate.value)
  return koDays[date.getDay()] + '요일'
})

// [주간 뷰] 이번 주 날짜 계산
const currentWeekDays = computed(() => {
  const curr = new Date(selectedDate.value)
  const dayOfWeek = curr.getDay()
  const startDay = new Date(curr)
  startDay.setDate(curr.getDate() - dayOfWeek)

  const week = []
  for (let i = 0; i < 7; i++) {
    const next = new Date(startDay)
    next.setDate(startDay.getDate() + i)

    const year = next.getFullYear()
    const month = String(next.getMonth() + 1).padStart(2, '0')
    const day = String(next.getDate()).padStart(2, '0')
    const fullDate = `${year}-${month}-${day}`

    week.push({
      dayName: koDays[i],
      dateNum: next.getDate(),
      fullDate: fullDate
    })
  }
  return week
})

const weekViewTitle = computed(() => {
  const start = currentWeekDays.value[0]
  const end = currentWeekDays.value[6]
  const startMonth = new Date(start.fullDate).getMonth() + 1
  const endMonth = new Date(end.fullDate).getMonth() + 1

  if (startMonth === endMonth) {
    return `${startMonth}월 ${start.dateNum}일 - ${end.dateNum}일`
  }
  return `${startMonth}월 ${start.dateNum}일 - ${endMonth}월 ${end.dateNum}일`
})

const currentListEvents = computed(() => {
  if (!selectedDate.value) return []
  return allSchedules.value
      .filter(e => e.date === selectedDate.value)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
})

const getDayColor = (index) => {
  if (index === 0) return 'text-rose-500'
  if (index === 6) return 'text-blue-500'
  return 'text-slate-500'
}

const getEventsForDate = (date) => {
  return allSchedules.value.filter(e => e.date === date)
}

const getEventStyle = (event) => {
  const startHour = parseInt(event.startTime.split(':')[0])
  const startMin = parseInt(event.startTime.split(':')[1])
  const endHour = parseInt(event.endTime.split(':')[0])
  const endMin = parseInt(event.endTime.split(':')[1])

  const baseHour = 9
  const slotHeight = 80

  const top = ((startHour - baseHour) * slotHeight) + ((startMin / 60) * slotHeight)
  const durationHour = endHour - startHour
  const durationMin = endMin - startMin
  const height = (durationHour * slotHeight) + ((durationMin / 60) * slotHeight)

  return {
    top: `${top}px`,
    height: `${height}px`
  }
}

const getEventClass = (type) => {
  switch (type) {
    case 'INTERVIEW': return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    case 'MEETING': return 'bg-amber-50 text-amber-700 border-amber-100'
    case 'BUSINESS_TRIP': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case 'VACATION': return 'bg-rose-50 text-rose-700 border-rose-100'
    default: return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}

const getEventClassWeek = (type) => {
  switch (type) {
    case 'INTERVIEW': return 'bg-indigo-600 text-white border-indigo-800'
    case 'MEETING': return 'bg-amber-100 text-amber-800 border-amber-400'
    case 'BUSINESS_TRIP': return 'bg-emerald-100 text-emerald-800 border-emerald-400'
    case 'VACATION': return 'bg-rose-100 text-rose-800 border-rose-400'
    default: return 'bg-slate-100 text-slate-800 border-slate-400'
  }
}

const getEventClassList = (type) => {
  switch (type) {
    case 'INTERVIEW': return 'bg-indigo-100 text-indigo-600'
    case 'MEETING': return 'bg-amber-100 text-amber-600'
    case 'BUSINESS_TRIP': return 'bg-emerald-100 text-emerald-600'
    case 'VACATION': return 'bg-rose-100 text-rose-600'
    default: return 'bg-slate-100 text-slate-600'
  }
}


// --- [Events] ---

const handleDateClick = (date) => {
  if (!date) return
  selectedDate.value = date
  isListModalOpen.value = true
}

const openDetailModal = (event) => {
  const room = getRoomInfo(event)
  selectedEventDetail.value = { ...event, room }
  isDetailModalOpen.value = true
}

const mergeAcceptedSchedules = (items) => {
  items.forEach((item) => {
    if (!allSchedules.value.some((e) => e.id === item.id)) {
      scheduleStore.addSchedule(item)
    }
  })
}

onMounted(() => {
  const scheduleId = Number(route.query.scheduleId)
  if (Number.isNaN(scheduleId)) return
  const target = allSchedules.value.find((e) => e.id === scheduleId)
  if (target) openDetailModal(target)
})

watch(
  acceptedSchedules,
  (value) => {
    mergeAcceptedSchedules(value)
  },
  { deep: true, immediate: true }
)

const openCreateForm = (date = null) => {
  selectedDate.value = date || selectedDate.value
  selectedEventToEdit.value = null
  isFormModalOpen.value = true
}

const openEditForm = (event) => {
  isDetailModalOpen.value = false
  selectedEventToEdit.value = event
  isFormModalOpen.value = true
}

const handleSave = (formData) => {
  if (formData.id) {
    scheduleStore.updateSchedule(formData)
  } else {
    scheduleStore.addSchedule(formData)
  }
  isFormModalOpen.value = false
  setTimeout(() => {
    isSuccessModalOpen.value = true
  }, 300)
}

const openDeleteConfirm = (id) => {
  isDetailModalOpen.value = false
  targetDeleteId.value = id
  isDeleteModalOpen.value = true
}

const confirmDelete = () => {
  if (targetDeleteId.value) {
    scheduleStore.deleteSchedule(targetDeleteId.value)
  }
  isDeleteModalOpen.value = false
  isFormModalOpen.value = false
  targetDeleteId.value = null
}

// 면접관 응답 확인 연결
const router = useRouter()

const goToInterviewResponse = () => {
  router.push('/recruitment/interview/response')
}

// Room Store
const roomStore = useRoomStore()

const getRoomInfo = (schedule) => {
  if (schedule.roomId) {
    const r = roomStore.getRoomById(schedule.roomId)
    if (r) return r
  }
  return null
}

// Google Calendar 연동
const isGoogleConnected = ref(localStorage.getItem('isGoogleCalendarConnected') === 'true')
const googleConnectedEmail = ref(localStorage.getItem('googleCalendarEmail') || '')

const connectGoogleCalendar = () => {
  const clientId = '553048700196-ojj8o5cgbq8d76q18khbkfh4t191mvoc.apps.googleusercontent.com'
  const redirectUri = window.location.origin + '/auth/callback'
  const scope = 'https://www.googleapis.com/auth/calendar openid email profile'
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`
  
  window.location.href = googleAuthUrl
}

const disconnectGoogleCalendar = () => {
  isDisconnectConfirmModalOpen.value = true
}

const confirmDisconnectGoogleCalendar = () => {
  localStorage.removeItem('isGoogleCalendarConnected')
  localStorage.removeItem('googleCalendarEmail')
  isGoogleConnected.value = false
  googleConnectedEmail.value = ''
  isDisconnectConfirmModalOpen.value = false
  setTimeout(() => {
    isDisconnectSuccessModalOpen.value = true
  }, 300)
}

</script>

<template>
  <div class="min-h-screen bg-slate-50 px-8 pb-8 pt-0 font-sans text-slate-600">
    <header class="flex justify-end items-center mb-6">
      <div class="flex items-center gap-3">
        <div class="flex bg-slate-200/60 p-1 rounded-lg border border-slate-300">
          <button
              v-for="opt in viewOptions"
              :key="opt.value"
              @click="currentView = opt.value"
              class="px-5 py-1.5 text-xs font-bold rounded-md transition-all"
              :class="currentView === opt.value ? 'bg-white text-brand-600 shadow-sm ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'"
          >
            {{ opt.label }}
          </button>
        </div>
        <button
            @click="goToToday"
            class="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg transition-all shadow-sm text-sm font-bold"
        >
          오늘로 이동
        </button>
        <button
                      @click="openCreateForm(getToday())"
                      class="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg transition-all flex items-center text-sm"
            
        >
          <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
          </svg>
          일정 생성
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div class="lg:col-span-3 bg-white border border-slate-300 rounded-[32px] overflow-hidden shadow-sm flex flex-col transition-all duration-300 min-h-[700px]">

        <div v-if="currentView === 'MONTH'" class="flex flex-col flex-1">
          <div class="p-6 border-b border-slate-300 flex items-center justify-center relative bg-white">
            <div class="flex items-center gap-6">
              <button @click="navigateDate(-1)" class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-all">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h2 class="text-2xl font-display font-bold text-slate-800 tracking-tight w-40 text-center">{{ currentMonthTitle }}</h2>
              <button @click="navigateDate(1)" class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-all">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>

          <div class="grid grid-cols-7 text-center border-b border-slate-300 bg-slate-50/50">
            <div v-for="(day, idx) in koDays" :key="day" class="py-4 text-[11px] font-black tracking-[0.15em]" :class="getDayColor(idx)">
              {{ day }}
            </div>
          </div>
          <div class="grid grid-cols-7 grid-rows-5 flex-1 bg-white">
            <div v-for="(cell, index) in calendarDays" :key="index"
                 class="border-r border-b border-slate-300 p-4 transition-all hover:bg-slate-50/50 relative group cursor-pointer"
                 :class="{'bg-slate-50/20': !cell.isCurrentMonth, 'border-r-0': (index + 1) % 7 === 0}"
                 @click="cell.isCurrentMonth && handleDateClick(cell.date)">
              <div class="flex items-center justify-between">
                 <span :class="[
                     'text-sm font-bold flex items-center justify-center w-7 h-7 rounded-full',
                     !cell.isCurrentMonth && 'opacity-0',
                     cell.date === getToday() ? 'bg-brand-600 text-white shadow-md' : (cell.dayOfWeek === 0 ? 'text-rose-500' : cell.dayOfWeek === 6 ? 'text-blue-500' : 'text-slate-500')
                 ]">
                   {{ cell.dayDisplay }}
                 </span>
              </div>
              <div v-if="cell.events.length" class="mt-2 space-y-1.5">
                <div v-for="(evt) in cell.events.slice(0, 2)" :key="evt.id" class="truncate text-[10px] px-2 py-1.5 rounded-lg font-bold border shadow-sm" :class="getEventClass(evt.type)">
                  {{ evt.startTime }} {{ evt.title }}
                </div>
                <div v-if="cell.events.length > 2" class="text-[10px] font-bold text-slate-400 pl-1">+ {{ cell.events.length - 2 }}개</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="currentView === 'WEEK'" class="flex-1 overflow-y-auto custom-scrollbar bg-white">
          <div class="flex flex-col h-full">
            <div class="flex items-center justify-center p-6 border-b border-slate-300 bg-white sticky top-0 z-40">
              <div class="flex items-center gap-6">
                <button @click="navigateDate(-1)" class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-all">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div class="text-center min-w-[200px]">
                  <h2 class="text-2xl font-display font-bold text-slate-800 tracking-tight">{{ currentMonthTitle }}</h2>
                  <p class="text-sm font-bold text-slate-500 mt-1">{{ weekViewTitle }}</p>
                </div>
                <button @click="navigateDate(1)" class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-all">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-[80px_1fr] border-b border-slate-300 bg-slate-50/50 sticky top-[88px] z-30">
              <div class="border-r border-slate-300"></div>
              <div class="grid grid-cols-7">
                <div v-for="(day, idx) in currentWeekDays" :key="day.fullDate"
                     class="py-3 text-center border-r border-slate-300 last:border-0 flex flex-col items-center gap-1 group cursor-pointer hover:bg-slate-100 transition-colors"
                     @click="handleDateClick(day.fullDate)">
                  <span class="text-[10px] font-black tracking-widest uppercase" :class="getDayColor(idx)">{{ day.dayName }}</span>
                  <span class="text-xl font-display font-bold leading-none w-8 h-8 flex items-center justify-center rounded-lg transition-all"
                        :class="{
                          'bg-brand-600 text-white shadow-md': day.fullDate === getToday(),
                          'ring-1 ring-brand-600 text-brand-600': day.fullDate === selectedDate && day.fullDate !== getToday(),
                          'text-slate-700 group-hover:text-brand-600': day.fullDate !== getToday() && day.fullDate !== selectedDate
                        }">
                    {{ day.dateNum }}
                  </span>
                </div>
              </div>
            </div>

            <div class="flex flex-1">
              <div class="w-20 border-r border-slate-300 shrink-0 bg-slate-50/10">
                <div v-for="time in timeSlots" :key="time" class="h-20 border-b border-slate-300 text-[11px] font-bold text-slate-500 flex items-start justify-center pt-2">
                  {{ time }}
                </div>
              </div>
              <div class="flex-1 grid grid-cols-7 relative">
                <div v-for="(day, dayIdx) in currentWeekDays" :key="dayIdx" class="relative border-r border-slate-300 last:border-0 group">
                  <div v-for="time in timeSlots" :key="time" class="h-20 border-b border-slate-300 hover:bg-slate-50/30 transition-colors"></div>

                  <div v-for="evt in getEventsForDate(day.fullDate)" :key="evt.id"
                       @click.stop="openDetailModal(evt)"
                       class="absolute left-1 right-1 p-2 rounded-xl shadow-md z-50 cursor-pointer hover:scale-[1.03] transition-transform overflow-hidden border-l-4"
                       :class="getEventClassWeek(evt.type)"
                       :style="getEventStyle(evt)">
                    <p class="text-[10px] font-bold opacity-90">{{ evt.startTime }}</p>
                    <p class="text-[11px] font-extrabold truncate">{{ evt.title }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex-1 bg-white p-10 overflow-y-auto custom-scrollbar">
          <div class="flex justify-between items-center mb-10 border-b-2 border-slate-200 pb-8">
            <div class="w-32 hidden lg:block"></div>
            <div class="flex justify-center items-center gap-6 flex-1">
              <button @click="navigateDate(-1)" class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-all">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
              </button>

              <div class="text-center min-w-[240px]">
                <h3 class="text-3xl font-display font-extrabold text-slate-900 tracking-tight">{{ dayViewTitle }}</h3>
                <div class="flex items-center justify-center gap-2 mt-2">
                  <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <p class="text-slate-500 font-semibold">{{ dayViewSubtitle }} · 총 {{ currentListEvents.length }}건의 업무</p>
                </div>
              </div>

              <button @click="navigateDate(1)" class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-all">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
              </button>

              <button @click="goToToday" class="ml-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all">
                오늘
              </button>
            </div>
            <div class="w-32 flex justify-end">
              <button @click="openCreateForm(selectedDate)" class="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-2 bg-brand-50 px-5 py-3 rounded-lg transition-all">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" /></svg>
                일정 추가
              </button>
            </div>
          </div>

          <div class="space-y-6">
            <div v-if="currentListEvents.length === 0" class="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[32px] border border-dashed border-slate-300">
              <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <p class="text-slate-400 font-bold">등록된 일정이 없습니다.</p>
              <button @click="openCreateForm(selectedDate)" class="mt-2 text-sm text-brand-500 font-bold hover:underline">새 일정 만들기</button>
            </div>

            <div v-for="evt in currentListEvents" :key="evt.id"
                 @click="openDetailModal(evt)"
                 class="group p-8 rounded-[28px] border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer flex items-center gap-10">

              <div class="w-24 text-center shrink-0 border-r-2 border-slate-100 pr-6">
                <span class="block text-2xl font-black text-slate-800 tracking-tighter">{{ evt.startTime }}</span>
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">PM</span>
              </div>

              <div class="flex-1 min-w-0">
                <span class="inline-block px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-3"
                      :class="getEventClassList(evt.type)">
                  {{ evt.type }}
                </span>
                <h4 class="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug">{{ evt.title }}</h4>
                <p class="text-base text-slate-400 mt-2 font-medium">{{ evt.description }}</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div class="space-y-8">
        <div class="bg-white border border-slate-300 p-8 rounded-[32px] shadow-sm">
          <h3 class="text-lg font-display font-bold text-slate-800 mb-6 flex items-center justify-between">다가오는 면접</h3>
          <div class="space-y-4">
            <div v-for="event in upcomingEvents" :key="event.id"
                 @click="openDetailModal(event)"
                 class="group p-5 bg-slate-50/50 border border-slate-200 rounded-[24px] hover:border-indigo-300 hover:bg-white transition-all cursor-pointer shadow-sm">
              <div class="flex justify-between items-start mb-3">
                <span class="text-[9px] px-2.5 py-1 bg-indigo-100 text-indigo-600 rounded-lg font-bold uppercase tracking-widest">{{ event.type }}</span>
                <span class="text-[10px] text-slate-500 font-bold">{{ event.date }}</span>
              </div>
              <h4 class="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{{ event.title }}</h4>
              <p class="text-[11px] text-slate-500 mt-1.5 font-medium flex items-center gap-1.5"><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{{ event.time }}</p>
            </div>
          </div>
          <!-- 면접관 응답 확인 버튼 영역 -->
          <div class="mt-6 pt-5 border-t border-slate-200">
            <button
                @click="$router.push('/recruitment/interview/response')"
                class="w-full flex items-center justify-center gap-2 py-3 rounded-xl
           bg-brand-50 text-brand-600 font-bold text-sm
           hover:bg-brand-100 transition-all"
            >
              면접관 응답 확인
              <svg class="w-4 h-4 transition-transform group-hover:translate-x-1"
                   fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div class="bg-white border border-slate-200 p-6 rounded-[32px] shadow-sm flex flex-col gap-4 relative overflow-hidden group">
          <div class="absolute -right-6 -top-6 w-24 h-24 bg-blue-50 rounded-full blur-2xl group-hover:bg-blue-100 transition-colors"></div>

          <div class="relative z-10 flex justify-between items-start">
            <div>
              <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Calendar Sync</h3>
              <p class="text-lg font-bold text-slate-800 flex items-center gap-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google" class="w-5 h-5">
                Google Calendar
              </p>
              <p v-if="isGoogleConnected && googleConnectedEmail" class="text-[11px] text-slate-500 font-medium mt-1 truncate max-w-[160px]">
                {{ googleConnectedEmail }}
              </p>
            </div>
            <span v-if="isGoogleConnected" class="px-2 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-bold border border-emerald-100 flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              연동됨
            </span>
            <span v-else class="px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-200 flex items-center gap-1">
              미연동
            </span>
          </div>

          <div class="relative z-10">
            <template v-if="isGoogleConnected">
              <p class="text-xs text-slate-500 mb-4 font-medium">
                일정이 구글 캘린더와<br>자동으로 동기화됩니다.
              </p>
              <button @click="disconnectGoogleCalendar" class="w-full py-3 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold transition-all flex items-center justify-center gap-2">
                연동 해제
              </button>
            </template>
            <template v-else>
              <p class="text-xs text-slate-500 mb-4 font-medium">
                구글 캘린더와 연동하여<br>일정을 간편하게 관리하세요.
              </p>
              <button @click="connectGoogleCalendar" class="w-full py-3 rounded-lg bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-600 text-xs font-bold transition-all flex items-center justify-center gap-2">
                구글 캘린더 연동하기
              </button>
            </template>
          </div>
        </div>
      </div>
    </div>

    <ScheduleDetailModal
        :isOpen="isDetailModalOpen"
        :event="selectedEventDetail || {}"
        @close="isDetailModalOpen = false"
        @edit="openEditForm"
        @delete="openDeleteConfirm"
    />

    <ScheduleListModal :isOpen="isListModalOpen" :date="selectedDate" :events="currentListEvents" @close="isListModalOpen = false" @add="() => openCreateForm(selectedDate)" @edit="openDetailModal" @delete="openDeleteConfirm" />
    <ScheduleCreateModal :isOpen="isFormModalOpen" :initialDate="selectedDate" :initialData="selectedEventToEdit" @close="isFormModalOpen = false" @save="handleSave" @delete="openDeleteConfirm" />
    <ConfirmModal :show="isDeleteModalOpen" title="일정 삭제" message="정말로 이 일정을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다." confirmText="삭제하기" type="danger" @confirm="confirmDelete" @cancel="isDeleteModalOpen = false" />
    <ConfirmModal :show="isSuccessModalOpen" title="일정 생성 완료" message="새로운 일정이 성공적으로 생성되었습니다." confirmText="확인" type="success" :showCancel="false" @confirm="isSuccessModalOpen = false" @cancel="isSuccessModalOpen = false" />
    
    <!-- 구글 캘린더 연동 해제 모달 -->
    <ConfirmModal 
      :show="isDisconnectConfirmModalOpen" 
      title="연동 해제" 
      message="정말로 구글 캘린더 연동을 해제하시겠습니까?" 
      confirmText="해제하기" 
      type="danger" 
      @confirm="confirmDisconnectGoogleCalendar" 
      @cancel="isDisconnectConfirmModalOpen = false" 
    />
    <ConfirmModal 
      :show="isDisconnectSuccessModalOpen" 
      title="해제 완료" 
      message="구글 캘린더 연동이 성공적으로 해제되었습니다." 
      confirmText="확인" 
      type="success" 
      :showCancel="false" 
      @confirm="isDisconnectSuccessModalOpen = false" 
      @cancel="isDisconnectSuccessModalOpen = false" 
    />
  </div>
</template>
<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap');
.font-display { font-family: 'Outfit', sans-serif; }
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>
