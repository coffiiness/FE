<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  rooms: { type: Array, required: true },
  bookings: { type: Array, required: true },
  hours: { type: Array, required: true },
  selectedDate: { type: String, default: '' }
})

const emit = defineEmits(['timeSlotClick', 'bookingClick'])

const isSameDate = (a, b) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const selectedDateObject = computed(() =>
  props.selectedDate ? new Date(`${props.selectedDate}T00:00:00`) : null
)

const isPastSlot = (hour) => {
  if (!selectedDateObject.value) return false
  const target = new Date(selectedDateObject.value)
  target.setHours(hour, 0, 0, 0)
  return target < new Date()
}

const rangesOverlap = (targetStart, targetEnd, slotStart, slotEnd) =>
  targetStart < slotEnd && slotStart < targetEnd

const getBookingsForRoomAndHour = (roomId, hour) => {
  return props.bookings.filter((booking) => {
    if (booking.roomId !== roomId) return false
    if (selectedDateObject.value && !isSameDate(booking.startTime, selectedDateObject.value)) {
      return false
    }
    const slotStart = new Date(booking.startTime)
    slotStart.setHours(hour, 0, 0, 0)
    const slotEnd = new Date(slotStart)
    slotEnd.setHours(slotEnd.getHours() + 1)
    return rangesOverlap(slotStart, slotEnd, booking.startTime, booking.endTime)
  })
}

const getBookingsForRoom = (roomId) => {
  return props.bookings.filter((booking) => {
    if (booking.roomId !== roomId) return false
    if (selectedDateObject.value && !isSameDate(booking.startTime, selectedDateObject.value)) {
      return false
    }
    return true
  })
}

const getSlotFillStyle = (roomId, hour) => {
  const bookings = getBookingsForRoomAndHour(roomId, hour)
  if (!bookings.length) return null

  const room = props.rooms.find((item) => item.id === roomId)
  const color = room?.color || '#10b981'
  return {
    backgroundColor: `${color}12`
  }
}

const calculateBookingWidth = (booking) => {
  const duration = (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60 * 60)
  return (duration / props.hours.length) * 100
}

const calculateBookingOffset = (booking) => {
  const firstHour = Number(props.hours[0] || 0)
  const startHourOffset = booking.startTime.getHours() - firstHour
  const startMinute = booking.startTime.getMinutes()
  return ((startHourOffset + startMinute / 60) / props.hours.length) * 100
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

const getBoundaryStyle = (index) => ({
  left: `${(index / props.hours.length) * 100}%`
})

const lastHourLabel = computed(() => {
  if (!props.hours.length) return ''
  const lastHour = Number(props.hours[props.hours.length - 1])
  if (!Number.isFinite(lastHour)) return ''
  return `${lastHour + 1}:00`
})
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

    <div class="flex flex-col">
        <div class="flex border-b bg-white sticky top-0 z-10 min-w-[1200px]">
          <div class="w-48 p-4 font-semibold border-r flex items-center gap-2 text-slate-800">
            <span class="w-2 h-2 rounded-full bg-slate-400"></span>
            <span>회의실</span>
          </div>
          <div class="relative flex-1 min-h-[52px] bg-white">
            <div class="absolute inset-0 flex pointer-events-none z-0">
              <div
                v-for="hour in hours"
                :key="`grid-${hour}`"
                class="flex-1 border-r last:border-r-0 border-slate-200"
              />
            </div>
            <div
              v-for="(hour, index) in hours"
              :key="hour"
              class="absolute top-0 bottom-0 w-0 border-l border-slate-200 z-[1] pointer-events-none"
              :style="getBoundaryStyle(index)"
            >
              <span class="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 bg-white px-1 text-sm font-semibold text-slate-700 whitespace-nowrap z-[2]">
                {{ hour }}:00
              </span>
            </div>
            <div v-if="lastHourLabel" class="absolute top-0 bottom-0 right-0 w-0 border-l border-slate-200 z-[1] pointer-events-none">
              <span class="absolute top-1/2 right-0 -translate-y-1/2 bg-white px-1 text-sm font-semibold text-slate-700 whitespace-nowrap z-[2]">
                {{ lastHourLabel }}
              </span>
            </div>
          </div>
        </div>

      <div class="flex-1 overflow-auto">
        <div v-for="room in pagedRooms" :key="room.id" class="flex border-b hover:bg-slate-50/60 transition-colors min-w-[1200px]">
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
            <div class="flex-1 flex relative">
              <div
                v-for="hour in hours"
                :key="hour"
                class="flex-1 border-r last:border-r-0 relative min-h-[80px] z-0"
                :class="getBookingsForRoomAndHour(room.id, hour).length === 0
                  ? (isPastSlot(hour) ? 'cursor-not-allowed bg-slate-100/70' : 'cursor-pointer hover:bg-emerald-50/50')
                  : 'bg-slate-50/40'"
                :style="getSlotFillStyle(room.id, hour)"
                @click="getBookingsForRoomAndHour(room.id, hour).length === 0 && !isPastSlot(hour) && emit('timeSlotClick', room.id, hour)"
              />
              <div class="absolute inset-0 z-10 pointer-events-none">
                <div
                  v-for="booking in getBookingsForRoom(room.id)"
                  :key="booking.id"
                  class="absolute top-2 bottom-2 rounded-lg px-3 py-2 cursor-pointer group overflow-hidden shadow-sm hover:shadow-md transition-all pointer-events-auto"
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
              </div>
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
