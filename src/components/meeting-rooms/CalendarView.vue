<script setup>
import { computed, reactive, ref } from 'vue'

const props = defineProps({
  rooms: { type: Array, required: true },
  bookings: { type: Array, required: true }
})

const emit = defineEmits(['dateClick', 'bookingClick'])

const state = reactive({
  currentMonth: new Date(),
  selectedRoom: 'all'
})

const monthStart = computed(() => new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), 1))
const monthEnd = computed(() => new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 0))

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
  const total = 42
  if (days.length < total) {
    return [...days, ...Array(total - days.length).fill(null)]
  }
  return days
})

const getBookingsForDay = (day) => {
  return props.bookings.filter((b) => {
    if (state.selectedRoom !== 'all' && b.roomId !== state.selectedRoom) return false
    return b.startTime.toDateString() === day.toDateString()
  })
}

const isSameDay = (a, b) => a.toDateString() === b.toDateString()
const isSameMonth = (a, b) => a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()

const goPrevMonth = () => {
  state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1)
}
const goNextMonth = () => {
  state.currentMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1)
}
const goToday = () => {
  state.currentMonth = new Date()
}

const formatTime = (date) => {
  const h = `${date.getHours()}`.padStart(2, '0')
  const m = `${date.getMinutes()}`.padStart(2, '0')
  return `${h}:${m}`
}

const today = new Date()

const dayModalOpen = ref(false)
const selectedDay = ref(null)

const openDayModal = (day) => {
  selectedDay.value = day
  dayModalOpen.value = true
}

const closeDayModal = () => {
  dayModalOpen.value = false
  selectedDay.value = null
}

const handleDayBookingClick = (booking) => {
  emit('bookingClick', booking)
  closeDayModal()
}
</script>

<template>
  <div class="bg-white rounded-2xl border shadow-sm p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-4">
        <h2 class="text-2xl font-bold text-slate-900">회의실 캘린더</h2>
        <select v-model="state.selectedRoom" class="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white">
          <option value="all">전체 회의실</option>
          <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
        </select>
      </div>
      <div class="flex items-center gap-3">
        <button class="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white hover:bg-slate-50" @click="goToday">오늘</button>
        <div class="flex items-center gap-2">
          <button class="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white hover:bg-slate-50" @click="goPrevMonth">이전</button>
          <div class="text-lg font-semibold min-w-[140px] text-center text-slate-900">
            {{ state.currentMonth.getFullYear() }}년 {{ state.currentMonth.getMonth() + 1 }}월
          </div>
          <button class="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white hover:bg-slate-50" @click="goNextMonth">다음</button>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
      <div class="grid grid-cols-7 border-b bg-gray-50">
        <div v-for="day in ['일', '월', '화', '수', '목', '금', '토']" :key="day" class="p-3 text-center text-sm font-semibold text-slate-900">
          {{ day }}
        </div>
      </div>
      <div class="grid grid-cols-7 auto-rows-[130px]">
        <div
          v-for="(day, index) in calendarDays"
          :key="day ? day.toISOString() : `empty-${index}`"
          class="border-b border-r p-2 cursor-pointer hover:bg-gray-50 transition-colors"
          :class="day && !isSameMonth(day, state.currentMonth) ? 'bg-gray-50/50 text-slate-600' : ''"
          @click="day && emit('dateClick', day)"
        >
          <div v-if="day" class="text-sm font-semibold mb-1 text-slate-900">
            <span :class="isSameDay(day, today) ? 'w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center' : ''">
              {{ day.getDate() }}
            </span>
          </div>
          <div class="space-y-1 overflow-hidden max-h-[88px]" v-if="day">
            <div
              v-for="booking in getBookingsForDay(day).slice(0, 3)"
              :key="booking.id"
              class="text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity text-slate-900 font-medium"
              :style="{
                backgroundColor: `${rooms.find(r => r.id === booking.roomId)?.color || '#10b981'}20`,
                borderLeft: `2px solid ${rooms.find(r => r.id === booking.roomId)?.color || '#10b981'}`
              }"
              @click.stop="emit('bookingClick', booking)"
            >
              {{ formatTime(booking.startTime) }} {{ booking.title }}
            </div>
            <button
              v-if="getBookingsForDay(day).length > 3"
              class="text-xs text-slate-900 px-1.5 underline underline-offset-2 font-medium"
              @click.stop="openDayModal(day)"
            >
              +{{ getBookingsForDay(day).length - 3 }} 더보기
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="dayModalOpen" class="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
      <div class="bg-white rounded-2xl shadow-lg w-full max-w-lg">
        <div class="p-6 border-b flex items-center justify-between">
          <div class="text-lg font-semibold text-slate-900">
            {{ selectedDay ? `${selectedDay.getFullYear()}년 ${selectedDay.getMonth() + 1}월 ${selectedDay.getDate()}일` : '' }} 일정
          </div>
          <button class="text-slate-500 hover:text-slate-700" @click="closeDayModal">닫기</button>
        </div>
        <div class="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          <div
            v-for="booking in (selectedDay ? getBookingsForDay(selectedDay) : [])"
            :key="booking.id"
            class="p-4 bg-gray-50 rounded-lg border hover:border-emerald-500 transition-colors cursor-pointer"
            @click="handleDayBookingClick(booking)"
          >
            <div class="font-semibold text-slate-900">{{ booking.title }}</div>
            <div class="text-sm text-slate-700 mt-1">
              {{ formatTime(booking.startTime) }} - {{ formatTime(booking.endTime) }} · {{ booking.organizer }}
            </div>
          </div>
          <div v-if="selectedDay && getBookingsForDay(selectedDay).length === 0" class="text-sm text-slate-700">
            일정이 없습니다.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
