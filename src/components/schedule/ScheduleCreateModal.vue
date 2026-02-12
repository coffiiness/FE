<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  initialDate: String,
  initialData: Object
})

const emit = defineEmits(['close', 'save', 'delete'])

const isEditMode = computed(() => !!props.initialData)

const form = ref({
  id: null,
  title: '',
  date: '',
  type: 'MEETING',
  startTime: '09:00',
  endTime: '10:00',
  description: ''
})

const typeOptions = [
  { label: '일반 회의', value: 'MEETING', class: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100' },
  { label: '집중 근무', value: 'FOCUS', class: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100' },
  { label: '외근/출장', value: 'EXTERNAL', class: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' },
  { label: '휴가/부재', value: 'OFF', class: 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' }
]

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    if (props.initialData) {
      form.value = { ...props.initialData }
    } else {
      resetForm()
      form.value.date = props.initialDate
    }
  }
})

const save = () => {
  emit('save', { ...form.value })
}

const remove = () => {
  if (confirm('정말 이 일정을 삭제하시겠습니까? 복구할 수 없습니다.')) {
    emit('delete', form.value.id)
  }
}

const close = () => {
  emit('close')
}

const resetForm = () => {
  form.value = { id: null, title: '', date: '', type: 'MEETING', startTime: '09:00', endTime: '10:00', description: '' }
}
</script>

<template>
  <Transition name="modal">
    <div v-if="isOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">

      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="close"></div>

      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">

        <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 class="text-lg font-bold text-slate-800">
            {{ isEditMode ? '일정 수정' : '새 일정 만들기' }}
          </h3>
          <button @click="close" class="text-slate-400 hover:text-slate-600">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="p-6 space-y-5">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">일정 유형</label>
            <div class="grid grid-cols-2 gap-2">
              <button
                  v-for="opt in typeOptions"
                  :key="opt.value"
                  @click="form.type = opt.value"
                  class="px-3 py-2 rounded-lg text-sm font-medium border transition-all text-center"
                  :class="form.type === opt.value ? 'ring-2 ring-indigo-500 ' + opt.class : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">제목</label>
            <input v-model="form.title" type="text" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">날짜</label>
            <input v-model="form.date" type="date" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500">
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">시작</label>
              <input v-model="form.startTime" type="time" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">종료</label>
              <input v-model="form.endTime" type="time" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">메모</label>
            <textarea v-model="form.description" rows="2" class="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-indigo-500 focus:outline-none resize-none"></textarea>
          </div>
        </div>

        <div class="px-6 py-4 bg-slate-50 flex justify-between items-center">
          <div>
            <button
                v-if="isEditMode"
                @click="remove"
                class="flex items-center text-rose-500 text-sm font-bold hover:text-rose-700 px-2 py-1 transition-colors"
            >
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              삭제하기
            </button>
          </div>

          <div class="flex gap-3">
            <button @click="close" class="px-5 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition-colors">취소</button>
            <button @click="save" class="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-md transition-colors">
              {{ isEditMode ? '수정완료' : '일정생성' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>