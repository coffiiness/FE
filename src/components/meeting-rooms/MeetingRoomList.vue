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
                <span>{{ room.capacity }}인</span>
              </div>
              <div class="flex items-center gap-1">
                <span>{{ room.floor }}층</span>
              </div>
            </div>
          </div>
          <div class="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
            사용 가능
          </div>
        </div>

        <div class="flex items-center gap-2 mb-4 flex-wrap">
          <div
            v-for="facility in room.facilities.slice(0, 4)"
            :key="facility"
            class="px-2 py-1 bg-slate-200 rounded text-xs text-slate-900 font-medium"
          >
            {{ facility }}
          </div>
          <div v-if="room.facilities.length > 4" class="px-2 py-1 bg-slate-200 rounded text-xs text-slate-900 font-medium">
            +{{ room.facilities.length - 4 }}
          </div>
        </div>

        <div class="border-t pt-3 mb-3 min-h-[72px]">
          <template v-if="getCurrentBooking(room.id)">
            <div class="text-xs text-slate-600 mb-1">현재 예약</div>
            <div class="text-sm font-semibold text-slate-900 truncate">{{ getCurrentBooking(room.id).title }}</div>
            <div class="text-xs text-slate-700 mt-1">
              {{ formatTime(getCurrentBooking(room.id).startTime) }} - {{ formatTime(getCurrentBooking(room.id).endTime) }}
            </div>
          </template>
          <template v-else-if="getTodayBooking(room.id)">
            <div class="text-xs text-slate-600 mb-1">다음 진행 일정</div>
            <div class="text-sm font-semibold text-slate-900 truncate">{{ getTodayBooking(room.id).title }}</div>
            <div class="text-xs text-slate-700 mt-1">
              {{ formatTime(getTodayBooking(room.id).startTime) }} - {{ formatTime(getTodayBooking(room.id).endTime) }}
            </div>
          </template>
          <template v-else-if="getNextBooking(room.id)">
            <div class="text-xs text-slate-600 mb-1">다음 예약</div>
            <div class="text-sm font-semibold text-slate-900 truncate">{{ getNextBooking(room.id).title }}</div>
            <div class="text-xs text-slate-700 mt-1">
              {{ formatTime(getNextBooking(room.id).startTime) }} - {{ formatTime(getNextBooking(room.id).endTime) }}
            </div>
          </template>
          <div v-else class="text-sm text-slate-700">오늘 예약 없음</div>
        </div>

        <button
          class="w-full bg-emerald-600 text-white text-sm py-2 rounded-lg mt-auto"
          @click.stop="emit('bookRoomClick', room)"
        >
          예약하기
        </button>
      </div>
    </div>
  </div>
</template>
