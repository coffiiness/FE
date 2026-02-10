<script setup>
import ManageView from '@/components/meeting-rooms/ManageView.vue'

const props = defineProps({
  rooms: { type: Array, required: true },
  handlers: { type: Object, required: true }
})
</script>

<template>
  <ManageView
    :rooms="rooms"
    @createRoom="handlers.openCreateRoom"
    @editRoom="handlers.handleEditRoom"
    @deleteRoom="handlers.handleDeleteRoom"
  />
</template>
