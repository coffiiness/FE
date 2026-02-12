<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  room: { type: Object, default: null },
  selectedDate: { type: Date, default: null },
  selectedHour: { type: Number, default: null }
})

const emit = defineEmits(['close', 'confirm'])

const state = reactive({
  title: '',
  description: '',
  date: '',
  startTime: '09:00',
  endTime: '10:00',
  organizer: '',
  attendees: ''
})

watch(
  () => props.open,
  (open) => {
    if (!open) return
    const baseDate = props.selectedDate || new Date()
    const defaultHour = props.selectedHour ?? 9
    state.date = `${baseDate.getFullYear()}-${String(baseDate.getMonth() + 1).padStart(2, '0')}-${String(baseDate.getDate()).padStart(2, '0')}`
    state.startTime = `${String(defaultHour).padStart(2, '0')}:00`
    state.endTime = `${String(defaultHour + 1).padStart(2, '0')}:00`
  }
)

const handleSubmit = () => {
  if (!props.room || !state.title || !state.organizer) return
  const [startHour, startMinute] = state.startTime.split(':').map(Number)
  const [endHour, endMinute] = state.endTime.split(':').map(Number)
  const base = new Date(state.date)
  const startDateTime = new Date(base)
  startDateTime.setHours(startHour, startMinute, 0, 0)
  const endDateTime = new Date(base)
  endDateTime.setHours(endHour, endMinute, 0, 0)

  emit('confirm', {
    roomId: props.room.id,
    title: state.title,
    description: state.description,
    startTime: startDateTime,
    endTime: endDateTime,
    organizer: state.organizer,
    attendees: state.attendees.split(',').map((a) => a.trim()).filter(Boolean),
    status: 'confirmed'
  })

  state.title = ''
  state.description = ''
  state.organizer = ''
  state.attendees = ''
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
    <div class="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[78vh] overflow-hidden flex flex-col">
      <div class="px-6 py-5 border-b flex items-start justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">회의실 예약</h3>
          <p class="text-xs text-slate-500 mt-1">예약 정보를 입력하세요</p>
        </div>
        <button class="text-slate-500 hover:text-slate-700" @click="emit('close')" aria-label="닫기">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="p-6 space-y-5 overflow-y-auto text-slate-900">
        <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex items-center gap-3">
          <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: room?.color || '#94a3b8' }"></span>
          <div>
            <div class="font-semibold text-slate-900">{{ room?.name }}</div>
            <div class="text-sm text-slate-700 mt-0.5">{{ room?.capacity }}인 · {{ room?.floor }}층</div>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-900">회의 제목 *</label>
          <input v-model="state.title" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" placeholder="회의 제목을 입력하세요" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-900">회의 설명</label>
          <textarea v-model="state.description" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 resize-none" rows="3"></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-900">날짜</label>
            <input v-model="state.date" type="date" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-900">시작 시간</label>
            <input v-model="state.startTime" type="time" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-medium text-slate-900">종료 시간</label>
            <input v-model="state.endTime" type="time" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-900">주최자 *</label>
          <input v-model="state.organizer" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" placeholder="주최자 이름" />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-slate-900">참석자</label>
          <input v-model="state.attendees" class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500" placeholder="참석자를 쉼표로 구분" />
          <p class="text-xs text-slate-500">예: 홍길동, 김철수</p>
        </div>
      </div>
      <div class="px-6 py-4 border-t flex justify-end gap-2 bg-white">
        <button class="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700" @click="handleSubmit">예약 확정</button>
      </div>
    </div>
  </div>
</template>
