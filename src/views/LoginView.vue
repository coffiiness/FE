<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    await login(email.value, password.value)
    router.push('/dashboard')
  } catch (e) {
    error.value = e.response?.data?.error?.message || '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen bg-white">
    <!-- Left Section: Stylish Background & Branding -->
    <div class="hidden lg:flex lg:w-1/2 bg-slate-900 relative justify-center items-center overflow-hidden">
        <!-- Background Pattern/Gradient -->
        <div class="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-900 to-brand-950 opacity-90 z-0"></div>
        <div class="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 z-0"></div>
        
        <!-- Decorative Shapes -->
        <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-brand-500/10 rounded-full blur-3xl"></div>

        <!-- Content -->
        <div class="relative z-10 text-center px-10">
            <h1 class="text-5xl font-extrabold text-white mb-6 tracking-tight leading-tight">
                Recruiting <br/> <span class="text-brand-400">Simplified.</span>
            </h1>
            <p class="text-lg text-slate-300 max-w-md mx-auto leading-relaxed">
                면접관의 시간과 회의실 예약까지 알아서 조율하는,<br>가장 똑똑한 자동화 채용 파트너V
            </p>
            
            <!-- Illustration Placeholder (CSS-only minimal graphic) -->
            <div class="mt-12 flex justify-center">
                 <div class="relative w-48 h-48">
                    <div class="absolute inset-0 bg-brand-500 rounded-2xl rotate-6 opacity-20"></div>
                    <div class="absolute inset-0 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl shadow-2xl flex items-center justify-center">
                        <span class="text-6xl">📅</span>
                    </div>
                    <!-- Orbiting element -->
                    <div class="absolute -top-4 -right-4 w-16 h-16 bg-brand-500 rounded-xl rotate-12 flex items-center justify-center shadow-lg animate-bounce">
                         <span class="text-2xl">✨</span>
                    </div>
                 </div>
            </div>
        </div>
    </div>

    <!-- Right Section: Login Form -->
    <div class="flex flex-1 flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
      <div class="mx-auto w-full max-w-sm lg:w-96">
        
        <!-- Logo on Mobile (visible only on small screens if needed, but here usually at top of form) -->
        <div class="mb-10">
           <h2 class="text-3xl font-bold tracking-tight text-slate-900">
             <span class="text-brand-600">Cal</span>Fit
           </h2>
           <p class="mt-2 text-sm text-slate-500">
             돌아오신 것을 환영합니다! 계정 정보를 입력해주세요.
           </p>
        </div>

        <form class="space-y-6" @submit.prevent="handleLogin">
          <div>
            <label for="email" class="block text-sm font-semibold text-slate-700">이메일</label>
            <div class="mt-1">
              <input
                id="email"
                v-model="email"
                type="email"
                required
                class="block w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-sm transition-all"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-semibold text-slate-700">비밀번호</label>
            <div class="mt-1">
              <input
                id="password"
                v-model="password"
                type="password"
                required
                class="block w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-sm transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div v-if="error" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md border border-red-100">
            {{ error }}
          </div>

          <div>
            <button
              type="submit"
              :disabled="loading"
              class="flex w-full justify-center rounded-lg border border-transparent bg-brand-600 py-3 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
            >
               <span v-if="loading" class="flex items-center">
                  <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  로그인 중...
                </span>
                <span v-else>로그인</span>
            </button>
          </div>
        </form>

        <div class="mt-8 text-center">
            <p class="text-sm text-slate-500">
                계정이 없으신가요? 
                <button @click="router.push('/signup')" class="font-semibold text-brand-600 hover:text-brand-500 hover:underline">
                    무료로 회원가입하기
                </button>
            </p>
        </div>

      </div>
    </div>
  </div>
</template>