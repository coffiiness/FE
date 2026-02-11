<script setup>
import MeetingRoomList from '@/components/meeting-rooms/MeetingRoomList.vue'

const props = defineProps({
  rooms: { type: Array, required: true },
  bookings: { type: Array, required: true },
  handlers: { type: Object, required: true }
})
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <h2 class="text-xl font-semibold text-slate-900">회의실 목록</h2>
      <p class="text-sm text-slate-700 mt-1">회의실별 상태와 오늘의 예약 요약을 확인하세요.</p>
    </div>

    <MeetingRoomList
      :rooms="rooms"
      :bookings="bookings"
      @roomClick="handlers.handleRoomClick"
      @bookRoomClick="handlers.handleBookRoomClick"
    />
  </div>
</template>
