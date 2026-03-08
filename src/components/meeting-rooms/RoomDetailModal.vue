<script setup>
const props = defineProps({
  open: { type: Boolean, required: true },
  room: { type: Object, default: null },
  bookings: { type: Array, required: true }
})

const emit = defineEmits(['close', 'bookRoom', 'bookingClick'])

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

const roomBookings = () => {
  if (!props.room) return []
  return props.bookings
    .filter((b) => b.roomId === props.room.id)
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
    <div class="bg-white rounded-2xl shadow-lg w-full max-w-2xl">
      <div class="p-6 border-b">
        <h3 class="text-lg font-semibold text-slate-900">회의실 상세 정보</h3>
      </div>
      <div class="p-6 space-y-4 text-slate-900">
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-xl text-white flex items-center justify-center text-2xl font-bold" :style="{ backgroundColor: room?.color }">
              {{ room?.name?.[0] }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: room?.color || '#94a3b8' }"></span>
                <h3 class="text-2xl font-bold text-slate-900">{{ room?.name }}</h3>
              </div>
              <p class="text-slate-800 mt-1">{{ room?.description }}</p>
              <div class="text-sm text-slate-700 mt-2">최대 <span class="text-slate-900 font-medium">{{ room?.capacity }}</span>인 · <span class="text-slate-900 font-medium">{{ room?.floor }}</span>층</div>
            </div>
          </div>

          <div>
            <h4 class="font-semibold text-slate-900 mb-2">제공 시설</h4>
            <div class="flex flex-wrap gap-2">
              <span v-for="facility in room?.facilities || []" :key="facility" class="px-3 py-1 bg-slate-200 rounded text-xs font-medium text-slate-900">
                {{ facility }}
              </span>
            </div>
          </div>

          <div>
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-semibold text-slate-900">예약 일정</h4>
              <button class="px-3 py-1 bg-emerald-600 text-white rounded text-sm" @click="emit('bookRoom', room)">
                예약하기
              </button>
            </div>
            <div v-if="roomBookings().length" class="space-y-2 max-h-64 overflow-y-auto pr-1">
              <div
                v-for="booking in roomBookings()"
                :key="booking.id"
                class="p-4 bg-gray-50 rounded-lg border hover:border-emerald-500 transition-colors cursor-pointer"
                @click="emit('bookingClick', booking)"
              >
                <div class="font-semibold text-slate-900">{{ booking.title }}</div>
                <div class="text-sm text-slate-700 mt-1">
                  <span class="text-slate-900 font-medium">{{ formatDate(booking.startTime) }} {{ formatTime(booking.startTime) }} - {{ formatTime(booking.endTime) }}</span>
                  · {{ booking.organizer }}
                </div>
              </div>
            </div>
            <div v-else class="text-center py-6 text-slate-800 bg-gray-50 rounded-lg">
              예약된 일정이 없습니다
            </div>
          </div>
      </div>
      <div class="p-6 border-t flex justify-end gap-2">
        <button class="px-4 py-2 border rounded-lg" @click="emit('close')">닫기</button>
      </div>
    </div>
  </div>
</template>
