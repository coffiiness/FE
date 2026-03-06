<script setup>
import MeetingRoomTimeline from '@/components/meeting-rooms/MeetingRoomTimeline.vue'

const props = defineProps({
  rooms: { type: Array, required: true },
  bookings: { type: Array, required: true },
  hours: { type: Array, required: true },
  dateValue: { type: String, required: true },
  handlers: { type: Object, required: true }
})

const moveToToday = () => {
  const today = new Date()
  const dateString = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, '0')}-${`${today.getDate()}`.padStart(2, '0')}`
  props.handlers.setDateValue(dateString)
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
          <input
            type="date"
            class="bg-transparent text-slate-700 text-sm outline-none"
            :value="dateValue"
            @change="handlers.setDateValue($event.target.value)"
          />
          <button
            class="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-1 rounded-md border border-teal-200"
            @click="moveToToday"
          >
            오늘
          </button>
        </div>
        <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
          <span class="text-xs text-slate-500">시간 범위</span>
          <span class="text-sm text-slate-700">08:00 ~ 20:00</span>
        </div>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
          <input class="bg-transparent text-sm text-slate-700 outline-none w-48" placeholder="회의실명/위치 검색" />
        </div>
        <button class="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm">
          필터
        </button>
        <button class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-sm shadow-sm">
          조회
        </button>
      </div>
    </div>

    <MeetingRoomTimeline
      :rooms="rooms"
      :bookings="bookings"
      :hours="hours"
      :selectedDate="dateValue"
      @timeSlotClick="handlers.handleTimeSlotClick"
      @bookingClick="handlers.handleBookingClick"
    />
  </div>
</template>
