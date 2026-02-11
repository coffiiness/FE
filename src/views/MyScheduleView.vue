<script setup>
import { ref } from 'vue'

const events = ref([
  { id: 1, date: '2024-02-07', title: '기술 면접: 박지원', type: 'interview', status: 'upcoming' },
  { id: 2, date: '2024-02-07', title: '최종 면접: 김인사', type: 'interview', status: 'pending' },
  { id: 3, date: '2024-02-09', title: '팀 미팅: 채용 전략', type: 'meeting', status: 'completed' },
])

const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const currentMonth = "February 2024"
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
        <button class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all">
          + 일정 생성
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <div class="lg:col-span-3 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
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

        <div class="grid grid-cols-7 grid-rows-5 h-[600px] bg-white">
          <div v-for="i in 35" :key="i"
               class="border-r border-b border-slate-100 p-3 transition-all hover:bg-slate-50/50 relative group">
            <span :class="[
              'text-sm font-semibold',
              i === 7 ? 'text-indigo-600' : 'text-slate-400'
            ]">{{ i }}</span>

            <div v-if="i === 7" class="mt-2 space-y-1">
              <div class="text-[10px] p-1.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-md font-medium">
                13:00 기술 면접
              </div>
              <div class="text-[10px] p-1.5 bg-amber-50 border border-amber-100 text-amber-600 rounded-md font-medium">
                15:00 대기중
              </div>
            </div>
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
                <span class="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-bold">
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
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');

.font-display {
  font-family: 'Outfit', sans-serif;
}
</style>