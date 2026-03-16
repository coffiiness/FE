<script setup>
import { computed, ref } from 'vue'
import MeetingRoomList from '@/components/meeting-rooms/MeetingRoomList.vue'

const props = defineProps({
  rooms: { type: Array, required: true },
  bookings: { type: Array, required: true },
  handlers: { type: Object, required: true }
})

const selectedFloor = ref('all')
const floorValue = (value) => {
  const parsed = Number(String(value).replace(/[^0-9-]/g, ''))
  return Number.isFinite(parsed) ? parsed : null
}

const floorOptions = computed(() => {
  const floors = Array.from(
    new Set(props.rooms.map((r) => floorValue(r.floor)).filter((v) => v !== null))
  ).sort((a, b) => a - b)
  return floors
})

const filteredRooms = computed(() => {
  if (selectedFloor.value === 'all') return props.rooms
  return props.rooms.filter((r) => floorValue(r.floor) === Number(selectedFloor.value))
})

const visibleCountLabel = computed(() => `현재 ${filteredRooms.value.length}개`)
const totalCountLabel = computed(() => `전체 ${props.rooms.length}개`)
</script>

<template>
  <div class="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
    <div class="border-b border-slate-200 px-5 py-5 md:px-7 md:py-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <div class="relative">
            <select
              v-model="selectedFloor"
              class="min-w-[150px] appearance-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 text-sm font-semibold text-slate-900 transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500"
            >
              <option value="all">전체 층수</option>
              <option v-for="floor in floorOptions" :key="floor" :value="floor">{{ floor }}층</option>
            </select>
            <svg class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          <span class="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-700">
            {{ totalCountLabel }}
          </span>
          <span class="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-600">
            {{ visibleCountLabel }}
          </span>
        </div>
      </div>
    </div>

    <div class="px-5 py-5 md:px-7 md:py-6">
      <MeetingRoomList
        :rooms="filteredRooms"
        :bookings="bookings"
        @roomClick="handlers.handleRoomClick"
        @bookRoomClick="handlers.handleBookRoomClick"
      />
    </div>
  </div>
</template>
