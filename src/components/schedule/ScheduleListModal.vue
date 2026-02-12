<script setup>
import { computed } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  date: String,
  events: Array
})

const emit = defineEmits(['close', 'add', 'edit', 'delete'])

const formattedDateTitle = computed(() => {
  if (!props.date) return ''
  const [y, m, d] = props.date.split('-')
  return `${y}년 ${parseInt(m)}월 ${parseInt(d)}일`
})

const getEventStyle = (type) => {
  switch (type) {
    case 'INTERVIEW':
    case 'interview': return { bg: 'bg-brand-50', border: 'border-brand-100', text: 'text-brand-700', badge: 'bg-white border-brand-200 text-brand-700' }
    case 'MEETING':
    case 'meeting': return { bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-700', badge: 'bg-white border-amber-200 text-amber-700' }
    case 'BUSINESS_TRIP':
    case 'business_trip': return { bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700', badge: 'bg-white border-emerald-200 text-emerald-700' }
    case 'off': return { bg: 'bg-rose-50', border: 'border-rose-100', text: 'text-rose-700', badge: 'bg-white border-rose-200 text-rose-700' }
    default: return { bg: 'bg-slate-50', border: 'border-slate-100', text: 'text-slate-700', badge: 'bg-white border-slate-200 text-slate-700' }
  }
}

const typeLabel = (type) => {
  if (type === 'interview') return '면접'
  if (type === 'meeting') return '회의'
  if (type === 'off') return '휴가'
  return '기타'
}
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm" @click.self="$emit('close')">

      <div class="bg-white rounded-2xl shadow-2xl w-[400px] max-w-[90%] flex flex-col max-h-[600px] animate-fade-in-up border border-slate-200 overflow-hidden">

        <div class="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center flex-none">
          <div>
            <h3 class="text-xl font-bold text-slate-900 tracking-tight">{{ formattedDateTitle }}</h3>
            <p class="text-xs text-slate-500 font-medium mt-1">총 {{ events.length }}건의 일정</p>
          </div>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 bg-white hover:bg-slate-100 p-2 rounded-full shadow-sm border border-slate-200 transition-all">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5 space-y-3 custom-scrollbar">
          <div v-if="events.length === 0" class="flex flex-col items-center justify-center h-40 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
            <p class="font-medium text-sm">등록된 일정이 없습니다.</p>
          </div>

          <div v-for="evt in events" :key="evt.id"
               @click="$emit('edit', evt)"
               class="p-4 rounded-xl border flex items-start space-x-4 hover:shadow-md hover:translate-x-1 transition-all bg-white group cursor-pointer relative pr-12"
               :class="[getEventStyle(evt.type).bg, getEventStyle(evt.type).border]"
          >
            <div class="flex-none flex flex-col items-center justify-center w-24 py-3 rounded-lg border shadow-sm"
                 :class="getEventStyle(evt.type).badge">
              <span class="text-xs font-black tracking-tight text-center leading-relaxed whitespace-pre-line break-words">{{ evt.time.replace(' - ', '\n~ ') }}</span>
            </div>

            <div class="flex-1 min-w-0 py-1">
              <h4 class="text-sm font-bold text-slate-900 truncate group-hover:text-brand-700 transition-colors">
                {{ evt.title }}
              </h4>
              <div class="flex items-center mt-2 gap-2 flex-wrap">
                 <span class="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-white/60 border border-black/5 shrink-0" :class="getEventStyle(evt.type).text">
                   {{ typeLabel(evt.type) }}
                 </span>
                <span class="text-xs text-slate-500 font-medium truncate" v-if="evt.description">{{ evt.description }}</span>
              </div>
            </div>

            <button
                @click.stop="$emit('delete', evt.id)"
                class="absolute right-3 top-3 p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
                title="삭제"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        <div class="p-4 border-t border-slate-100 bg-slate-50 text-right flex-none">
          <button
              @click="$emit('add')"
              class="text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2.5 rounded-lg transition-colors shadow-sm flex items-center justify-center w-full sm:w-auto ml-auto"
          >
            + 일정 추가하기
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>