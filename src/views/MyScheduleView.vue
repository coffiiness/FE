<script setup>
import { ref, computed } from 'vue'
import ScheduleListModal from '@/components/schedule/ScheduleListModal.vue'
import ScheduleCreateModal from '@/components/schedule/ScheduleCreateModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

// 1. 상태 및 상수 정의
const currentView = ref('MONTH') // 'MONTH', 'WEEK', 'DAY'
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

// [수정] 초기 날짜를 데이터가 있는 2월 7일로 고정 (데모용)
const selectedDate = ref('2024-02-07')
const selectedEventToEdit = ref(null)
const targetDeleteId = ref(null)

// [샘플 데이터: 다가오는 면접]
const upcomingEvents = ref([
  { id: 101, title: '기술 면접: 박지원', time: '오후 1:00 - 2:30', date: '2월 7일', type: 'interview' },
  { id: 102, title: '최종 면접: 김인사', time: '오후 3:00 - 4:00', date: '2월 7일', type: 'interview' },
  { id: 103, title: '팀 미팅: 채용 전략', time: '오후 5:00 - 6:00', date: '2월 7일', type: 'meeting' }
])

// [샘플 데이터: 캘린더]
const calendarDays = ref(Array.from({ length: 35 }, (_, i) => {
  const day = i - 3
  // 2024년 2월 기준 날짜 생성
  const isCurrentMonth = day > 0 && day <= 29
  const dateStr = `2024-02-${day < 10 ? '0' + day : day}`

  let initialEvents = []
  // 2월 7일에 샘플 데이터 추가
  if (day === 7) {
    initialEvents = [
      { id: 1, date: dateStr, time: '13:00', title: '기술 면접: 박지원', type: 'interview', description: '1층 미팅룸 A' },
      { id: 2, date: dateStr, time: '15:00', title: '임원 면접 대기', type: 'interview', description: '화상 면접 링크 확인' },
      { id: 3, date: dateStr, time: '16:00', title: '주간 회의', type: 'meeting', description: '상반기 공고 마감 관련' }
    ]
  }

  return {
    date: dateStr,
    dayDisplay: isCurrentMonth ? day : '',
    isCurrentMonth,
    dayOfWeek: i % 7, // 0:일 ~ 6:토
    events: initialEvents
  }
}))

// --- [Logic] 날짜 계산 및 이동 ---

const getToday = () => new Date().toISOString().split('T')[0]

// "오늘로 이동" 기능
const goToToday = () => {
  selectedDate.value = getToday()
}

// 통합 이동 함수
const navigateDate = (direction) => {
  const date = new Date(selectedDate.value)

  if (currentView.value === 'WEEK') {
    date.setDate(date.getDate() + (direction * 7))
  } else if (currentView.value === 'DAY') {
    date.setDate(date.getDate() + direction)
  } else {
    // 월간 뷰: 1달 이동 (단순화)
    date.setMonth(date.getMonth() + direction)
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  selectedDate.value = `${year}-${month}-${day}`
}

// [공통 타이틀] 2024년 2월
const currentMonthTitle = computed(() => {
  const date = new Date(selectedDate.value)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
})

// [일간 뷰] 타이틀
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
  const first = curr.getDate() - curr.getDay() // 일요일 기준

  const week = []
  for (let i = 0; i < 7; i++) {
    const next = new Date(curr)
    next.setDate(first + i)
    week.push({
      dayName: koDays[i], // 한글 요일
      dateNum: next.getDate(),
      fullDate: next.toISOString().split('T')[0]
    })
  }
  return week
})

// [주간 뷰] 타이틀 (범위 표시)
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
  const day = calendarDays.value.find(d => d.date === selectedDate.value)
  return day ? day.events : []
})

const getDayColor = (index) => {
  if (index === 0) return 'text-rose-500' // 일요일
  if (index === 6) return 'text-blue-500' // 토요일
  return 'text-slate-500'
}

// --- [Events] ---

const handleDateClick = (date) => {
  selectedDate.value = date
  isListModalOpen.value = true
}

const openCreateForm = (date = null) => {
  selectedDate.value = date || getToday()
  selectedEventToEdit.value = null
  isFormModalOpen.value = true
}

const openEditForm = (event) => {
  selectedEventToEdit.value = event
  isFormModalOpen.value = true
}

const handleSave = (formData) => {
  const targetDay = calendarDays.value.find(d => d.date === formData.date)
  if (targetDay) {
    if (formData.id) {
      // 수정
      const idx = targetDay.events.findIndex(e => e.id === formData.id)
      if (idx !== -1) targetDay.events[idx] = { ...targetDay.events[idx], ...formData }
    } else {
      // 생성
      targetDay.events.push({ ...formData, id: Date.now() })
    }
  }
  isFormModalOpen.value = false
}

const openDeleteConfirm = (id) => {
  targetDeleteId.value = id
  isDeleteModalOpen.value = true
}

const confirmDelete = () => {
  if (targetDeleteId.value) {
    const targetDay = calendarDays.value.find(d => d.date === selectedDate.value)
    if (targetDay) {
      targetDay.events = targetDay.events.filter(e => e.id !== targetDeleteId.value)
    }
  }
  isDeleteModalOpen.value = false
  isFormModalOpen.value = false
  targetDeleteId.value = null
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 px-8 pb-8 pt-0 font-sans text-slate-600">
    <header class="flex justify-end items-center mb-6">
      <div class="flex items-center gap-3">
        <div class="flex bg-slate-200/60 p-1 rounded-xl border border-slate-300">
          <button
              v-for="opt in viewOptions"
              :key="opt.value"
              @click="currentView = opt.value"
              class="px-5 py-1.5 text-xs font-bold rounded-lg transition-all"
              :class="currentView === opt.value ? 'bg-white text-indigo-600 shadow-md ring-1 ring-black/5' : 'text-slate-500 hover:text-slate-700'"
          >
            {{ opt.label }}
          </button>
        </div>
        <button
            @click="goToToday"
            class="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl transition-all shadow-sm text-sm font-bold"
        >
          오늘로 이동
        </button>
        <button
            @click="openCreateForm(getToday())"
            class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center text-sm"
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
              <button @click="navigateDate(-1)" class="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <h2 class="text-2xl font-display font-bold text-slate-800 tracking-tight w-40 text-center">{{ currentMonthTitle }}</h2>
              <button @click="navigateDate(1)" class="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all">
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
              <span :class="['text-sm font-bold', !cell.isCurrentMonth && 'opacity-0', cell.dayOfWeek === 0 ? 'text-rose-500' : cell.dayOfWeek === 6 ? 'text-blue-500' : 'text-slate-500']">{{ cell.dayDisplay }}</span>
              <div v-if="cell.events.length" class="mt-2 space-y-1.5">
                <div v-for="(evt) in cell.events.slice(0, 2)" :key="evt.id" class="truncate text-[10px] px-2 py-1.5 rounded-lg font-bold border shadow-sm" :class="evt.type === 'interview' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-amber-50 text-amber-700 border-amber-100'">
                  {{ evt.time }} {{ evt.title }}
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
                <button @click="navigateDate(-1)" class="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div class="text-center min-w-[200px]">
                  <h2 class="text-2xl font-display font-bold text-slate-800 tracking-tight">{{ currentMonthTitle }}</h2>
                  <p class="text-sm font-bold text-slate-500 mt-1">{{ weekViewTitle }}</p>
                </div>
                <button @click="navigateDate(1)" class="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all">
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
                  <span class="text-xl font-display font-bold text-slate-700 leading-none group-hover:text-indigo-600" :class="{'text-white bg-indigo-600 px-2 py-0.5 rounded-md shadow-md': day.fullDate === selectedDate}">{{ day.dateNum }}</span>
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
                <div v-for="dayIdx in 7" :key="dayIdx" class="relative border-r border-slate-300 last:border-0">
                  <div v-for="time in timeSlots" :key="time" class="h-20 border-b border-slate-300 hover:bg-slate-50/30 transition-colors"></div>
                  <div v-if="dayIdx === 4" class="absolute top-[320px] left-1.5 right-1.5 p-3 bg-indigo-600 text-white rounded-xl shadow-xl z-20 cursor-pointer hover:scale-[1.03] transition-transform ring-2 ring-white/20">
                    <p class="text-[10px] font-bold opacity-90">13:00</p>
                    <p class="text-[11px] font-extrabold truncate">기술 면접</p>
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
              <button @click="navigateDate(-1)" class="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" /></svg>
              </button>

              <div class="text-center min-w-[240px]">
                <h3 class="text-3xl font-display font-extrabold text-slate-900 tracking-tight">{{ dayViewTitle }}</h3>
                <div class="flex items-center justify-center gap-2 mt-2">
                  <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
                  <p class="text-slate-500 font-semibold">{{ dayViewSubtitle }} · 총 {{ currentListEvents.length }}건의 업무</p>
                </div>
              </div>

              <button @click="navigateDate(1)" class="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-indigo-600 transition-all">
                <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
              </button>

              <button @click="goToToday" class="ml-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all">
                오늘
              </button>
            </div>
            <div class="w-32 flex justify-end">
              <button @click="openCreateForm(selectedDate)" class="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2 bg-indigo-50 px-5 py-3 rounded-2xl transition-all">
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
              <button @click="openCreateForm(selectedDate)" class="mt-2 text-sm text-indigo-500 font-bold hover:underline">새 일정 만들기</button>
            </div>

            <div v-for="evt in currentListEvents" :key="evt.id"
                 @click="openEditForm(evt)"
                 class="group p-8 rounded-[28px] border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer flex items-center gap-10">
              <div class="w-24 text-center shrink-0 border-r-2 border-slate-100 pr-10">
                <span class="block text-3xl font-black text-slate-800 tracking-tighter">{{ evt.time }}</span>
                <span class="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">PM</span>
              </div>
              <div class="flex-1 min-w-0">
                <span class="inline-block px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-3"
                      :class="evt.type === 'interview' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'">
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
            <div v-for="event in upcomingEvents" :key="event.id" class="group p-5 bg-slate-50/50 border border-slate-200 rounded-[24px] hover:border-indigo-300 hover:bg-white transition-all cursor-pointer shadow-sm">
              <div class="flex justify-between items-start mb-3">
                <span class="text-[9px] px-2.5 py-1 bg-indigo-100 text-indigo-600 rounded-lg font-bold uppercase tracking-widest">{{ event.type }}</span>
                <span class="text-[10px] text-slate-500 font-bold">{{ event.date }}</span>
              </div>
              <h4 class="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{{ event.title }}</h4>
              <p class="text-[11px] text-slate-500 mt-1.5 font-medium flex items-center gap-1.5"><svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{{ event.time }}</p>
            </div>
          </div>
        </div>
        <div class="bg-indigo-600 border border-indigo-700 p-8 rounded-[32px] relative overflow-hidden shadow-2xl shadow-indigo-200">
          <div class="relative z-10">
            <h3 class="text-xs font-bold text-indigo-100 uppercase tracking-[0.2em] mb-3">Today's Focus</h3>
            <p class="text-3xl font-display font-bold text-white tracking-tight">3건의 인터뷰</p>
            <p class="text-xs text-indigo-100/70 mt-3 font-medium">모든 일정을 수락하셨습니다.</p>
          </div>
          <div class="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 blur-3xl rounded-full"></div>
        </div>
      </div>
    </div>

    <ScheduleListModal :isOpen="isListModalOpen" :date="selectedDate" :events="currentListEvents" @close="isListModalOpen = false" @add="() => openCreateForm(selectedDate)" @edit="openEditForm" @delete="openDeleteConfirm" />
    <ScheduleCreateModal :isOpen="isFormModalOpen" :initialDate="selectedDate" :initialData="selectedEventToEdit" @close="isFormModalOpen = false" @save="handleSave" @delete="openDeleteConfirm" />
    <ConfirmModal :show="isDeleteModalOpen" title="일정 삭제" message="정말로 이 일정을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다." confirmText="삭제하기" type="danger" @confirm="confirmDelete" @cancel="isDeleteModalOpen = false" />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;900&display=swap');
.font-display { font-family: 'Outfit', sans-serif; }
.custom-scrollbar::-webkit-scrollbar { width: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
</style>