<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: {
    type: Boolean,
    required: true
  },
  schedules: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'click-schedule'])

const sortedSchedules = computed(() => {
  return [...props.schedules].sort((a, b) => {
    // Sort by date then time
    if (a.date !== b.date) return new Date(a.date) - new Date(b.date)
    return a.time.localeCompare(b.time)
  })
})

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const days = ['일', '월', '화', '수', '목', '금', '토']
  return `${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`
}
</script>

<template>
  <Transition name="fade">
    <div v-if="show" class="fixed inset-0 z-[50] flex items-center justify-center p-4" @click.self="$emit('close')">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"></div>

      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-[500px] overflow-hidden flex flex-col max-h-[80vh] animate-fade-in-up">
        
        <!-- Header -->
        <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <div>
            <h3 class="text-xl font-bold text-slate-900">이번 주 면접 일정</h3>
            <p class="text-sm text-slate-500 mt-1">총 {{ schedules.length }}건의 면접이 예정되어 있습니다.</p>
          </div>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50">
          <div v-if="schedules.length === 0" class="flex flex-col items-center justify-center py-12 text-slate-400">
            <svg class="w-12 h-12 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" />
            </svg>
            <p class="text-sm">이번 주 예정된 면접이 없습니다.</p>
          </div>

          <div v-else class="space-y-3">
            <div v-for="schedule in sortedSchedules" :key="schedule.id" 
                 @click="$emit('click-schedule', schedule)"
                 class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-brand-300 transition-all cursor-pointer group">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                  {{ formatDate(schedule.date) }}
                </span>
                <span class="text-xs font-bold text-brand-600 group-hover:underline">
                  상세보기 &rarr;
                </span>
              </div>
              <h4 class="text-base font-bold text-slate-900 mb-1 group-hover:text-brand-600 transition-colors">
                {{ schedule.title }}
              </h4>
              <div class="flex items-center text-xs text-slate-500 gap-3">
                <span class="flex items-center">
                  <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {{ schedule.time }}
                </span>
                <span class="flex items-center">
                  <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {{ schedule.applicantName || '지원자 미정' }}
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.animate-fade-in-up {
  animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }
</style>
