<template>
  <div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">

    <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
      <div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/5 rounded-full blur-[100px] animate-pulse-slow"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-600/5 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>
    </div>

    <div class="relative z-10 w-full max-w-lg">
      <div class="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-xl animate-float">

        <div class="absolute top-6 left-6">
          <button @click="$router.push('/login')" class="flex items-center text-slate-400 hover:text-brand-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span class="text-sm font-medium">뒤로가기</span>
          </button>
        </div>

        <div class="flex justify-center mt-12 mb-8">
          <div class="relative">
            <div class="absolute inset-0 bg-brand-400 blur-xl opacity-20 rounded-full animate-pulse"></div>
            <div class="relative bg-white rounded-full p-1 w-16 h-16 flex items-center justify-center shadow-lg">
              <div class="w-full h-full bg-brand-500 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <h1 class="text-3xl font-bold text-center text-slate-900 mb-8 leading-tight">
          <span class="text-brand-600">{{ userName }}</span>님, 회원 가입이<br/>완료되었습니다!
        </h1>

        <div class="bg-slate-50 border border-slate-100 rounded-2xl p-6 mb-6 text-center hover:border-brand-500/30 transition-all duration-300 group">
          <h2 class="text-lg font-bold text-slate-800 mb-2">우리 팀의 워크스페이스를 시작해볼까요?</h2>
          <p class="text-slate-500 text-sm mb-6 leading-relaxed">
            워크스페이스를 직접 운영할 공간을 만들고, 팀원을 초대해 함께 관리하세요.<br/>
            팀 리더에게 추천합니다.
          </p>
          <button @click="createWorkspace" class="w-full py-3.5 px-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold shadow-lg shadow-brand-200 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2">
            새 워크스페이스 만들기
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>

        <div class="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-start text-left">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <div class="flex-1">
            <h3 class="text-amber-700 font-bold text-sm mb-1">워크스페이스 초대 알림을 기다리는 중이신가요?</h3>
            <p class="text-slate-500 text-xs leading-relaxed">
              팀 관리자에게 초대를 요청해 보세요. 초대 링크가 있다면 링크로도 참여가 가능합니다.
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

const userName = ref(route.query.name || '회원');

const createWorkspace = () => {
  router.push('/workspace/create');
};
</script>