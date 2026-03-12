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

const emit = defineEmits(['close', 'edit'])

const closeOnBackdrop = (e) => {
  if (e.target === e.currentTarget) emit('close')
}

const formattedDate = computed(() => {
  if (!props.event.date) return ''
  // const [y, m, d] = props.event.date.split('-') // Not needed if we just use the string
  
  if (props.event.time) {
      return `${props.event.date} · ${props.event.time}`
  }
  
  const startTime = props.event.startTime || ''
  const endTime = props.event.endTime || ''
  return `${props.event.date} · ${startTime} - ${endTime}`
})

const location = computed(() => props.event.location || '지정된 장소 없음')
const showSelf = computed(() => Boolean(props.event.showSelf))
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
                 <div
                   v-if="showSelf"
                   class="px-2 py-1 rounded-md bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600"
                 >
                   나
                 </div>
                <div v-for="att in attendees" :key="att" 
                     class="px-2 py-1 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700">
                  {{ att }}
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Footer removed as per user request -->

      </div>
    </div>

  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
