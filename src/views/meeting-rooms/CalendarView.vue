<script setup>
import CalendarView from '@/components/meeting-rooms/CalendarView.vue'

const props = defineProps({
  rooms: { type: Array, required: true },
  bookings: { type: Array, required: true },
  handlers: { type: Object, required: true }
})
</script>

<template>
  <CalendarView
    :rooms="rooms"
    :bookings="bookings"
    @dateClick="handlers.handleDateClick"
    @bookingClick="handlers.handleBookingClick"
  />
</template>
