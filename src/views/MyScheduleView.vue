<script setup>
import { ref } from 'vue'
import ScheduleCreateModal from '@/components/schedule/ScheduleCreateModal.vue' // 아까 만든 모달 import

// --- 1. 모달 및 일정 생성 로직 ---
const isModalOpen = ref(false)
const selectedDate = ref('')

const openCreateModal = (date) => {
  selectedDate.value = date
  isModalOpen.value = true
}

const handleSave = (newSchedule) => {
  console.log('새 일정 저장:', newSchedule)
  // 여기에 API 호출 로직 추가 (POST /schedules)
  isModalOpen.value = false
}

// --- 2. 캘린더 데이터 (더미) ---
// 실제로는 date-fns 등으로 계산하지만, UI 예시를 위해 배열로 생성
const calendarDays = Array.from({ length: 35 }, (_, i) => {
  const day = i - 3 // 2월 1일이 목요일(index 4)이라고 가정하고 앞뒤 맞춤
  const isCurrentMonth = day > 0 && day <= 29
  return {
    date: `2024-02-${day < 10 ? '0' + day : day}`,
    dayDisplay: day > 0 && day <= 29 ? day : '', // 날짜 숫자
    isCurrentMonth,
    events: day === 7 ? [ // 예시: 7일에만 일정 있음
      { id: 1, title: '기술 면접', time: '13:00', type: 'interview' },
      { id: 2, title: '대기중', time: '15:00', type: 'pending' }
    ] : []
  }
})

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const currentMonth = "February 2024"

// --- 3. 우측 사이드바 데이터 ---
const events = ref([
  { id: 1, date: '2024-02-07', title: '기술 면접: 박지원', type: 'interview', status: 'upcoming' },
  { id: 2, title: '최종 면접: 김인사', type: 'interview', status: 'pending' },
  { id: 3, title: '팀 미팅: 채용 전략', type: 'meeting', status: 'completed' },
])
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-8 font-sans text-slate-600">
    <header class="flex justify-between items-center mb-10">
      <div>
        <h1 class="text-4xl font-display font-bold text-slate-900 tracking-tight">내 일정</h1>
        <p class="text-slate-500 mt-1">오늘의 인터뷰와 회의 일정을 확인하세요.</p>
      </div>
      <div class="flex gap-3">
        <button class="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-all shadow-sm">
          오늘로 이동
        </button>
        <button
            @click="openCreateModal('2024-02-14')"
            class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center"
        >
          <svg class="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          일정 생성
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">

      <div class="lg:col-span-3 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 class="text-xl font-display font-bold text-slate-800">{{ currentMonth }}</h2>
          <div class="flex gap-4">
            <button class="p-2 text-slate-400 hover:text-indigo-600 transition-colors">&lt;</button>
            <button class="p-2 text-slate-400 hover:text-indigo-600 transition-colors">&gt;</button>
          </div>
        </div>

        <div class="grid grid-cols-7 text-center border-b border-slate-50 bg-slate-50/50">
          <div v-for="day in days" :key="day" class="py-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            {{ day }}
          </div>
        </div>

        <div class="grid grid-cols-7 grid-rows-5 flex-1 bg-white min-h-[600px]">
          <div
              v-for="(cell, index) in calendarDays"
              :key="index"
              class="border-r border-b border-slate-100 p-3 transition-all hover:bg-slate-50/50 relative group"
              :class="{'bg-slate-50/30': !cell.isCurrentMonth}"
              @click="cell.isCurrentMonth && openCreateModal(cell.date)"
          >
            <span :class="[
              'text-sm font-semibold',
              cell.dayDisplay === 7 ? 'text-indigo-600' : 'text-slate-400', // 예시: 오늘 날짜 강조
              !cell.isCurrentMonth && 'opacity-0' // 이번 달 아니면 날짜 숨김 (선택사항)
            ]">
              {{ cell.dayDisplay }}
            </span>

            <div v-if="cell.events.length" class="mt-2 space-y-1">
              <div v-for="evt in cell.events" :key="evt.id"
                   :class="[
                     'text-[10px] p-1.5 border rounded-md font-medium truncate',
                     evt.type === 'interview' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-amber-50 border-amber-100 text-amber-600'
                   ]">
                {{ evt.time }} {{ evt.title }}
              </div>
            </div>

            <button
                v-if="cell.isCurrentMonth"
                @click.stop="openCreateModal(cell.date)"
                class="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-sm hover:bg-indigo-600 hover:text-white z-10"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>

          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <h3 class="text-lg font-display font-bold text-slate-800 mb-4">다가오는 면접</h3>
          <div class="space-y-4">
            <div v-for="event in events" :key="event.id"
                 class="group p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-white transition-all cursor-pointer shadow-sm hover:shadow-md">
              <div class="flex justify-between items-start mb-2">
                <span class="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-bold uppercase">
                  {{ event.type }}
                </span>
                <span class="text-[10px] text-slate-400 font-medium">Feb 07</span>
              </div>
              <h4 class="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{{ event.title }}</h4>
              <p class="text-xs text-slate-500 mt-1">오후 1:00 - 2:30</p>
            </div>
          </div>
        </div>

        <div class="bg-indigo-600 border border-indigo-700 p-6 rounded-3xl relative overflow-hidden shadow-lg">
          <div class="relative z-10">
            <h3 class="text-sm font-bold text-indigo-100 uppercase tracking-tight">Today's Focus</h3>
            <p class="text-2xl font-display font-bold text-white mt-2">3건의 인터뷰</p>
            <p class="text-xs text-indigo-100/80 mt-1">모든 일정을 수락하셨습니다.</p>
          </div>
          <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 blur-2xl rounded-full"></div>
        </div>
      </div>
    </div>

    <ScheduleCreateModal
        :isOpen="isModalOpen"
        :selectedDate="selectedDate"
        @close="isModalOpen = false"
        @save="handleSave"
    />
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');

.font-display {
  font-family: 'Outfit', sans-serif;
}
</style>