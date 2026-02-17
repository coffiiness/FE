<template>
  <div class="flex min-h-screen bg-white">
    <!-- Left Section: Celebration Visual & Branding -->
    <div class="hidden lg:flex lg:w-1/2 bg-slate-900 relative justify-center items-center overflow-hidden">
        <!-- Background Pattern/Gradient -->
        <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950 opacity-90 z-0"></div>
        <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0"></div>
        
        <!-- Decorative Shapes (Confetti vibe) -->
        <div class="absolute top-1/4 right-1/4 w-72 h-72 bg-brand-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute bottom-1/3 left-1/4 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl"></div>

        <!-- Content -->
        <div class="relative z-10 text-center px-10">
            <h1 class="text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                Welcome <br/> <span class="text-brand-400">Aboard!</span>
            </h1>
            <p class="text-lg text-slate-300 max-w-md mx-auto leading-relaxed">
                CalFit과 함께 채용의 새로운 여정을 시작할 준비가 되셨나요?
            </p>
            
            <!-- Illustration Placeholder -->
            <div class="mt-12 flex justify-center">
                 <div class="relative w-48 h-48">
                    <!-- Glowing Background -->
                    <div class="absolute inset-0 bg-brand-500 rounded-full opacity-30 animate-ping"></div>
                    
                    <!-- Main Icon Circle -->
                    <div class="absolute inset-0 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full shadow-2xl flex items-center justify-center">
                        <span class="text-7xl">🎉</span>
                    </div>

                    <!-- Floating Elements -->
                    <div class="absolute -top-6 -right-2 w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl rotate-12 flex items-center justify-center border border-white/10 animate-bounce delay-100">
                         <span class="text-3xl">🚀</span>
                    </div>
                    <div class="absolute -bottom-2 -left-6 w-14 h-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10 animate-bounce delay-700">
                         <span class="text-2xl">✨</span>
                    </div>
                 </div>
            </div>
        </div>
    </div>

    <!-- Right Section: Success Message & Actions -->
    <div class="flex flex-1 flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
      <div class="mx-auto w-full max-w-md">
        
        <!-- Mobile Header (Only visible on small screens) -->
        <div class="lg:hidden text-center mb-8">
             <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-100 mb-4">
                <span class="text-4xl">🎉</span>
             </div>
             <h2 class="text-3xl font-extrabold text-slate-900">환영합니다!</h2>
        </div>

        <div class="text-center lg:text-left mb-10">
           <h2 class="text-3xl font-bold tracking-tight text-slate-900 mb-4">
             회원가입이 완료되었습니다!
           </h2>
           <p class="text-lg text-slate-600">
             반갑습니다, <span class="font-bold text-brand-600">{{ userName }}</span>님.<br>
             이제 팀을 위한 워크스페이스를 만들어보세요.
           </p>
        </div>

        <div class="space-y-6">
          <!-- Main Action Card -->
          <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 hover:border-brand-500/50 hover:shadow-md transition-all duration-300 group cursor-pointer" @click="createWorkspace">
            <div class="flex items-start">
                <div class="flex-shrink-0">
                    <div class="w-10 h-10 rounded-lg bg-brand-100 flex items-center justify-center text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                </div>
                <div class="ml-4 flex-1">
                    <h3 class="text-lg font-bold text-slate-900 group-hover:text-brand-700 transition-colors">워크스페이스 생성하기</h3>
                    <p class="mt-1 text-sm text-slate-500">
                        팀원들을 초대하고 채용 프로세스를 관리할 수 있는 공간을 만듭니다. (팀 리더 추천)
                    </p>
                </div>
                <div class="ml-2 flex-shrink-0 self-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-400 group-hover:text-brand-500 transform group-hover:translate-x-1 transition-all" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                    </svg>
                </div>
            </div>
          </div>

          <!-- Secondary Info -->
          <div class="bg-amber-50 border border-amber-100 rounded-xl p-5 flex items-start">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
             </svg>
             <div>
                <h4 class="text-sm font-bold text-amber-800">초대 메일을 기다리고 계신가요?</h4>
                <p class="mt-1 text-xs text-amber-700/80 leading-relaxed">
                   팀 관리자에게 초대를 요청하셨다면 이메일을 확인해주세요. 초대 링크를 통해 바로 워크스페이스에 참여할 수 있습니다.
                </p>
             </div>
          </div>
        </div>

        <div class="mt-10 border-t border-slate-100 pt-6 text-center lg:text-left">
            <button @click="$router.push('/login')" class="text-sm font-semibold text-slate-500 hover:text-brand-600 hover:underline transition-colors flex items-center justify-center lg:justify-start gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                로그인 화면으로 돌아가기
            </button>
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