<script setup>
import { onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  event: Object,
  showActions: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['close', 'edit', 'delete'])

// 모달 외부 클릭 시 닫기
const closeOnBackdrop = (e) => {
  if (e.target === e.currentTarget) emit('close')
}

// ESC 키로 닫기
const handleKeydown = (e) => {
  if (e.key === 'Escape' && props.isOpen) emit('close')
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Transition name="fade">
    <div v-if="isOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4" @click="closeOnBackdrop">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"></div>

      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-slate-100">
        <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-start">
          <div>
            <span
              class="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest mb-2"
              :class="event.type === 'interview' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'"
            >
              {{ event.type }}
            </span>
            <h3 class="text-xl font-bold text-slate-800 leading-tight">{{ event.title }}</h3>
          </div>
          <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200/50">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="p-6 space-y-6">
          <div class="flex items-start gap-4">
            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-700">일시</p>
              <p class="text-sm text-slate-600 mt-0.5">{{ event.date }} &middot; {{ event.isAllDay ? '종일' : event.time }}</p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-700">장소 및 메모</p>
              <p v-if="event.room" class="text-sm font-bold text-brand-600 mt-0.5">
                {{ event.room.name }} ({{ event.room.floor }}층)
              </p>
              <p class="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap">{{ event.description || '상세 내용이 없습니다.' }}</p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-6m3 6V7m3 10v-4m3 4V5M3 19h18" /></svg>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-700">일정 상태</p>
              <div class="mt-1.5 flex flex-wrap gap-2">
                <span class="rounded-md border px-2.5 py-1 text-xs font-bold" :class="event.isAllDay ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-slate-200 bg-slate-50 text-slate-600'">
                  {{ event.isAllDay ? '종일' : '시간 지정' }}
                </span>
                <span class="rounded-md border px-2.5 py-1 text-xs font-bold" :class="event.isBusy === false ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'">
                  {{ event.isBusy === false ? '한가함' : '바쁨' }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            </div>
            <div>
              <p class="text-sm font-bold text-slate-700">생성자</p>
              <div class="mt-1.5 flex flex-wrap gap-2">
                <div class="px-2 py-1 rounded-md bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                  {{ event.ownerName || '생성자 정보 없음' }}
                </div>
              </div>
              <p class="mt-3 text-sm font-bold text-slate-700">참석자</p>
              <div class="mt-1.5 flex flex-wrap gap-2">
                <div
                  v-if="!event.attendees || event.attendees.length === 0"
                  class="px-2 py-1 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-medium text-slate-500"
                >
                  참석자가 없습니다.
                </div>
                <div
                  v-for="att in event.attendees"
                  :key="att"
                  class="px-2 py-1 rounded-md bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700"
                >
                  {{ att }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="showActions"
          class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3"
        >
          <button
            @click="$emit('delete', event.id)"
            class="px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            삭제
          </button>
          <button
            @click="$emit('edit', event)"
            class="px-5 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-all flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
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
