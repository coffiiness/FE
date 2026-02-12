<script setup>
import { computed, ref } from 'vue'
import MeetingRoomList from '@/components/meeting-rooms/MeetingRoomList.vue'

const props = defineProps({
  rooms: { type: Array, required: true },
  bookings: { type: Array, required: true },
  handlers: { type: Object, required: true }
})

const selectedFloor = ref('all')

const floorOptions = computed(() => {
  const floors = Array.from(new Set(props.rooms.map((r) => r.floor))).sort((a, b) => a - b)
  return floors
})

const filteredRooms = computed(() => {
  if (selectedFloor.value === 'all') return props.rooms
  return props.rooms.filter((r) => r.floor === Number(selectedFloor.value))
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center gap-3">
      <div class="relative">
        <select
          v-model="selectedFloor"
          class="appearance-none pl-4 pr-10 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white shadow-sm hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
        >
          <option value="all">전체 층수</option>
          <option v-for="floor in floorOptions" :key="floor" :value="floor">{{ floor }}층</option>
        </select>
        <svg class="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    <MeetingRoomList
      :rooms="filteredRooms"
      :bookings="bookings"
      @roomClick="handlers.handleRoomClick"
      @bookRoomClick="handlers.handleBookRoomClick"
    />
  </div>
</template>
