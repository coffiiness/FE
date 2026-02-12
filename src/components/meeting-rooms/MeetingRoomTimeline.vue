<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  rooms: { type: Array, required: true },
  bookings: { type: Array, required: true },
  hours: { type: Array, required: true }
})

const emit = defineEmits(['timeSlotClick', 'bookingClick'])

const getBookingsForRoomAndHour = (roomId, hour) => {
  return props.bookings.filter((booking) => {
    if (booking.roomId !== roomId) return false
    const startHour = booking.startTime.getHours()
    const endHour = booking.endTime.getHours()
    const endMinute = booking.endTime.getMinutes()
    return hour >= startHour && (hour < endHour || (hour === endHour && endMinute === 0))
  })
}

const calculateBookingWidth = (booking) => {
  const duration = (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60)
  return duration * 100
}

const calculateBookingOffset = (booking) => {
  const startMinute = booking.startTime.getMinutes()
  return (startMinute / 60) * 100
}

const formatTime = (date) => {
  const h = `${date.getHours()}`.padStart(2, '0')
  const m = `${date.getMinutes()}`.padStart(2, '0')
  return `${h}:${m}`
}

const itemsPerPage = 5
const currentPage = ref(1)
const totalPages = computed(() => Math.ceil(props.rooms.length / itemsPerPage))
const pagedRooms = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return props.rooms.slice(start, start + itemsPerPage)
})

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

    <div class="flex flex-col">
        <div class="flex border-b bg-white sticky top-0 z-10">
          <div class="w-48 p-4 font-semibold border-r flex items-center gap-2 text-slate-800">
            <span class="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>회의실</span>
          </div>
          <div class="flex-1 flex">
            <div
              v-for="hour in hours"
              :key="hour"
              class="flex-1 p-2 text-center text-sm font-semibold border-r last:border-r-0 text-slate-700"
            >
              {{ hour }}:00
            </div>
          </div>
        </div>

      <div class="flex-1 overflow-auto">
        <div v-for="room in pagedRooms" :key="room.id" class="flex border-b hover:bg-slate-50/60 transition-colors">
          <div class="w-48 p-4 border-r bg-white sticky left-0 z-[5]">
            <div class="flex items-start gap-3">
              <div class="w-3 h-3 rounded-full mt-1 flex-shrink-0" :style="{ backgroundColor: room.color }" />
              <div class="min-w-0 flex-1">
                <div class="font-semibold text-base truncate text-slate-900">{{ room.name }}</div>
                <div class="text-sm text-slate-700 mt-0.5">{{ room.capacity }}인 · {{ room.floor }}층</div>
              </div>
            </div>
          </div>

          <div class="flex-1 flex relative">
            <div
              v-for="hour in hours"
              :key="hour"
              class="flex-1 border-r last:border-r-0 relative min-h-[80px]"
              :class="getBookingsForRoomAndHour(room.id, hour).length === 0 ? 'cursor-pointer hover:bg-emerald-50/50' : ''"
              @click="getBookingsForRoomAndHour(room.id, hour).length === 0 && emit('timeSlotClick', room.id, hour)"
            >
              <template v-for="booking in getBookingsForRoomAndHour(room.id, hour)" :key="booking.id">
                <div
                  v-if="booking.startTime.getHours() === hour"
                  class="absolute top-2 bottom-2 rounded-lg px-3 py-2 cursor-pointer group overflow-hidden shadow-sm hover:shadow-md transition-all"
                  :style="{
                    backgroundColor: `${room.color}15`,
                    borderLeft: `3px solid ${room.color}`,
                    left: `${calculateBookingOffset(booking)}%`,
                    width: `${calculateBookingWidth(booking)}%`
                  }"
                  @click.stop="emit('bookingClick', booking)"
                >
                  <div class="text-sm font-semibold truncate group-hover:text-emerald-700 text-slate-900">
                    {{ booking.title }}
                  </div>
                  <div class="text-xs text-slate-700 mt-0.5 truncate">
                    {{ formatTime(booking.startTime) }} - {{ formatTime(booking.endTime) }}
                  </div>
                  <div class="text-xs text-slate-600 mt-0.5 truncate">
                    {{ booking.organizer }}
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="totalPages > 1" class="flex items-center justify-between px-6 py-4 border-t bg-white">
      <p class="text-sm text-slate-600">페이지 {{ currentPage }} / {{ totalPages }}</p>
      <div class="flex items-center gap-2">
        <button
          class="px-3 py-2 border rounded-lg text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          이전
        </button>
        <button
          class="px-3 py-2 border rounded-lg text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          다음
        </button>
      </div>
    </div>
  </div>
</template>
