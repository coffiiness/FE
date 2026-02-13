<script setup>
import { ref, computed } from 'vue'

const activeTab = ref('all')

const notifications = ref([
  {
    id: 1,
    category: 'request',
    dateMonth: 'FEB',
    dateDay: '07',
    title: '면접 일정 확인 요청',
    desc: '2024.02.07 (수) 13:00 - 14:30 기술 면접에 참여 요청이 있습니다.',
    meta: '지원자: 박지원 · 장소: 5층 대회의실 A',
    requester: '김인사',
    time: '10분 전'
  },
  {
    id: 2,
    category: 'alert',
    status: 'success',
    title: '일정이 수락되었습니다',
    desc: '이팀장님이 2024.02.06 (화) 10:00 면접 일정을 수락했습니다.',
    time: '어제'
  },
  {
    id: 3,
    category: 'alert',
    status: 'fail',
    title: '일정이 거절되었습니다',
    desc: '박시니어님이 면접 일정을 거절했습니다.',
    reason: '사유: 다른 미팅이 있습니다.',
    time: '어제'
  }
])

const notificationCount = computed(() =>
    notifications.value.filter(n => n.category === 'request').length
)

const filteredList = computed(() => {
  if (activeTab.value === 'request') {
    return notifications.value.filter(n => n.category === 'request')
  }
  return notifications.value
})
</script>

<template>
  <div class="max-w-4xl mx-auto p-6 bg-white min-h-screen">
    <h1 class="text-2xl font-bold mb-6 text-slate-900">알림</h1>

    <div class="flex border-b border-gray-200 mb-6">

      <button
          @click="activeTab = 'all'"
          class="px-6 py-3 border-b-2 font-medium transition-colors"
          :class="activeTab === 'all' ? 'border-slate-800 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-700'"
      >
        전체 알림
      </button>

      <button
          @click="activeTab = 'request'"
          class="px-6 py-3 border-b-2 font-medium transition-colors"
          :class="activeTab === 'request' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
      >
        일정 요청
        <span
            class="ml-1 px-2 py-0.5 rounded-full text-xs"
            :class="activeTab === 'request' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'"
        >
          {{ notificationCount }}
        </span>
      </button>
    </div>

    <div class="space-y-4">

      <template v-for="item in filteredList" :key="item.id">

        <div v-if="item.category === 'request'" class="p-5 bg-blue-50 border border-blue-100 rounded-xl flex justify-between items-start">
          <div class="flex gap-4">
            <div class="p-2 bg-white rounded-lg shadow-sm w-12 h-12 flex flex-col items-center justify-center text-blue-600 border border-blue-100 leading-tight text-center">
              <span class="text-[10px] font-bold uppercase">{{ item.dateMonth }}</span>
              <span class="text-lg font-bold">{{ item.dateDay }}</span>
            </div>
            <div>
              <h3 class="font-bold text-gray-900">{{ item.title }}</h3>
              <p class="text-sm text-gray-600 mt-1">{{ item.desc }}</p>
              <p class="text-sm text-gray-500">{{ item.meta }}</p>
              <div class="flex items-center mt-2 text-xs text-gray-400">
                <span>요청자: {{ item.requester }}</span><span class="mx-2">·</span><span>{{ item.time }}</span>
              </div>
            </div>
          </div>
          <div class="flex gap-2 shrink-0">
            <button class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">거절</button>
            <button class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">수락</button>
          </div>
        </div>

        <div v-else class="p-5 border border-gray-100 rounded-xl flex gap-4">
          <div
              class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              :class="item.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
          >
            <svg v-if="item.status === 'success'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </div>

          <div>
            <h3 class="font-bold text-gray-900">{{ item.title }}</h3>
            <p class="text-sm text-gray-600 mt-1" v-html="item.desc"></p>
            <p v-if="item.reason" class="text-xs text-gray-500 mt-1 italic">{{ item.reason }}</p>
            <div class="flex items-center mt-2 text-xs text-gray-400">
              <span>{{ item.time }}</span><span class="mx-2">·</span>
              <button class="text-blue-600 hover:underline">
                {{ item.status === 'success' ? '일정 보기' : '다시 요청하기' }}
              </button>
            </div>
          </div>
        </div>

      </template>

      <div v-if="filteredList.length === 0" class="text-center py-10 text-gray-400">
        표시할 알림이 없습니다.
      </div>

    </div>
  </div>
</template>