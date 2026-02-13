<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const emit = defineEmits(['close', 'update:count'])
const router = useRouter()

const isModalOpen = ref(false)
const selectedNotification = ref(null)

const notificationRequests = ref([
  {
    id: 1,
    title: '면접 일정 확인 요청',
    date: '2024.02.07 (수) 13:00 - 14:30',
    displayDate: { month: 'Feb', day: '07' },
    type: '기술 면접',
    applicant: '박지원',
    location: '5층 대회의실 A',
    requester: '김인사',
    time: '10분 전'
  },
  {
    id: 2,
    title: '면접 일정 확인 요청',
    date: '2024.02.08 (목) 10:00 - 11:00',
    displayDate: { month: 'Feb', day: '08' },
    type: '1차 면접',
    applicant: '이영희',
    location: '온라인 (Zoom)',
    requester: '김인사',
    time: '1시간 전'
  }
])

const openNotificationModal = (notificationData) => {
  selectedNotification.value = notificationData
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  selectedNotification.value = null
}

const goToAllNotifications = () => {
  router.push('/notifications')
  emit('close')
}

const handleDecision = (type) => {
  if (!selectedNotification.value) return

  notificationRequests.value = notificationRequests.value.filter(
      (item) => item.id !== selectedNotification.value.id
  )

  closeModal()

  emit('update:count', notificationRequests.value.length)
}
</script>

<template>
  <div class="fixed inset-0 z-40 cursor-default" @click="$emit('close')"></div>

  <div class="absolute right-0 top-full mt-3 w-[440px] bg-white rounded-2xl z-50 overflow-hidden flex flex-col max-h-[80vh] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-200 animate-fade-in-down">

    <div class="px-6 py-5 flex justify-between items-center border-b border-slate-100 bg-white flex-shrink-0">
      <div class="flex items-center gap-3">
        <h2 class="font-bold text-xl text-slate-800 font-display">일정 요청</h2>
        <span v-if="notificationRequests.length > 0" class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
          {{ notificationRequests.length }}
        </span>
      </div>
      <button @click="$emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>

    <div class="overflow-y-auto flex-1 p-4 bg-slate-50/50 custom-scrollbar space-y-3">
      <div v-if="notificationRequests.length === 0" class="text-center py-10 text-slate-400 text-sm">
        새로운 알림이 없습니다.
      </div>

      <div
          v-for="item in notificationRequests"
          :key="item.id"
          class="group relative bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
          @click="openNotificationModal(item)"
      >
        <div class="flex gap-4">
          <div class="flex-shrink-0 w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex flex-col items-center justify-center group-hover:bg-blue-600 transition-colors">
            <span class="text-[10px] font-bold text-blue-600 group-hover:text-blue-100 uppercase leading-none">{{ item.displayDate.month }}</span>
            <span class="text-lg font-bold text-blue-700 group-hover:text-white leading-none mt-1">{{ item.displayDate.day }}</span>
          </div>

          <div class="flex-1">
            <h3 class="font-bold text-sm text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">{{ item.title }}</h3>
            <p class="text-[13px] text-slate-600 mb-1 leading-relaxed">
              <span class="text-slate-900 font-bold">{{ item.date }}</span> {{ item.type }} 참여 요청
            </p>
            <p class="text-xs text-slate-500 mb-3">장소: {{ item.location }}</p>
            <div class="flex justify-between items-center text-[11px]">
              <span class="text-slate-400">요청자: {{ item.requester }}</span>
              <span class="text-slate-400">{{ item.time }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="p-3 border-t border-slate-100 bg-white flex-shrink-0">
      <button
          @click="goToAllNotifications"
          class="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all group"
      >
        전체 알림 보기
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>
    </div>

  </div>

  <Teleport to="body">
    <div v-if="isModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="closeModal"></div>

      <div class="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-[400px] overflow-hidden animate-fade-in-down">
        <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 class="font-bold text-slate-800 text-lg">{{ selectedNotification?.title }}</h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="p-6 space-y-6">
          <div class="bg-blue-50 border border-blue-100 p-4 rounded-xl">
            <p class="text-blue-700 font-bold text-base mb-1">{{ selectedNotification?.date }}</p>
            <p class="text-slate-600 text-sm">{{ selectedNotification?.type }}에 참여 요청이 있습니다.</p>
          </div>

          <div class="space-y-4 pt-2">
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-500">지원자</span>
              <span class="font-medium text-slate-800">{{ selectedNotification?.applicant }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-500">장소</span>
              <span class="font-medium text-slate-800">{{ selectedNotification?.location }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-500">요청자</span>
              <span class="font-medium text-slate-800">{{ selectedNotification?.requester }}</span>
            </div>
          </div>
        </div>

        <div class="p-4 px-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
              @click="handleDecision('reject')"
              class="flex-1 py-2.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-bold transition-all"
          >
            거절하기
          </button>
          <button
              @click="handleDecision('accept')"
              class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all"
          >
            수락하기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
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
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>