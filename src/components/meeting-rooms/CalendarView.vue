<script setup>
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  rooms: { type: Array, required: true },
  bookings: { type: Array, required: true },
  selectedDate: { type: String, default: '' }
})

const emit = defineEmits(['dateClick', 'bookingClick', 'roomChange', 'dateChange'])

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

const parseDateOnly = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date()
  }

  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

watch(
  () => state.selectedRoom,
  (value) => {
    emit('roomChange', value)
  }
)

watch(
  () => props.selectedDate,
  (value) => {
    if (!value) return
    const next = parseDateOnly(value)
    state.currentMonth = new Date(next.getFullYear(), next.getMonth(), 1)
  },
  { immediate: true }
)

const monthStart = computed(() => new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth(), 1))
const monthEnd = computed(() => new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 0))
const currentMonthLabel = computed(
  () => `${state.currentMonth.getFullYear()}년 ${state.currentMonth.getMonth() + 1}월`
)

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

const syncParentDate = (monthDate) => {
  const selected = props.selectedDate ? parseDateOnly(props.selectedDate) : new Date()
  const lastDate = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate()
  const next = new Date(monthDate.getFullYear(), monthDate.getMonth(), Math.min(selected.getDate(), lastDate))
  emit('dateChange', formatDate(next))
}

const goPrevMonth = () => {
  const nextMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() - 1, 1)
  state.currentMonth = nextMonth
  syncParentDate(nextMonth)
}
const goNextMonth = () => {
  const nextMonth = new Date(state.currentMonth.getFullYear(), state.currentMonth.getMonth() + 1, 1)
  state.currentMonth = nextMonth
  syncParentDate(nextMonth)
}
const goToday = () => {
  const nextMonth = new Date()
  state.currentMonth = nextMonth
  emit('dateChange', formatDate(nextMonth))
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

// 날짜 선택
const openDayModal = (day) => {
  emit('dateClick', day)
}

const handleDayBookingClick = (booking) => {
  emit('bookingClick', booking)
}
</script>

<template>
  <section class="meeting-calendar-surface">
      <div class="month-weekdays">
        <div
          v-for="(day, idx) in koDays"
          :key="day"
          class="month-weekdays__item"
          :class="getDayColor(idx)"
        >
          {{ day }}
        </div>
      </div>

      <div class="month-grid">
        <div
          v-for="(day, index) in calendarDays"
          :key="day ? day.toISOString() : `empty-${index}`"
          class="month-cell"
          :class="{
            'month-cell--muted': !day || !isSameMonth(day, state.currentMonth),
            'month-cell--today': day && isSameDay(day, today),
            'month-cell--last': (index + 1) % 7 === 0
          }"
          @click="day && openDayModal(day)"
        >
          <div class="month-cell__head">
            <span
              v-if="day"
              class="month-cell__day"
              :class="{
                'month-cell__day--today': isSameDay(day, today),
                'month-cell__day--sunday': day.getDay() === 0 && !isSameDay(day, today),
                'month-cell__day--saturday': day.getDay() === 6 && !isSameDay(day, today)
              }"
            >
              {{ day.getDate() }}
            </span>
            <span v-if="day && getBookingsForDay(day).length" class="month-cell__count">
              {{ getBookingsForDay(day).length }}
            </span>
          </div>

          <div v-if="day && getBookingsForDay(day).length" class="month-cell__events">
            <div
              v-for="booking in getBookingsForDay(day).slice(0, 2)"
              :key="booking.id"
              class="month-event-chip"
              :style="{
                backgroundColor: `${getRoomColor(booking.roomId)}16`,
                borderLeftColor: getRoomColor(booking.roomId),
                color: '#0f172a'
              }"
              @click.stop="emit('bookingClick', booking)"
            >
              <span class="month-event-chip__time">{{ formatTime(booking.startTime) }}</span>
              <span class="month-event-chip__title truncate">{{ booking.title || '회의' }}</span>
            </div>
            <button
              v-if="getBookingsForDay(day).length > 2"
              type="button"
              class="month-cell__more"
              @click.stop="openDayModal(day)"
            >
              +{{ getBookingsForDay(day).length - 2 }}개 더 보기
            </button>
          </div>
        </div>
      </div>
  </section>
</template>

<style scoped>
.meeting-calendar-surface {
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
}

.meeting-calendar-surface {
  overflow: hidden;
}

.meeting-calendar-surface__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  gap: 0.75rem;
  padding: 1rem 1rem 0.85rem;
}

.surface-title {
  font-size: 1.3rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1;
  color: rgb(15, 23, 42);
}

.surface-head-actions {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

.surface-head-nav {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

@media (max-width: 1024px) {
  .meeting-calendar-surface__head {
    grid-template-columns: 1fr;
  }

  .surface-head-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}

.toolbar-button,
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 900;
  transition: all 0.18s ease;
}

.toolbar-button {
  padding: 0.72rem 0.95rem;
}

.icon-button {
  height: 2.1rem;
  width: 2.1rem;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.96);
  color: rgb(71, 85, 105);
}

.icon-button:hover {
  border-color: rgba(15, 118, 110, 0.28);
  color: rgb(15, 118, 110);
}

.toolbar-button-subtle {
  border: 1px solid rgba(20, 184, 166, 0.22);
  background: white;
  color: rgb(15, 118, 110);
}

.toolbar-button-subtle:hover {
  filter: saturate(1.04);
}

.room-select {
  min-width: 11rem;
  height: 2.1rem;
  padding: 0 0.85rem;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  color: rgb(51, 65, 85);
  font-size: 0.78rem;
  font-weight: 900;
  outline: none;
}

.month-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  border-top: 1px solid rgba(226, 232, 240, 0.9);
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(248, 250, 252, 0.52);
}

.month-weekdays__item {
  padding: 0.75rem 0;
  text-align: center;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-template-rows: repeat(5, minmax(118px, 1fr));
  border-left: 1px solid rgba(226, 232, 240, 0.88);
}

.month-cell {
  position: relative;
  min-height: 118px;
  padding: 0.75rem 0.7rem 0.65rem;
  border-right: 1px solid rgba(226, 232, 240, 0.84);
  border-bottom: 1px solid rgba(226, 232, 240, 0.84);
  background: white;
  transition: background 0.18s ease;
  cursor: pointer;
}

.month-cell:hover {
  background: rgba(248, 250, 252, 0.74);
}

.month-cell--muted {
  background: rgba(248, 250, 252, 0.42);
  cursor: default;
}

.month-cell--today {
  background: linear-gradient(180deg, rgba(240, 253, 250, 0.88), rgba(255, 255, 255, 0.92));
}

.month-cell--last {
  border-right: 0;
}

.month-cell__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.55rem;
}

.month-cell__day {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.75rem;
  height: 1.75rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 900;
  color: rgb(51, 65, 85);
}

.month-cell__day--today {
  background: rgb(20, 184, 166);
  border-radius: 9999px;
  color: white;
}

.month-cell__day--sunday {
  color: rgb(244, 63, 94);
}

.month-cell__day--saturday {
  color: rgb(99, 102, 241);
}

.month-cell__count {
  font-size: 0.65rem;
  font-weight: 900;
  color: rgb(100, 116, 139);
}

.month-cell__events {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}

.month-event-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  height: 1.75rem;
  padding: 0 0.55rem;
  border: 0;
  border-left: 2px solid currentColor;
  border-radius: 4px;
  font-size: 0.68rem;
  text-align: left;
  overflow: hidden;
}

.month-event-chip__time {
  flex-shrink: 0;
  font-weight: 900;
}

.month-event-chip__title {
  color: rgb(31, 41, 55);
  font-weight: 700;
}

.month-cell__more {
  padding-left: 0.15rem;
  font-size: 0.66rem;
  font-weight: 800;
  color: rgb(100, 116, 139);
  text-align: left;
}
</style>
