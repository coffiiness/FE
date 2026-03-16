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

const getStatusMeta = (roomId) => {
  const currentBooking = getCurrentBooking(roomId)
  if (currentBooking) {
    return {
      label: '사용 중',
      detail: `${formatTime(currentBooking.startTime)} - ${formatTime(currentBooking.endTime)}`,
      tone: 'teal'
    }
  }

  const nextBooking = getNextBooking(roomId)
  if (nextBooking) {
    return {
      label: '다음 예약',
      detail: `${formatDate(nextBooking.startTime)} · ${formatTime(nextBooking.startTime)}`,
      tone: 'slate'
    }
  }

  const todayBooking = getTodayBooking(roomId)
  if (todayBooking) {
    return {
      label: '오늘 예약',
      detail: `${formatTime(todayBooking.startTime)} - ${formatTime(todayBooking.endTime)}`,
      tone: 'amber'
    }
  }

  return {
    label: '예약 가능',
    detail: '지금 바로 예약할 수 있습니다.',
    tone: 'emerald'
  }
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
    <div
      v-for="room in rooms"
      :key="room.id"
      class="group overflow-hidden rounded-[24px] border border-slate-200 bg-white transition-all duration-200 hover:border-brand-200 hover:shadow-[0_18px_38px_rgba(15,23,42,0.08)]"
      @click="emit('roomClick', room)"
    >
      <div class="h-1.5" :style="{ backgroundColor: room.color }"></div>

      <div class="flex h-full flex-col p-5">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="truncate text-[1.05rem] font-black tracking-[-0.02em] text-slate-950">
                {{ room.name }}
              </h3>
              <span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-extrabold text-slate-600">
                {{ formatCapacity(room.capacity) }}
              </span>
              <span class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-extrabold text-slate-600">
                {{ formatFloor(room.floor) }}
              </span>
            </div>

            <div class="mt-4 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p
                    class="text-[12px] font-black"
                    :class="{
                      'text-brand-700': getStatusMeta(room.id).tone === 'teal',
                      'text-emerald-700': getStatusMeta(room.id).tone === 'emerald',
                      'text-amber-700': getStatusMeta(room.id).tone === 'amber',
                      'text-slate-600': getStatusMeta(room.id).tone === 'slate'
                    }"
                  >
                    {{ getStatusMeta(room.id).label }}
                  </p>
                  <p class="mt-1 text-sm font-semibold text-slate-700">
                    {{ getStatusMeta(room.id).detail }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          class="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-extrabold text-slate-900 transition-colors hover:border-slate-400 hover:bg-slate-50"
          @click.stop="emit('roomClick', room)"
        >
          회의실 보기
        </button>
      </div>
    </div>
  </div>
</template>
