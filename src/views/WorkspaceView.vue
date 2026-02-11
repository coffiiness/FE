<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const handleCreateWorkspace = () => {
  // TODO: 여기에 실제 워크스페이스 생성 API 호출 로직을 넣으세요.
  console.log('워크스페이스 생성 요청');

  // 로직 처리 후 이동 (예: 대시보드로)
  router.push('/dashboard');
};
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans selection:bg-brand-400/30">

    <div class="absolute top-1/4 left-1/4 w-64 h-64 bg-brand-400/20 rounded-full blur-[120px]" />
    <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-400/10 rounded-full blur-[100px]" />

    <div class="relative w-full max-w-md bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all">

      <div class="flex items-center justify-between mb-8">
        <button @click="router.back()" class="flex items-center text-slate-400 hover:text-brand-600 transition-colors group">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="text-sm font-medium">뒤로 가기</span>
        </button>

        <div class="flex gap-4">
          <button class="text-slate-300 hover:text-slate-500 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          <div class="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[11px] text-white font-bold shadow-lg">
            김
          </div>
        </div>
      </div>

      <div class="text-center mb-10">
        <h1 class="text-2xl font-bold text-slate-900 mb-2 tracking-tight">
          팀의 워크스페이스를<br />만들어 볼까요?
        </h1>
        <div class="h-1.5 w-10 bg-brand-500 mx-auto rounded-full" />
      </div>

      <form @submit.prevent="handleCreateWorkspace" class="space-y-6">
        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-700 ml-1">회사명 또는 팀명</label>
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <input type="text" placeholder="회사명 또는 팀명" class="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all" />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-semibold text-slate-700 ml-1">담당자 연락처</label>
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-brand-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <input type="text" placeholder="010-0000-0000" class="w-full bg-white border border-slate-200 rounded-xl py-3 pl-10 pr-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="text-sm font-semibold text-slate-700 ml-1">직원 수</label>
            <select class="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-brand-500 cursor-pointer">
              <option>1-10명</option>
              <option>11-50명</option>
              <option>50명 이상</option>
            </select>
          </div>
          <div class="space-y-2">
            <label class="text-sm font-semibold text-slate-700 ml-1">현재 역할</label>
            <select class="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-slate-900 focus:outline-none focus:border-brand-500 cursor-pointer">
              <option>인사 담당자</option>
              <option>면접 담당자</option>
              <option>지원자</option>
            </select>
          </div>
        </div>

        <button type="submit" class="w-full mt-4 bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-600/20 transition-all active:scale-[0.98]">
          Calfit 시작하기
        </button>
      </form>
    </div>
  </div>
</template>