<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  rooms: { type: Array, required: true },
  bookings: { type: Array, required: true },
  hours: { type: Array, required: true },
  selectedDate: { type: String, default: '' }
})

const emit = defineEmits(['dateClick', 'bookingClick', 'timeRangeSelect'])

const koDays = ['일', '월', '화', '수', '목', '금', '토']
const SLOT_HEIGHT = 56

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

const formatHourLabel = (hour) => `${String(hour).padStart(2, '0')}:00`

const weekDays = computed(() => {
  const current = parseDateOnly(props.selectedDate)
  const start = new Date(current)
  start.setDate(current.getDate() - current.getDay())

  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(start)
    next.setDate(start.getDate() + index)
    return {
      date: next,
      fullDate: formatDate(next),
      dayName: koDays[index],
      dateNum: next.getDate()
    }
  })
})

const today = computed(() => formatDate(new Date()))
const dragSelection = ref(null)

const roomById = computed(() => {
  const entries = props.rooms.map((room) => [room.id, room])
  return new Map(entries)
})

const getMinutes = (date) => (date.getHours() * 60) + date.getMinutes()

const overlaps = (left, right) => left.startMinutes < right.endMinutes && right.startMinutes < left.endMinutes

const dayLayouts = computed(() => {
  const baseHour = Number(props.hours[0] || 8)
  const startBoundary = baseHour * 60
  const endBoundary = (Number(props.hours[props.hours.length - 1] || baseHour) + 1) * 60
  const result = new Map()

  weekDays.value.forEach((day) => {
    const layouts = props.bookings
      .filter((booking) => formatDate(booking.startTime) === day.fullDate)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .map((booking) => ({
        booking,
        startMinutes: Math.max(getMinutes(booking.startTime), startBoundary),
        endMinutes: Math.min(getMinutes(booking.endTime), endBoundary),
        column: 0,
        totalColumns: 1
      }))
      .filter((item) => item.endMinutes > item.startMinutes)

    layouts.forEach((layout, index) => {
      const overlapping = layouts.slice(0, index).filter((candidate) => overlaps(candidate, layout))
      let column = 0
      while (overlapping.some((candidate) => candidate.column === column)) {
        column += 1
      }
      layout.column = column
    })

    layouts.forEach((layout) => {
      const related = layouts.filter((candidate) => overlaps(candidate, layout))
      layout.totalColumns = Math.max(...related.map((candidate) => candidate.column), layout.column) + 1
    })

    result.set(day.fullDate, layouts)
  })

  return result
})

const getDayLayouts = (fullDate) => dayLayouts.value.get(fullDate) || []

const isPastSlot = (fullDate, hour) => {
  const target = parseDateOnly(fullDate)
  target.setHours(hour, 0, 0, 0)
  return target < new Date()
}

const clearDragSelection = () => {
  dragSelection.value = null
}

const canSelectRange = (fullDate, startHour, endHour) => {
  const rangeStart = Math.min(startHour, endHour)
  const rangeEnd = Math.max(startHour, endHour)

  for (let hour = rangeStart; hour <= rangeEnd; hour += 1) {
    if (isPastSlot(fullDate, hour)) {
      return false
    }
  }

  return true
}

const startSlotSelection = (fullDate, hour) => {
  if (isPastSlot(fullDate, hour)) {
    return
  }

  dragSelection.value = {
    fullDate,
    startHour: hour,
    endHour: hour
  }
}

const updateSlotSelection = (fullDate, hour) => {
  if (!dragSelection.value || dragSelection.value.fullDate !== fullDate) {
    return
  }

  if (!canSelectRange(fullDate, dragSelection.value.startHour, hour)) {
    return
  }

  dragSelection.value = {
    ...dragSelection.value,
    endHour: hour
  }
}

const finalizeSlotSelection = () => {
  if (!dragSelection.value) {
    return
  }

  const { fullDate, startHour, endHour } = dragSelection.value
  const rangeStart = Math.min(startHour, endHour)
  const rangeEnd = Math.max(startHour, endHour) + 1

  clearDragSelection()
  emit('timeRangeSelect', {
    date: fullDate,
    startHour: rangeStart,
    endHour: rangeEnd
  })
}

const isDragSelected = (fullDate, hour) => {
  if (!dragSelection.value || dragSelection.value.fullDate !== fullDate) {
    return false
  }

  const rangeStart = Math.min(dragSelection.value.startHour, dragSelection.value.endHour)
  const rangeEnd = Math.max(dragSelection.value.startHour, dragSelection.value.endHour)
  return hour >= rangeStart && hour <= rangeEnd
}

const getSlotClasses = (fullDate, hour) => {
  if (isDragSelected(fullDate, hour)) {
    return 'cursor-pointer bg-emerald-100/90 ring-2 ring-inset ring-emerald-300'
  }

  if (isPastSlot(fullDate, hour)) {
    return 'cursor-not-allowed bg-slate-100/75'
  }

  return 'cursor-pointer hover:bg-emerald-50/70'
}

const getBookingStyle = (layout) => {
  const baseHour = Number(props.hours[0] || 8)
  const totalHours = props.hours.length
  const baseMinutes = baseHour * 60
  const top = ((layout.startMinutes - baseMinutes) / 60) * SLOT_HEIGHT
  const height = Math.max(((layout.endMinutes - layout.startMinutes) / 60) * SLOT_HEIGHT, 24)
  const columnWidth = 100 / layout.totalColumns
  const gap = 4

  return {
    top: `${top}px`,
    height: `${height}px`,
    width: `calc(${columnWidth}% - ${gap}px)`,
    left: `calc(${columnWidth * layout.column}% + ${gap / 2}px)`,
    zIndex: layout.column + 1,
    minHeight: '24px'
  }
}

const getBookingColor = (roomId) => roomById.value.get(roomId)?.color || '#10b981'

const getRoomName = (roomId) => roomById.value.get(roomId)?.name || '회의실'

const getDayColor = (index) => {
  if (index === 0) return 'text-rose-500'
  if (index === 6) return 'text-blue-500'
  return 'text-slate-500'
}

const openDateList = (date) => {
  emit('dateClick', date instanceof Date ? date : parseDateOnly(date))
}

const formatBookingTime = (booking) => {
  const startHour = String(booking.startTime.getHours()).padStart(2, '0')
  const startMinute = String(booking.startTime.getMinutes()).padStart(2, '0')
  return `${startHour}:${startMinute}`
}

const gridHeight = computed(() => `${props.hours.length * SLOT_HEIGHT}px`)

watch(() => props.selectedDate, clearDragSelection)

onMounted(() => {
  document.addEventListener('mouseup', finalizeSlotSelection)
})

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', finalizeSlotSelection)
})
</script>

<template>
  <div class="week-shell">
    <div class="week-header-grid">
      <div class="week-header-grid__time"></div>
      <button
        v-for="(day, index) in weekDays"
        :key="day.fullDate"
        type="button"
        class="week-day-button"
        @click="openDateList(day.date)"
      >
        <span class="week-day-button__label" :class="getDayColor(index)">{{ day.dayName }}</span>
        <span
          class="week-day-button__date"
          :class="{ 'week-day-button__date--today': day.fullDate === today }"
        >
          {{ day.dateNum }}
        </span>
      </button>
    </div>

    <div class="week-time-grid">
      <div class="week-time-grid__times">
        <div v-for="hour in hours" :key="`time-${hour}`" class="week-time-grid__time-label">
          {{ formatHourLabel(hour) }}
        </div>
      </div>

      <div class="week-time-grid__columns" :style="{ minHeight: gridHeight }">
        <div
          v-for="day in weekDays"
          :key="day.fullDate"
          class="week-time-grid__day"
        >
          <div
            v-for="hour in hours"
            :key="`${day.fullDate}-${hour}`"
            class="week-time-grid__slot"
            :class="getSlotClasses(day.fullDate, hour)"
            @mousedown.prevent="startSlotSelection(day.fullDate, hour)"
            @mouseenter="updateSlotSelection(day.fullDate, hour)"
          ></div>

          <button
            v-for="layout in getDayLayouts(day.fullDate)"
            :key="layout.booking.id"
            type="button"
            class="week-event"
            :style="{
              ...getBookingStyle(layout),
              backgroundColor: `${getBookingColor(layout.booking.roomId)}16`,
              borderLeftColor: getBookingColor(layout.booking.roomId)
            }"
            @click.stop="emit('bookingClick', layout.booking)"
          >
            <span class="week-event__time">{{ formatBookingTime(layout.booking) }}</span>
            <span class="week-event__title">{{ layout.booking.title || '회의실 예약' }}</span>
            <span class="week-event__room">{{ getRoomName(layout.booking.roomId) }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.week-shell {
  max-height: calc(100vh - 15rem);
  max-height: calc(100dvh - 15rem);
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
}

.week-header-grid {
  display: grid;
  grid-template-columns: 78px repeat(7, minmax(160px, 1fr));
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.98);
  position: sticky;
  top: 0;
  z-index: 5;
}

.week-header-grid__time {
  border-right: 1px solid rgba(226, 232, 240, 0.9);
}

.week-day-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 72px;
  border-right: 1px solid rgba(226, 232, 240, 0.9);
  background: white;
  transition: background 0.18s ease;
}

.week-day-button:last-child {
  border-right: 0;
}

.week-day-button:hover {
  background: rgba(248, 250, 252, 0.9);
}

.week-day-button__label {
  font-size: 0.72rem;
  font-weight: 900;
}

.week-day-button__date {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  font-size: 0.95rem;
  font-weight: 900;
  color: rgb(15, 23, 42);
}

.week-day-button__date--today {
  background: rgb(20, 184, 166);
  color: white;
}

.week-time-grid {
  display: grid;
  grid-template-columns: 78px minmax(0, 1fr);
}

.week-time-grid__times {
  border-right: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.96);
}

.week-time-grid__time-label {
  height: 56px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0.4rem;
  font-size: 0.72rem;
  font-weight: 800;
  color: rgb(100, 116, 139);
  border-bottom: 1px solid rgba(226, 232, 240, 0.8);
}

.week-time-grid__columns {
  display: grid;
  grid-template-columns: repeat(7, minmax(160px, 1fr));
}

.week-time-grid__day {
  position: relative;
  border-right: 1px solid rgba(226, 232, 240, 0.8);
  background: rgba(255, 255, 255, 0.98);
}

.week-time-grid__day:last-child {
  border-right: 0;
}

.week-time-grid__slot {
  height: 56px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.75);
}

.week-event {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  padding: 0.35rem 0.45rem;
  border-radius: 8px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  border-left-width: 3px;
  text-align: left;
  overflow: hidden;
  box-shadow: 0 4px 10px rgba(15, 23, 42, 0.06);
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.week-event:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
}

.week-event__time {
  font-size: 0.64rem;
  font-weight: 900;
  color: rgb(51, 65, 85);
}

.week-event__title {
  width: 100%;
  font-size: 0.72rem;
  font-weight: 900;
  color: rgb(15, 23, 42);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.week-event__room {
  width: 100%;
  font-size: 0.64rem;
  font-weight: 700;
  color: rgb(71, 85, 105);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
