<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  event: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['close', 'delete', 'edit'])

const closeOnBackdrop = (e) => {
  if (e.target === e.currentTarget) emit('close')
}

const formattedDate = computed(() => {
  if (!props.event.date) return ''
  const [y, m, d] = props.event.date.split('-')
  const startTime = props.event.time || ''
  const endTime = props.event.endTime || ''
  return `${y}-${m}-${d} · ${startTime} - ${endTime}`
})

const location = computed(() => props.event.location || '지정된 장소 없음')
const attendees = computed(() => props.event.attendees || [])
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[60] flex items-center justify-center p-4" @click="closeOnBackdrop">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"></div>

      <div class="relative bg-white rounded-xl shadow-2xl w-full max-w-[400px] overflow-hidden transform transition-all scale-100">
        
        <!-- Header -->
        <div class="px-6 py-5 bg-white relative">
          <button @click="$emit('close')" class="absolute top-4 right-4 text-slate-300 hover:text-slate-500 transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <span class="inline-block px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest mb-3" style="background-color: #FEF3C7; color: #D97706;">
            INTERVIEW
          </span>
          <h3 class="text-xl font-bold text-slate-900 leading-tight">{{ event.title }}</h3>
        </div>

        <!-- Body -->
        <div class="px-6 pb-8 space-y-6">
          
          <!-- 일시 -->
          <div class="flex items-start gap-4">
            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-800 mb-0.5">일시</p>
              <p class="text-sm text-slate-500">{{ formattedDate }}</p>
            </div>
          </div>

          <!-- 장소 및 메모 -->
          <div class="flex items-start gap-4">
            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-800 mb-0.5">장소 및 메모</p>
              <p class="text-sm text-slate-500">{{ location }}</p>
            </div>
          </div>

          <!-- 참석자 -->
           <div class="flex items-start gap-4">
            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-800 mb-1.5">참석자</p>
              <div class="flex flex-wrap gap-2">
                 <div class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500">
                   나
                 </div>
                <div v-for="att in attendees" :key="att" 
                     class="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                  {{ att[0] }}
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div class="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end items-center gap-4">
          <button @click="$emit('delete', event.id)" class="text-sm font-bold text-rose-500 hover:text-rose-700 transition-colors">
            삭제
          </button>
          <button @click="$emit('edit', event)" class="bg-[#0D9488] text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-[#0F766E] transition-colors flex items-center gap-1.5 shadow-sm">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            수정하기
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
