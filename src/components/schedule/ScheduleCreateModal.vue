<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  selectedDate: String // '2026-02-14' 형식
})

const emit = defineEmits(['close', 'save'])

// 폼 데이터
const form = ref({
  title: '',
  type: 'INTERVIEW', // INTERVIEW, MEETING, ETC
  startTime: '09:00',
  endTime: '10:00',
  description: ''
})

const typeOptions = [
  {
    label: '일반 회의',
    value: 'MEETING',
    description: '팀 미팅, 사내 회의 등',
    class: 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
  },
  {
    label: '집중 근무',
    value: 'FOCUS',
    description: '방해 금지 모드',
    class: 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100'
  },
  {
    label: '외근/출장',
    value: 'EXTERNAL',
    description: '외부 미팅, 세미나',
    class: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
  },
  {
    label: '휴가/부재',
    value: 'OFF',
    description: '연차, 반차, 병가',
    class: 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
  }
]

const save = () => {
  // 실제로는 여기서 API 호출 로직이 들어갑니다.
  emit('save', { ...form.value, date: props.selectedDate })
  resetForm()
}

const close = () => {
  emit('close')
  resetForm()
}

const resetForm = () => {
  form.value = { title: '', type: 'INTERVIEW', startTime: '09:00', endTime: '10:00', description: '' }
}
</script>

<template>
  <Transition name="modal">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="close"></div>

      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">

        <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 class="text-lg font-bold text-slate-800">
            {{ selectedDate }} 일정 추가
          </h3>
          <button @click="close" class="text-slate-400 hover:text-slate-600 transition-colors">
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
                  type="button"
                  class="flex flex-col items-start px-4 py-3 rounded-xl border transition-all text-left"
                  :class="[
        form.type === opt.value ? 'ring-2 ring-offset-1 ring-indigo-500 border-transparent ' + opt.class.replace('hover:', '') : 'bg-white border-slate-200 hover:bg-slate-50'
      ]"
              >
      <span class="text-sm font-bold" :class="form.type !== opt.value ? 'text-slate-700' : ''">
        {{ opt.label }}
      </span>
                <span class="text-[10px] mt-0.5" :class="form.type !== opt.value ? 'text-slate-400' : 'opacity-80'">
        {{ opt.description }}
      </span>
              </button>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">제목</label>
            <input
                v-model="form.title"
                type="text"
                placeholder="예: 기술 면접 (김철수)"
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            >
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">시작 시간</label>
              <input v-model="form.startTime" type="time" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">종료 시간</label>
              <input v-model="form.endTime" type="time" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none">
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">메모</label>
            <textarea
                v-model="form.description"
                rows="3"
                placeholder="일정 관련 메모를 남겨주세요."
                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none resize-none"
            ></textarea>
          </div>

        </div>

        <div class="px-6 py-4 bg-slate-50 flex justify-end gap-3">
          <button @click="close" class="px-5 py-2.5 rounded-xl text-slate-600 font-medium hover:bg-slate-200 transition-colors">
            취소
          </button>
          <button @click="save" class="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold hover:bg-brand-700 shadow-md hover:shadow-lg transition-all">
            일정 생성
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>