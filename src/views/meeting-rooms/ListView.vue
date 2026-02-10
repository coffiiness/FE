<script setup>
import MeetingRoomList from '@/components/meeting-rooms/MeetingRoomList.vue'

const props = defineProps({
  rooms: { type: Array, required: true },
  bookings: { type: Array, required: true },
  handlers: { type: Object, required: true }
})
</script>

<template>
  <MeetingRoomList
    :rooms="rooms"
    :bookings="bookings"
    @roomClick="handlers.handleRoomClick"
    @bookRoomClick="handlers.handleBookRoomClick"
  />
</template>
