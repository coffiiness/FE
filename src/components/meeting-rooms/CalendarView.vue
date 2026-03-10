<script setup>
import { computed, reactive, ref } from 'vue'

const props = defineProps({
  rooms: { type: Array, required: true },
  bookings: { type: Array, required: true }
})

const emit = defineEmits(['dateClick', 'bookingClick'])

const labels = {
  allRooms: '\uC804\uCCB4 \uD68C\uC758\uC2E4',
  todayMove: '\uC624\uB298\uB85C \uC774\uB3D9',
  more: '\uB354\uBCF4\uAE30',
  dayNone: '\uB4F1\uB85D\uB41C \uC608\uC57D\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
  dayPick: '\uB0A0\uC9DC\uB97C \uC120\uD0DD\uD558\uC138\uC694',
  dayBookings: '\uB2F9\uC77C \uC608\uC57D',
  daySuffix: '\uC608\uC57D',
  host: '\uC8FC\uCD5C\uC790',
  noDesc: '\uC124\uBA85\uC774 \uC5C6\uC2B5\uB2C8\uB2E4.',
  close: '\uB2EB\uAE30'
}

const koDays = ['\uC77C', '\uC6D4', '\uD654', '\uC218', '\uBAA9', '\uAE08', '\uD1A0']

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
  while (days.length < 35) {
    days.push(null)
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

const getDayColor = (index) => {
  if (index === 0) return 'text-rose-500'
  if (index === 6) return 'text-blue-500'
  return 'text-slate-500'
}

const getRoomColor = (roomId) => {
  const room = props.rooms.find((r) => r.id === roomId)
  return room?.color || '#10b981'
}

const getRoomName = (roomId) => {
  const room = props.rooms.find((r) => r.id === roomId)
  return room?.name || '\uD68C\uC758\uC2E4'
}

const selectedDay = ref(null)

const openDayModal = (day) => {
  selectedDay.value = day
}

const closeDayModal = () => {
  selectedDay.value = null
}

const handleDayBookingClick = (booking) => {
  emit('bookingClick', booking)
}

const selectedDayTitle = computed(() => {
  if (!selectedDay.value) return ''
  return `${selectedDay.value.getFullYear()}\uB144 ${selectedDay.value.getMonth() + 1}\uC6D4 ${selectedDay.value.getDate()}\uC77C`
})

const selectedDayBookings = computed(() => {
  if (!selectedDay.value) return []
  return getBookingsForDay(selectedDay.value)
})
</script>

<template>
  <div class="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6">
    <div class="bg-white border border-slate-300 rounded-[28px] overflow-hidden shadow-sm flex flex-col min-h-[480px]">
      <div class="p-6 border-b border-slate-300 flex items-center justify-between bg-white">
        <div class="flex items-center gap-4">
          <select v-model="state.selectedRoom" class="px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white shadow-sm">
            <option value="all">{{ labels.allRooms }}</option>
            <option v-for="room in rooms" :key="room.id" :value="room.id">{{ room.name }}</option>
          </select>
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
              {{ state.currentMonth.getFullYear() }}년 {{ state.currentMonth.getMonth() + 1 }}월
            </h2>
            <button @click="goNextMonth" class="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-brand-600 transition-all">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-7 text-center border-b border-slate-300 bg-slate-50/50">
        <div v-for="(day, idx) in koDays" :key="day" class="py-2.5 text-[10px] font-black tracking-[0.12em]" :class="getDayColor(idx)">
          {{ day }}
        </div>
      </div>

      <div class="grid grid-cols-7 grid-rows-5 h-[540px] bg-white">
      <div
          v-for="(day, index) in calendarDays"
          :key="day ? day.toISOString() : `empty-${index}`"
          class="border-r border-b border-slate-300 p-2.5 transition-all relative group h-full overflow-hidden"
          :class="{
            'bg-slate-50/30': !day || !isSameMonth(day, state.currentMonth),
            'border-r-0': (index + 1) % 7 === 0,
            'cursor-pointer hover:bg-slate-50/50': day && isSameMonth(day, state.currentMonth),
            'cursor-default': !day || !isSameMonth(day, state.currentMonth)
          }"
          @click="day && openDayModal(day)"
        >
          <div class="flex items-center justify-between">
            <span
              v-if="day"
              :class="[
                'text-sm font-bold flex items-center justify-center w-7 h-7 rounded-full',
                isSameDay(day, today) ? 'bg-brand-600 text-white shadow-md' : (day.getDay() === 0 ? 'text-rose-500' : day.getDay() === 6 ? 'text-blue-500' : 'text-slate-500')
              ]"
            >
              {{ day.getDate() }}
            </span>
          </div>
          <div class="space-y-1 h-[44px]" v-if="day">
            <div
              v-for="booking in getBookingsForDay(day).slice(0, 2)"
              :key="booking.id"
              class="text-[10px] px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 transition-opacity text-slate-800 font-bold"
              :style="{
                backgroundColor: `${getRoomColor(booking.roomId)}20`,
                borderLeft: `2px solid ${getRoomColor(booking.roomId)}`
              }"
              @click.stop="emit('bookingClick', booking)"
            >
              <span>{{ booking.title || '회의' }}</span>
              <span class="ml-1 text-[9px] text-slate-500 font-semibold">{{ formatTime(booking.startTime) }} - {{ formatTime(booking.endTime) }}</span>
            </div>
            <button
              v-if="getBookingsForDay(day).length > 2"
              class="text-[10px] text-slate-500 px-1.5 font-semibold text-right w-full"
              @click.stop="openDayModal(day)"
            >
              외 {{ getBookingsForDay(day).length - 2 }}개
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white border border-slate-300 rounded-[28px] shadow-sm p-6 h-fit">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-sm font-bold text-slate-800">
            {{ selectedDay ? `${selectedDayTitle} ${labels.daySuffix}` : labels.dayPick }}
          </h3>
        </div>
        <button v-if="selectedDay" class="text-xs text-slate-500 hover:text-slate-700" @click="closeDayModal">{{ labels.close }}</button>
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
            backgroundColor: `${getRoomColor(booking.roomId)}0f`,
            borderColor: `${getRoomColor(booking.roomId)}40`
          }"
          @click="handleDayBookingClick(booking)"
        >
          <div class="flex justify-between items-start mb-2">
            <span class="text-[9px] px-2.5 py-1 rounded-lg font-bold uppercase tracking-widest"
                  :style="{
                    backgroundColor: `${getRoomColor(booking.roomId)}1a`,
                    color: '#0f172a'
                  }">
              {{ getRoomName(booking.roomId) }}
            </span>
            <span class="text-[10px] text-slate-500 font-bold">{{ formatTime(booking.startTime) }} - {{ formatTime(booking.endTime) }}</span>
          </div>
          <h4 class="text-sm font-bold text-slate-800 group-hover:text-slate-900 transition-colors">{{ booking.title }}</h4>
          <p class="text-[11px] text-slate-500 mt-1.5 font-medium">{{ labels.host }}: {{ booking.organizer }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
