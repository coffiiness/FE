<script setup>
import { ref } from 'vue'

const activeTab = ref('request')
const emit = defineEmits(['close'])
</script>

<template>
  <div class="fixed inset-0 z-40 cursor-default" @click="$emit('close')"></div>

  <div class="absolute right-0 top-full mt-3 w-[440px] bg-white rounded-xl z-50 overflow-hidden flex flex-col max-h-[80vh] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-200 animate-fade-in-down">

    <div class="px-5 py-4 flex justify-between items-center bg-white">
      <h2 class="font-bold text-lg text-slate-800 font-display">알림</h2>
      <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <div class="flex px-5 border-b border-slate-200 bg-white">
      <button
          @click="activeTab = 'request'"
          class="relative py-3 mr-6 text-sm font-bold transition-colors flex items-center gap-1.5"
          :class="activeTab === 'request' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'"
      >
        일정 요청
        <span
            class="px-1.5 py-0.5 rounded-full text-[11px] font-bold"
            :class="activeTab === 'request' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'"
        >3</span>
        <span v-if="activeTab === 'request'" class="absolute bottom-[-1px] left-0 w-full h-[2px] bg-blue-600"></span>
      </button>
      <button
          @click="activeTab = 'all'"
          class="relative py-3 text-sm font-medium transition-colors"
          :class="activeTab === 'all' ? 'text-slate-800 font-bold' : 'text-slate-400 hover:text-slate-600'"
      >
        전체 알림
        <span v-if="activeTab === 'all'" class="absolute bottom-[-1px] left-0 w-full h-[2px] bg-slate-800"></span>
      </button>
    </div>

    <div class="overflow-y-auto flex-1 p-4 bg-slate-50 custom-scrollbar space-y-3">

      <template v-if="activeTab === 'request'">
        <div class="bg-white p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex flex-col items-center justify-center text-blue-600">
              <span class="text-[9px] font-bold uppercase leading-none mt-1">Feb</span>
              <span class="text-sm font-bold leading-none mt-1">17</span>
            </div>
            <div class="flex-1">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-bold text-sm text-slate-800">면접 일정 확인 요청</h3>
                <div class="flex gap-1.5">
                  <button class="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded text-xs font-medium transition-colors">
                    거절
                  </button>
                  <button class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors">
                    수락
                  </button>
                </div>
              </div>
              <p class="text-[13px] text-slate-600 mb-1">
                <strong>2024.02.07 (수) 13:00 - 14:30</strong> 기술 면접에 참여 요청이 있습니다.
              </p>
              <p class="text-xs text-slate-500 mb-2">지원자: 박지원 · 장소: 5층 대회의실 A</p>
              <div class="flex gap-3 text-[11px] text-slate-400">
                <span>요청자: 김인사</span>
                <span>10분 전</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-10 h-10 bg-blue-50 border border-blue-100 rounded-lg flex flex-col items-center justify-center text-blue-600">
              <span class="text-[9px] font-bold uppercase leading-none mt-1">Feb</span>
              <span class="text-sm font-bold leading-none mt-1">17</span>
            </div>
            <div class="flex-1">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-bold text-sm text-slate-800">면접 일정 확인 요청</h3>
                <div class="flex gap-1.5">
                  <button class="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded text-xs font-medium transition-colors">
                    거절
                  </button>
                  <button class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors">
                    수락
                  </button>
                </div>
              </div>
              <p class="text-[13px] text-slate-600 mb-1">
                <strong>2024.02.08 (목) 10:00 - 11:00</strong> 1차 면접에 참여 요청이 있습니다.
              </p>
              <p class="text-xs text-slate-500 mb-2">지원자: 이영희 · 장소: 온라인 (Zoom)</p>
              <div class="flex gap-3 text-[11px] text-slate-400">
                <span>요청자: 김인사</span>
                <span>1시간 전</span>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-8 h-8 bg-green-50 rounded-full flex items-center justify-center text-green-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-sm text-slate-800 mb-1">일정이 수락되었습니다</h3>
              <p class="text-[13px] text-slate-600 mb-2">이팀장님이 <strong>2024.02.06 (화) 10:00</strong> 면접 일정을 수락했습니다.</p>
              <div class="flex items-center gap-2 text-[11px]">
                <span class="text-slate-400">어제</span>
                <button class="text-blue-500 hover:underline font-medium">일정 보기</button>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div class="flex gap-4">
            <div class="flex-shrink-0 w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-500">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </div>
            <div class="flex-1">
              <h3 class="font-bold text-sm text-slate-800 mb-1">일정이 거절되었습니다</h3>
              <p class="text-[13px] text-slate-600 mb-1">박시니어님이 <strong>2024.02.06 (화) 10:00</strong> 면접 일정을 거절했습니다.</p>
              <p class="text-xs text-slate-500 mb-2">사유: 다른 미팅이 있습니다.</p>
              <div class="flex items-center gap-2 text-[11px]">
                <span class="text-slate-400">어제</span>
                <button class="text-blue-500 hover:underline font-medium">다시 요청하기</button>
              </div>
            </div>
          </div>
        </div>

      </template>

      <div v-else class="p-8 py-16 text-center flex flex-col items-center justify-center h-full">
        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
          <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <p class="text-sm text-slate-500 font-medium">새로운 알림이 없습니다.</p>
      </div>

    </div>

  </div>
</template>

<style scoped>
@keyframes fade-in-down {
  from { opacity: 0; transform: translateY(-10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-fade-in-down {
  animation: fade-in-down 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #cbd5e1; /* slate-300 */
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8; /* slate-400 */
}
</style>