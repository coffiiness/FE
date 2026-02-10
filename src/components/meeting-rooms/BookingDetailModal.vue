<script setup>
import { ref } from 'vue'
const props = defineProps({
  open: { type: Boolean, required: true },
  booking: { type: Object, default: null },
  room: { type: Object, default: null }
})

const emit = defineEmits(['close', 'delete'])
const showDeleteConfirm = ref(false)

const formatTime = (date) => {
  if (!date) return ''
  const h = `${date.getHours()}`.padStart(2, '0')
  const m = `${date.getMinutes()}`.padStart(2, '0')
  return `${h}:${m}`
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

const handleDelete = () => {
  if (!props.booking) return
  showDeleteConfirm.value = true
}

const confirmDelete = () => {
  if (!props.booking) return
  emit('delete', props.booking.id)
  showDeleteConfirm.value = false
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
    <div class="bg-white rounded-2xl shadow-lg w-full max-w-lg max-h-[75vh] overflow-hidden flex flex-col">
      <div class="p-6 border-b">
        <h3 class="text-lg font-semibold text-slate-900">예약 상세 정보</h3>
      </div>
      <div class="p-6 space-y-4 overflow-y-auto text-slate-900">
        <div class="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
          <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: room?.color || '#94a3b8' }"></span>
          <div>
            <div class="font-semibold text-slate-900">{{ room?.name }}</div>
            <div class="text-sm text-slate-700 mt-1">{{ room?.capacity }}인 · {{ room?.floor }}층</div>
          </div>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-slate-900">{{ booking?.title }}</h3>
          <p class="text-slate-800 mt-2">{{ booking?.description }}</p>
        </div>
        <div class="h-px bg-slate-100 w-full"></div>
        <div class="space-y-2 text-sm">
          <div class="text-slate-700">날짜: <span class="text-slate-900 font-medium">{{ formatDate(booking?.startTime) }}</span></div>
          <div class="text-slate-700">시간: <span class="text-slate-900 font-medium">{{ formatTime(booking?.startTime) }} - {{ formatTime(booking?.endTime) }}</span></div>
          <div class="text-slate-700">주최자: <span class="text-slate-900 font-medium">{{ booking?.organizer }}</span></div>
        </div>
        <div v-if="booking?.attendees?.length" class="text-sm">
          <div class="mb-2 text-slate-700">참석자 ({{ booking.attendees.length }}명)</div>
          <div class="flex flex-wrap gap-2">
            <span v-for="(att, idx) in booking.attendees" :key="idx" class="px-3 py-1 bg-slate-200 text-slate-900 rounded-full text-xs font-medium">
              {{ att }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm text-slate-700">상태:</span>
          <span
            class="px-3 py-1 rounded-full text-xs font-medium"
            :class="booking?.status === 'confirmed'
              ? 'bg-emerald-100 text-emerald-700'
              : booking?.status === 'pending'
              ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'"
          >
            {{
              booking?.status === 'confirmed'
                ? '확정'
                : booking?.status === 'pending'
                ? '대기'
                : '취소'
            }}
          </span>
        </div>
      </div>
      <div class="p-6 border-t space-y-3">
        <div v-if="showDeleteConfirm" class="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          예약을 삭제하시겠습니까? 삭제하면 복구할 수 없습니다.
          <div class="mt-3 flex justify-end gap-2">
            <button class="px-3 py-1.5 border border-rose-200 rounded-lg text-rose-700 bg-white" @click="cancelDelete">취소</button>
            <button class="px-3 py-1.5 rounded-lg text-white bg-rose-600 hover:bg-rose-700" @click="confirmDelete">삭제</button>
          </div>
        </div>
        <div class="flex justify-between">
          <button class="px-4 py-2 border rounded-lg text-red-600" @click="handleDelete">예약 삭제</button>
        <button class="px-4 py-2 border border-slate-400 text-slate-800 rounded-lg hover:bg-slate-50" @click="emit('close')">닫기</button>
        </div>
      </div>
    </div>
  </div>
</template>
