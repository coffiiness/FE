<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { signup, login } = useAuth()

// 폼 입력 데이터 반응형 변수
const nickname = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const error = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  error.value = ''

  // 1. 비밀번호 일치 확인
  if (password.value !== passwordConfirm.value) {
    error.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  loading.value = true

  try {
    await signup(email.value, password.value, nickname.value)
    await login(email.value, password.value)

    router.push({
      name: 'SignupSuccess',
      query: { name: nickname.value }
    })
  } catch (e) {
    error.value = e.response?.data?.error?.message || '회원가입에 실패했습니다. 다시 시도해주세요.'
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
                Join the <br/> <span class="text-brand-400">Revolution.</span>
            </h1>
            <p class="text-lg text-slate-300 max-w-md mx-auto leading-relaxed">
                복잡한 채용 일정, CalFit으로 간편하게 시작하세요.
            </p>
            
            <!-- Illustration Placeholder (CSS-only minimal graphic) -->
             <div class="mt-12 flex justify-center">
                 <div class="relative w-48 h-48">
                    <div class="absolute inset-0 bg-brand-500 rounded-full opacity-20 animate-ping"></div>
                    <div class="absolute inset-0 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full shadow-2xl flex items-center justify-center">
                        <span class="text-6xl">🚀</span>
                    </div>
                 </div>
            </div>
        </div>
    </div>

    <!-- Right Section: Signup Form -->
    <div class="flex flex-1 flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-white">
      <div class="mx-auto w-full max-w-sm lg:w-96">
        
        <div class="mb-10">
           <h2 class="text-3xl font-bold tracking-tight text-slate-900">
             계정 만들기
           </h2>
           <p class="mt-2 text-sm text-slate-500">
             30일 무료 체험을 시작하세요. 언제든 취소 가능합니다.
           </p>
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label for="nickname" class="block text-sm font-semibold text-slate-700">이름</label>
            <div class="mt-1">
              <input
                id="nickname"
                v-model="nickname"
                type="text"
                required
                class="block w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-sm transition-all"
                placeholder="홍길동"
              />
            </div>
          </div>

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

          <div>
            <label for="passwordConfirm" class="block text-sm font-semibold text-slate-700">비밀번호 확인</label>
            <div class="mt-1">
              <input
                id="passwordConfirm"
                v-model="passwordConfirm"
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
                  가입 중...
                </span>
                <span v-else>회원가입 완료</span>
            </button>
          </div>
        </form>

        <div class="mt-8 text-center">
            <p class="text-sm text-slate-500">
                이미 계정이 있으신가요? 
                <button @click="router.push('/login')" class="font-semibold text-brand-600 hover:text-brand-500 hover:underline">
                    로그인하기
                </button>
            </p>
        </div>

      </div>
    </div>
  </div>
</template>