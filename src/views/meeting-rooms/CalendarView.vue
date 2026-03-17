<script setup>
import { computed, ref, watch } from 'vue'
import MeetingRoomCalendar from '@/components/meeting-rooms/CalendarView.vue'
import MeetingRoomTimeline from '@/components/meeting-rooms/MeetingRoomTimeline.vue'
import MeetingRoomWeekView from '@/components/meeting-rooms/MeetingRoomWeekView.vue'

const props = defineProps({
  rooms: { type: Array, required: true },
  bookings: { type: Array, required: true },
  handlers: { type: Object, required: true },
  dateValue: { type: String, default: '' }
})

const hours = Array.from({ length: 13 }, (_, i) => i + 8)
const currentView = ref('DAY')
const selectedDate = ref('')
const selectedRoomIds = ref([])

let initializedRoomSelection = false

const toDateInputValue = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateOnly = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date()
  }

  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

watch(
  () => props.dateValue,
  (value) => {
    selectedDate.value = value || toDateInputValue()
  },
  { immediate: true }
)

watch(
  () => props.rooms,
  (rooms) => {
    const roomIds = rooms.map((room) => room.id)

    if (!initializedRoomSelection) {
      selectedRoomIds.value = roomIds
      initializedRoomSelection = true
      return
    }

    const previousSelection = new Set(selectedRoomIds.value)
    selectedRoomIds.value = roomIds.filter((roomId) => previousSelection.has(roomId))
  },
  { immediate: true, deep: true }
)

const selectedRooms = computed(() =>
  props.rooms.filter((room) => selectedRoomIds.value.includes(room.id))
)

const filteredBookings = computed(() =>
  props.bookings.filter((booking) => selectedRoomIds.value.includes(booking.roomId))
)

const allRoomsChecked = computed(() => {
  return props.rooms.length > 0 && props.rooms.every((room) => selectedRoomIds.value.includes(room.id))
})

const selectedDateLabel = computed(() => {
  const current = parseDateOnly(selectedDate.value)
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][current.getDay()]
  return `${current.getFullYear()}년 ${current.getMonth() + 1}월 ${current.getDate()}일 (${weekday})`
})

const selectedMonthLabel = computed(() => {
  const current = parseDateOnly(selectedDate.value)
  return `${current.getFullYear()}년 ${current.getMonth() + 1}월`
})

const selectedWeekLabel = computed(() => {
  const current = parseDateOnly(selectedDate.value)
  const start = new Date(current)
  start.setDate(current.getDate() - current.getDay())
  const end = new Date(start)
  end.setDate(start.getDate() + 6)

  const format = (date) => `${date.getMonth() + 1}월 ${date.getDate()}일`
  return `${format(start)} - ${format(end)}`
})

const boardTitle = computed(() =>
  currentView.value === 'MONTH'
    ? selectedMonthLabel.value
    : currentView.value === 'WEEK'
      ? selectedWeekLabel.value
      : selectedDateLabel.value
)

const selectedRoomCountLabel = computed(() => `${selectedRooms.value.length} / ${props.rooms.length}개 선택`)

const syncDateValue = (value) => {
  selectedDate.value = value
  props.handlers.setDateValue?.(value)
}

const shiftDate = (amount) => {
  const next = parseDateOnly(selectedDate.value)

  if (currentView.value === 'MONTH') {
    next.setMonth(next.getMonth() + amount)
  } else if (currentView.value === 'WEEK') {
    next.setDate(next.getDate() + (amount * 7))
  } else {
    next.setDate(next.getDate() + amount)
  }

  syncDateValue(toDateInputValue(next))
}

const goToday = () => {
  syncDateValue(toDateInputValue())
}

const toggleAllRooms = (checked = !allRoomsChecked.value) => {
  selectedRoomIds.value = checked ? props.rooms.map((room) => room.id) : []
}

const toggleRoom = (roomId) => {
  if (selectedRoomIds.value.includes(roomId)) {
    selectedRoomIds.value = selectedRoomIds.value.filter((candidate) => candidate !== roomId)
    return
  }

  selectedRoomIds.value = [...selectedRoomIds.value, roomId]
}

const handleMonthDateClick = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return
  }

  syncDateValue(toDateInputValue(date))
  props.handlers.handleDateClick?.(date)
}
</script>

<template>
  <div class="meeting-schedule-layout">
    <section class="meeting-schedule-panel">
      <div class="meeting-schedule-panel__head">
        <h2 class="meeting-schedule-panel__title">회의실 선택</h2>

        <span class="meeting-schedule-panel__count">
          {{ selectedRoomCountLabel }}
        </span>
      </div>

      <div class="meeting-schedule-panel__controls">
        <button
          type="button"
          class="meeting-schedule-toggle"
          :class="{ 'meeting-schedule-toggle--active': allRoomsChecked }"
          @click="toggleAllRooms()"
        >
          전체 회의실
        </button>

        <div class="meeting-schedule-checklist">
          <button
            v-for="room in rooms"
            :key="room.id"
            type="button"
            class="meeting-schedule-room"
            :class="{ 'meeting-schedule-room--active': selectedRoomIds.includes(room.id) }"
            @click="toggleRoom(room.id)"
          >
            <span class="meeting-schedule-room__dot" :style="{ backgroundColor: room.color }"></span>
            <span class="meeting-schedule-room__meta">
              <span class="meeting-schedule-room__name">{{ room.name }}</span>
              <span class="meeting-schedule-room__info">{{ room.capacity }}인 · {{ room.floor }}층</span>
            </span>
          </button>
        </div>
      </div>
    </section>

    <section class="meeting-schedule-board">
      <div class="meeting-schedule-board__head">
        <h3 class="meeting-schedule-board__title">{{ boardTitle }}</h3>

        <div class="meeting-schedule-board__actions">
        <div class="view-switch">
          <button
            type="button"
            class="view-switch__button"
            :class="{ 'view-switch__button--active': currentView === 'DAY' }"
            @click="currentView = 'DAY'"
          >
            일
          </button>
            <button
              type="button"
              class="view-switch__button"
              :class="{ 'view-switch__button--active': currentView === 'WEEK' }"
              @click="currentView = 'WEEK'"
            >
              주
            </button>
            <button
              type="button"
              class="view-switch__button"
              :class="{ 'view-switch__button--active': currentView === 'MONTH' }"
              @click="currentView = 'MONTH'"
            >
              월
            </button>
        </div>

          <div class="meeting-schedule-nav">
            <button type="button" class="icon-button" @click="shiftDate(-1)">
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button type="button" class="toolbar-button toolbar-button-subtle" @click="goToday">
              오늘로 이동
            </button>
            <button type="button" class="icon-button" @click="shiftDate(1)">
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <input
            :value="selectedDate"
            type="date"
            class="meeting-schedule-date-input"
            @input="syncDateValue($event.target.value)"
          >
        </div>
      </div>

      <div
        v-if="selectedRooms.length === 0"
        class="meeting-schedule-board__empty"
      >
        <p class="text-sm font-bold text-slate-500">표시할 회의실을 하나 이상 선택해주세요.</p>
      </div>

      <MeetingRoomCalendar
        v-else-if="currentView === 'MONTH'"
        :rooms="selectedRooms"
        :bookings="filteredBookings"
        :selectedDate="selectedDate"
        @dateClick="handleMonthDateClick"
        @bookingClick="handlers.handleBookingClick"
        @dateChange="syncDateValue"
      />

      <MeetingRoomWeekView
        v-else-if="currentView === 'WEEK'"
        :rooms="selectedRooms"
        :bookings="filteredBookings"
        :hours="hours"
        :selectedDate="selectedDate"
        @dateClick="handleMonthDateClick"
        @bookingClick="handlers.handleBookingClick"
        @timeRangeSelect="handlers.handleTimeRangeSelect"
      />

      <MeetingRoomTimeline
        v-else
        :rooms="selectedRooms"
        :bookings="filteredBookings"
        :hours="hours"
        :selectedDate="selectedDate"
        @timeSlotClick="handlers.handleTimeSlotClick"
        @timeRangeSelect="handlers.handleTimeRangeSelect"
        @bookingClick="handlers.handleBookingClick"
      />
    </section>
  </div>
</template>

<style scoped>
.meeting-schedule-layout {
  display: grid;
  grid-template-columns: minmax(220px, 260px) minmax(0, 1fr);
  gap: 1rem;
  align-items: start;
}

.meeting-schedule-panel {
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 20px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.95));
  padding: 1rem;
  position: sticky;
  top: 1rem;
}

.meeting-schedule-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.meeting-schedule-panel__title {
  font-size: 1rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: rgb(15, 23, 42);
}

.meeting-schedule-panel__count {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(153, 246, 228, 0.9);
  background: rgba(240, 253, 250, 0.95);
  padding: 0.35rem 0.7rem;
  font-size: 0.72rem;
  font-weight: 900;
  color: rgb(15, 118, 110);
}

.meeting-schedule-panel__controls {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.meeting-schedule-toggle {
  border-radius: 12px;
  border: 1px solid rgba(203, 213, 225, 0.96);
  background: white;
  padding: 0.72rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 800;
  color: rgb(51, 65, 85);
  transition: all 0.18s ease;
}

.meeting-schedule-toggle--active {
  border-color: rgba(45, 212, 191, 0.9);
  background: rgba(240, 253, 250, 0.95);
  color: rgb(15, 118, 110);
}

.meeting-schedule-checklist {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  max-height: 540px;
  overflow-y: auto;
  padding-right: 0.15rem;
}

.meeting-schedule-room {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 14px;
  border: 1px solid rgba(226, 232, 240, 0.96);
  background: rgba(255, 255, 255, 0.95);
  padding: 0.8rem 0.9rem;
  text-align: left;
  transition: all 0.18s ease;
}

.meeting-schedule-room:hover {
  border-color: rgba(148, 163, 184, 0.9);
  transform: translateY(-1px);
}

.meeting-schedule-room--active {
  border-color: rgba(45, 212, 191, 0.9);
  background: rgba(240, 253, 250, 0.95);
  box-shadow: inset 0 0 0 1px rgba(45, 212, 191, 0.15);
}

.meeting-schedule-room__dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 999px;
  flex-shrink: 0;
}

.meeting-schedule-room__meta {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.meeting-schedule-room__name {
  font-size: 0.88rem;
  font-weight: 900;
  color: rgb(15, 23, 42);
}

.meeting-schedule-room__info {
  font-size: 0.75rem;
  font-weight: 700;
  color: rgb(100, 116, 139);
}

.meeting-schedule-board {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.meeting-schedule-board__head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

.meeting-schedule-board__title {
  font-size: 1.25rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  color: rgb(15, 23, 42);
}

.meeting-schedule-board__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
}

.view-switch {
  display: inline-flex;
  gap: 0.15rem;
  padding: 0.15rem;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.95);
}

.view-switch__button {
  border-radius: 8px;
  padding: 0.48rem 0.92rem;
  font-size: 0.75rem;
  font-weight: 900;
  color: rgb(100, 116, 139);
  transition: all 0.18s ease;
}

.view-switch__button--active {
  background: rgb(20, 184, 166);
  color: white;
}

.meeting-schedule-nav {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.toolbar-button,
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 10px;
  font-size: 0.8rem;
  font-weight: 900;
  transition: all 0.18s ease;
}

.toolbar-button {
  padding: 0.72rem 1rem;
}

.icon-button {
  height: 2.2rem;
  width: 2.2rem;
  border: 1px solid rgba(203, 213, 225, 0.96);
  background: rgba(255, 255, 255, 0.98);
  color: rgb(51, 65, 85);
}

.icon-button:hover {
  border-color: rgba(13, 148, 136, 0.32);
  color: rgb(15, 118, 110);
  background: rgba(240, 253, 250, 0.92);
}

.toolbar-button-subtle {
  border: 1px solid rgba(45, 212, 191, 0.38);
  background: rgba(255, 255, 255, 0.98);
  color: rgb(15, 118, 110);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}

.toolbar-button-subtle:hover {
  border-color: rgba(13, 148, 136, 0.5);
  background: rgba(240, 253, 250, 0.98);
  color: rgb(17, 94, 89);
}

.meeting-schedule-date-input {
  border-radius: 10px;
  border: 1px solid rgba(203, 213, 225, 0.92);
  background: white;
  padding: 0.62rem 0.8rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: rgb(51, 65, 85);
}

.meeting-schedule-board__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  border: 1px dashed rgba(203, 213, 225, 0.96);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.7);
}

@media (max-width: 1024px) {
  .meeting-schedule-layout {
    grid-template-columns: 1fr;
  }

  .meeting-schedule-panel {
    position: static;
  }

  .meeting-schedule-board__head {
    flex-direction: column;
  }

  .meeting-schedule-board__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
