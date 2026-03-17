<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

const props = defineProps({
  rooms: { type: Array, required: true },
  bookings: { type: Array, required: true },
  hours: { type: Array, required: true },
  selectedDate: { type: String, default: '' }
})

const emit = defineEmits(['timeSlotClick', 'timeRangeSelect', 'bookingClick'])

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

const canSelectSlot = (roomId, hour) =>
  !isPastSlot(hour) && getBookingsForRoomAndHour(roomId, hour).length === 0

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

const dragSelection = ref(null)

const clearDragSelection = () => {
  dragSelection.value = null
}

const canSelectRange = (roomId, startHour, endHour) => {
  const rangeStart = Math.min(startHour, endHour)
  const rangeEnd = Math.max(startHour, endHour)

  for (let hour = rangeStart; hour <= rangeEnd; hour += 1) {
    if (!canSelectSlot(roomId, hour)) {
      return false
    }
  }

  return true
}

const startSlotSelection = (roomId, hour) => {
  if (!canSelectSlot(roomId, hour)) {
    return
  }

  dragSelection.value = {
    roomId,
    startHour: hour,
    endHour: hour
  }
}

const updateSlotSelection = (roomId, hour) => {
  if (!dragSelection.value || dragSelection.value.roomId !== roomId) {
    return
  }

  if (!canSelectRange(roomId, dragSelection.value.startHour, hour)) {
    return
  }

  dragSelection.value = {
    ...dragSelection.value,
    endHour: hour
  }
}

const finalizeSlotSelection = () => {
  if (!dragSelection.value) {
    return
  }

  const { roomId, startHour, endHour } = dragSelection.value
  const rangeStart = Math.min(startHour, endHour)
  const rangeEnd = Math.max(startHour, endHour) + 1

  clearDragSelection()
  emit('timeRangeSelect', roomId, rangeStart, rangeEnd)
}

const isDragSelected = (roomId, hour) => {
  if (!dragSelection.value || dragSelection.value.roomId !== roomId) {
    return false
  }

  const rangeStart = Math.min(dragSelection.value.startHour, dragSelection.value.endHour)
  const rangeEnd = Math.max(dragSelection.value.startHour, dragSelection.value.endHour)
  return hour >= rangeStart && hour <= rangeEnd
}

const getSlotClasses = (roomId, hour) => {
  if (isDragSelected(roomId, hour)) {
    return 'cursor-pointer bg-emerald-100/90 ring-2 ring-inset ring-emerald-300'
  }

  if (getBookingsForRoomAndHour(roomId, hour).length === 0) {
    return isPastSlot(hour)
      ? 'cursor-not-allowed bg-slate-100/70'
      : 'cursor-pointer hover:bg-emerald-50/50'
  }

  return 'bg-slate-50/40'
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

const trailingSpacerStyle = computed(() => ({
  width: props.hours.length ? `${100 / props.hours.length}%` : '0%'
}))

watch(() => props.selectedDate, clearDragSelection)

onMounted(() => {
  document.addEventListener('mouseup', finalizeSlotSelection)
})

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', finalizeSlotSelection)
})
</script>

<template>
  <div class="overflow-hidden rounded-[8px] border border-slate-200 bg-white">

    <div class="meeting-room-timeline flex flex-col">
        <div class="sticky top-0 z-20 flex min-w-[1200px] border-b border-slate-200 bg-white">
          <div class="flex w-48 items-center gap-2 border-r border-slate-200 bg-white p-4 text-sm font-black text-slate-800">
            <span class="h-2 w-2 rounded-full bg-slate-400"></span>
            <span>회의실</span>
          </div>
          <div class="flex min-h-[52px] flex-1 bg-white">
            <div class="relative flex-1">
            <div class="pointer-events-none absolute inset-0 z-0 flex">
              <div
                v-for="hour in hours"
                :key="`grid-${hour}`"
                class="flex-1 border-r last:border-r-0 border-slate-200"
              />
            </div>
            <div
              v-for="(hour, index) in hours"
              :key="hour"
              class="pointer-events-none absolute bottom-0 top-0 z-[1] w-0 border-l border-slate-200"
              :style="getBoundaryStyle(index)"
            >
              <span class="absolute left-0 top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-white px-1 text-[0.72rem] font-black text-slate-700">
                {{ hour }}:00
              </span>
            </div>
            <div v-if="lastHourLabel" class="pointer-events-none absolute bottom-0 right-0 top-0 z-[1] w-0 border-l border-slate-200">
              <span class="absolute left-0 top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap bg-white px-1 text-[0.72rem] font-black text-slate-700">
                {{ lastHourLabel }}
              </span>
            </div>
            </div>
            <div class="border-l border-slate-200 bg-white" :style="trailingSpacerStyle" />
          </div>
        </div>

      <div class="meeting-room-timeline__scroll flex-1 overflow-auto">
        <div v-for="room in pagedRooms" :key="room.id" class="flex min-w-[1200px] border-b border-slate-200 transition-colors hover:bg-slate-50/60">
          <div class="sticky left-0 z-[20] w-48 border-r border-slate-200 bg-white p-4 shadow-[8px_0_12px_-12px_rgba(15,23,42,0.18)]">
            <div class="flex items-start gap-3">
              <div class="mt-1 h-3 w-3 flex-shrink-0 rounded-full" :style="{ backgroundColor: room.color }" />
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm font-black text-slate-900">{{ room.name }}</div>
                <div class="mt-0.5 text-xs font-semibold text-slate-700">{{ room.capacity }}인 · {{ room.floor }}층</div>
              </div>
            </div>
          </div>

          <div class="flex-1 flex relative overflow-hidden">
            <div class="flex-1 flex relative overflow-hidden">
              <div
                v-for="hour in hours"
                :key="hour"
                class="flex-1 border-r last:border-r-0 relative min-h-[80px] z-0"
                :class="getSlotClasses(room.id, hour)"
                :style="getSlotFillStyle(room.id, hour)"
                @mousedown.prevent="startSlotSelection(room.id, hour)"
                @mouseenter="updateSlotSelection(room.id, hour)"
              />
              <div class="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                <div
                  v-for="booking in getBookingsForRoom(room.id)"
                  :key="booking.id"
                  class="pointer-events-auto absolute bottom-2 top-2 cursor-pointer overflow-hidden rounded-[8px] px-3 py-2 transition-all hover:-translate-y-px hover:shadow-sm"
                  :style="{
                    backgroundColor: `${room.color}16`,
                    borderLeft: `3px solid ${room.color}`,
                    left: `${calculateBookingOffset(booking)}%`,
                    width: `${calculateBookingWidth(booking)}%`
                  }"
                  @click.stop="emit('bookingClick', booking)"
                >
                  <div class="truncate text-sm font-black text-slate-900">
                    {{ booking.title }}
                  </div>
                  <div class="mt-0.5 truncate text-[0.72rem] font-semibold text-slate-700">
                    {{ formatTime(booking.startTime) }} - {{ formatTime(booking.endTime) }}
                  </div>
                  <div class="mt-0.5 truncate text-[0.72rem] font-semibold text-slate-600">
                    {{ booking.organizer }}
                  </div>
                </div>
              </div>
            </div>
            <div class="border-l border-slate-200 bg-white/80 min-h-[80px]" :style="trailingSpacerStyle" />
          </div>
        </div>
      </div>
    </div>
    <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
      <p class="text-sm font-semibold text-slate-600">페이지 {{ currentPage }} / {{ totalPages }}</p>
      <div class="flex items-center gap-2">
        <button
          class="rounded-[8px] border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          :disabled="currentPage === 1"
          @click="goToPage(currentPage - 1)"
        >
          이전
        </button>
        <button
          class="rounded-[8px] border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          :disabled="currentPage === totalPages"
          @click="goToPage(currentPage + 1)"
        >
          다음
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.meeting-room-timeline__scroll {
  scrollbar-width: thin;
  scrollbar-color: rgba(100, 116, 139, 0.58) transparent;
}

.meeting-room-timeline__scroll::-webkit-scrollbar {
  height: 6px;
  width: 6px;
}

.meeting-room-timeline__scroll::-webkit-scrollbar-track {
  background: transparent;
}

.meeting-room-timeline__scroll::-webkit-scrollbar-thumb {
  background-color: rgba(100, 116, 139, 0.58);
  border-radius: 999px;
}

.meeting-room-timeline__scroll::-webkit-scrollbar-thumb:hover {
  background-color: rgba(71, 85, 105, 0.72);
}
</style>
