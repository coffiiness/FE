<script setup>
const props = defineProps({
  rooms: { type: Array, required: true },
  bookings: { type: Array, required: true }
})

const emit = defineEmits(['roomClick', 'bookRoomClick'])

const isSameDate = (a, b) => {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const getCurrentBooking = (roomId) => {
  const now = new Date()
  return props.bookings.find(
    (booking) =>
      booking.roomId === roomId &&
      booking.startTime <= now &&
      booking.endTime > now &&
      booking.status === 'confirmed'
  )
}

const getTodayBooking = (roomId) => {
  const today = new Date()
  const todayBookings = props.bookings
    .filter((booking) => booking.roomId === roomId && booking.status === 'confirmed' && isSameDate(booking.startTime, today))
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  return todayBookings[0]
}

const getNextBooking = (roomId) => {
  const now = new Date()
  const future = props.bookings
    .filter((booking) => booking.roomId === roomId && booking.startTime > now && booking.status === 'confirmed')
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  return future[0]
}

const formatTime = (date) => {
  const h = `${date.getHours()}`.padStart(2, '0')
  const m = `${date.getMinutes()}`.padStart(2, '0')
  return `${h}:${m}`
}

const formatDate = (date) => {
  const y = date.getFullYear()
  const m = `${date.getMonth() + 1}`.padStart(2, '0')
  const d = `${date.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${d}`
}

const formatCapacity = (capacity) => {
  const parsed = Number(String(capacity).replace(/[^0-9]/g, ''))
  if (!Number.isFinite(parsed) || parsed <= 0) return '-'
  return `${parsed}인실`
}

const formatFloor = (floor) => {
  const parsed = Number(String(floor).replace(/[^0-9-]/g, ''))
  if (!Number.isFinite(parsed)) return '-'
  return `${parsed}층`
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <div
      v-for="room in rooms"
      :key="room.id"
      class="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
      @click="emit('roomClick', room)"
    >
      <div class="h-2" :style="{ backgroundColor: room.color }"></div>

      <div class="p-5 flex flex-col h-full">
        <div class="flex items-start justify-between mb-3">
          <div class="flex-1">
            <h3 class="font-semibold text-lg text-gray-900">{{ room.name }}</h3>
            <div class="flex items-center gap-4 mt-2 text-sm text-gray-800">
              <div class="flex items-center gap-1">
                <span>{{ formatCapacity(room.capacity) }}</span>
              </div>
              <div class="flex items-center gap-1">
                <span>{{ formatFloor(room.floor) }}</span>
              </div>
            </div>
          </div>
        </div>

        <button
          class="w-full bg-slate-900 text-white text-sm py-2 rounded-lg mt-auto"
          @click.stop="emit('roomClick', room)"
        >
          회의실 상세 보기
        </button>
      </div>
    </div>
  </div>
</template>
