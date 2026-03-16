<script setup>
import { ref } from 'vue'
import CalendarView from '@/components/meeting-rooms/CalendarView.vue'
import MeetingRoomTimeline from '@/components/meeting-rooms/MeetingRoomTimeline.vue'

const props = defineProps({
  rooms: { type: Array, required: true },
  bookings: { type: Array, required: true },
  handlers: { type: Object, required: true },
  dateValue: { type: String, default: '' }
})

const viewMode = ref('calendar')
const hours = Array.from({ length: 13 }, (_, i) => i + 8)
</script>

<template>
  <div class="meeting-schedule-shell">
    <div class="meeting-schedule-shell__head">
      <div class="view-switch">
        <button
          type="button"
          class="view-switch__button"
          :class="{ 'view-switch__button--active': viewMode === 'calendar' }"
          @click="viewMode = 'calendar'"
        >
          전체 캘린더
        </button>
        <button
          type="button"
          class="view-switch__button"
          :class="{ 'view-switch__button--active': viewMode === 'timeline' }"
          @click="viewMode = 'timeline'"
        >
          타임라인
        </button>
      </div>
    </div>

    <CalendarView
      v-if="viewMode === 'calendar'"
      :rooms="rooms"
      :bookings="bookings"
      @dateClick="handlers.handleDateClick"
      @bookingClick="handlers.handleBookingClick"
      @roomChange="handlers.handleCalendarRoomChange"
    />

    <MeetingRoomTimeline
      v-else
      :rooms="rooms"
      :bookings="bookings"
      :hours="hours"
      :selectedDate="dateValue"
      @timeSlotClick="handlers.handleTimeSlotClick"
      @bookingClick="handlers.handleBookingClick"
    />
  </div>
</template>

<style scoped>
.meeting-schedule-shell {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.meeting-schedule-shell__head {
  display: flex;
  justify-content: flex-end;
}

.view-switch {
  display: inline-flex;
  gap: 0.15rem;
  padding: 0.15rem;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.95);
}

.view-switch__button {
  border-radius: 6px;
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
</style>
