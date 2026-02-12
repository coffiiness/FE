<script setup>
import { ref } from 'vue'
import CalendarView from '@/components/meeting-rooms/CalendarView.vue'
import MeetingRoomTimeline from '@/components/meeting-rooms/MeetingRoomTimeline.vue'

const props = defineProps({
  rooms: { type: Array, required: true },
  bookings: { type: Array, required: true },
  handlers: { type: Object, required: true }
})

const viewMode = ref('calendar')
const hours = Array.from({ length: 13 }, (_, i) => i + 8)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-2">
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
        :class="viewMode === 'calendar'
          ? 'bg-brand-600 text-white border-brand-600'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
        @click="viewMode = 'calendar'"
      >
        전체 캘린더
      </button>
      <button
        class="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
        :class="viewMode === 'timeline'
          ? 'bg-brand-600 text-white border-brand-600'
          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'"
        @click="viewMode = 'timeline'"
      >
        타임라인
      </button>
    </div>

    <CalendarView
      v-if="viewMode === 'calendar'"
      :rooms="rooms"
      :bookings="bookings"
      @dateClick="handlers.handleDateClick"
      @bookingClick="handlers.handleBookingClick"
    />

    <MeetingRoomTimeline
      v-else
      :rooms="rooms"
      :bookings="bookings"
      :hours="hours"
      @timeSlotClick="handlers.handleTimeSlotClick"
      @bookingClick="handlers.handleBookingClick"
    />
  </div>
</template>
