<script setup>
import { ref, watch, defineProps, defineEmits, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  initialDate: String,
  initialData: { type: Object, default: null }
})

const emit = defineEmits(['close', 'save'])

const form = ref({
  title: '',
  date: '',
  startTime: '13:00',
  endTime: '14:00',
  type: 'INTERVIEW',
  description: '',
  attendees: []
})

const attendeeInput = ref('')

const scheduleTypes = [
  { value: 'INTERVIEW', label: '면접', activeClass: 'bg-brand-50 border-brand-200 text-brand-600' }, // [수정]
  { value: 'MEETING', label: '회의', activeClass: 'bg-amber-50 border-amber-200 text-amber-600' },
  { value: 'BUSINESS_TRIP', label: '외근/출장', activeClass: 'bg-emerald-50 border-emerald-200 text-emerald-600' },
  { value: 'OTHERS', label: '기타', activeClass: 'bg-slate-100 border-slate-300 text-slate-700' }
]

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    if (props.initialData) {
      form.value = { ...props.initialData, attendees: props.initialData.attendees || [] }
    } else {
      form.value = {
        title: '',
        date: props.initialDate || new Date().toISOString().split('T')[0],
        startTime: '13:00',
        endTime: '14:00',
        type: 'INTERVIEW',
        description: '',
        attendees: []
      }
    }
    attendeeInput.value = ''
  }
})

const addAttendee = () => {
  const name = attendeeInput.value.trim()
  if (name && !form.value.attendees.includes(name)) { form.value.attendees.push(name) }
  attendeeInput.value = ''
}

const removeAttendee = (index) => { form.value.attendees.splice(index, 1) }

const save = () => {
  if (!form.value.title) return alert('일정 제목을 입력해주세요.')
  emit('save', { ...form.value })
}

const handleKeydown = (e) => { if (e.key === 'Escape' && props.isOpen) emit('close') }
onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="$emit('close')"></div>

      <div class="relative bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden transform transition-all scale-100">

        <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 class="text-lg font-bold text-slate-800">
            {{ initialData ? '일정 수정' : '새 일정 생성' }}
          </h3>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="p-6 space-y-6">

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">제목</label>
            <input v-model="form.title" type="text" placeholder="예: 2차 기술 면접"
                   class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-slate-700 font-bold placeholder-slate-400 transition-all text-base" autofocus> </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">일정 타입</label>
            <div class="grid grid-cols-4 gap-2">
              <button
                  v-for="item in scheduleTypes"
                  :key="item.value"
                  @click="form.type = item.value"
                  class="py-2.5 rounded-lg text-xs font-bold border transition-all shadow-sm hover:shadow-md"
                  :class="form.type === item.value
                  ? item.activeClass
                  : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'"
              >
                {{ item.label }}
              </button>
            </div>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">날짜</label>
              <div class="relative">
                <input v-model="form.date" type="date" class="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none font-medium text-sm shadow-sm"> </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">시작 시간</label>
                <input v-model="form.startTime" type="time" class="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none text-sm font-medium text-center shadow-sm"> </div>
              <div>
                <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">종료 시간</label>
                <input v-model="form.endTime" type="time" class="w-full px-3 py-3 bg-white border border-slate-200 rounded-xl text-slate-700 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 focus:outline-none text-sm font-medium text-center shadow-sm"> </div>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">참석자 (Enter로 추가)</label>
            <div class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all flex flex-wrap gap-2 items-center min-h-[50px] shadow-sm"> <span v-for="(person, index) in form.attendees" :key="index"
                                                                                                                                                                                                                                                   class="bg-brand-50 text-brand-700 border border-brand-100 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fade-in-up"> {{ person }}
                <button @click="removeAttendee(index)" class="hover:text-brand-900 rounded-full hover:bg-brand-200 p-0.5 transition-colors">
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </span>

              <input
                  v-model="attendeeInput"
                  @keydown.enter.prevent="addAttendee"
                  @keydown.backspace="attendeeInput === '' && form.attendees.pop()"
                  type="text"
                  placeholder="이름 입력"
                  class="flex-1 bg-transparent focus:outline-none text-sm text-slate-700 placeholder-slate-300 min-w-[80px] h-full py-1"
              >
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">메모 / 장소</label>
            <textarea v-model="form.description" rows="3" placeholder="장소나 상세 내용을 입력하세요."
                      class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm text-slate-700 resize-none shadow-inner"></textarea> </div>

        </div>

        <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button @click="$emit('close')" class="px-5 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-700 rounded-lg transition-all">취소</button>
          <button @click="save" class="px-6 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-all transform active:scale-95"> {{ initialData ? '수정 완료' : '일정 생성' }}
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.animate-fade-in-up { animation: fadeInUp 0.2s ease-out forwards; }
</style>