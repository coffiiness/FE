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
    <div class="bg-white rounded-2xl shadow-lg w-full max-w-lg max-h-[75vh] overflow-hidden flex flex-col">
      <div class="p-6 border-b">
        <h3 class="text-lg font-semibold">회의실 예약</h3>
      </div>
      <div class="p-6 space-y-4 overflow-y-auto text-slate-900">
        <div class="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
          <span class="w-3 h-3 rounded-full" :style="{ backgroundColor: room?.color || '#94a3b8' }"></span>
          <div>
            <div class="font-semibold text-gray-900">{{ room?.name }}</div>
            <div class="text-sm text-gray-700 mt-1">{{ room?.capacity }}인 · {{ room?.floor }}층</div>
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-900">회의 제목 *</label>
          <input v-model="state.title" class="w-full border rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400" placeholder="회의 제목을 입력하세요" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-900">회의 설명</label>
          <textarea v-model="state.description" class="w-full border rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400" rows="3"></textarea>
        </div>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="text-sm font-medium text-gray-900">날짜</label>
            <input v-model="state.date" type="date" class="w-full border rounded-lg px-3 py-2 text-slate-900" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-900">시작 시간</label>
            <input v-model="state.startTime" type="time" class="w-full border rounded-lg px-3 py-2 text-slate-900" />
          </div>
          <div>
            <label class="text-sm font-medium text-gray-900">종료 시간</label>
            <input v-model="state.endTime" type="time" class="w-full border rounded-lg px-3 py-2 text-slate-900" />
          </div>
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-900">주최자 *</label>
          <input v-model="state.organizer" class="w-full border rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400" placeholder="주최자 이름" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium text-gray-900">참석자</label>
          <input v-model="state.attendees" class="w-full border rounded-lg px-3 py-2 text-slate-900 placeholder:text-slate-400" placeholder="참석자를 쉼표로 구분" />
        </div>
      </div>
      <div class="p-6 border-t flex justify-end gap-2">
        <button class="px-4 py-2 border rounded-lg" @click="emit('close')">취소</button>
        <button class="px-4 py-2 bg-emerald-600 text-white rounded-lg" @click="handleSubmit">예약 확정</button>
      </div>
    </div>
  </div>
</template>
