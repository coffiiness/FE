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
    error.value = e.response?.data?.message || '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

const handleSocialLogin = (provider) => {
  window.location.href = `http://localhost:8080/api/v1/oauth2/authorization/${provider}`
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen px-4 bg-gray-50">
    <!-- Brand Header -->
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-slate-900 tracking-tight">
        <span class="text-brand-500">Cal</span>Fit
      </h1>
      <p class="mt-2 text-sm text-slate-500">
        면접관의 시간과 회의실 예약까지 알아서 조율하는,<br>가장 똑똑한 자동화 채용 파트너
      </p>
    </div>

    <!-- Login Card -->
    <div class="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
      <div class="px-8 py-8">
        <h2 class="text-xl font-bold text-slate-800 text-center mb-6">로그인</h2>

        <form class="space-y-5" @submit.prevent="handleLogin">
          <div>
            <label for="email" class="block text-sm font-medium text-slate-700">이메일</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-colors"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700">비밀번호</label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div v-if="error" class="text-sm text-red-600 text-center bg-red-50 py-2 rounded-lg border border-red-100">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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
        </form>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white text-slate-500">또는</span>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-2 gap-3">
            <button
              @click="handleSocialLogin('google')"
              class="w-full flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg shadow-sm bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .533 5.333.533 12S5.867 24 12.48 24c3.44 0 6.04-1.133 8.147-3.267 2.173-2.187 2.813-5.24 2.813-7.667 0-.76-.053-1.467-.173-2.147H12.48z"/>
              </svg>
              Google
            </button>
            <button
              @click="handleSocialLogin('kakao')"
              class="w-full flex items-center justify-center px-4 py-2 border border-[#FEE500] rounded-lg shadow-sm bg-[#FEE500] text-sm font-medium text-black hover:bg-[#FDD835] transition-colors"
            >
              <svg class="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-4.97 0-9 3.185-9 7.115 0 2.557 1.707 4.8 4.27 6.054-.188.702-.682 2.545-.78 2.94-.122.49.178.483.376.351.155-.102 2.466-1.675 3.464-2.353.541.08 1.1.123 1.67.123 4.97 0 9-3.185 9-7.115S16.97 3 12 3z"/>
              </svg>
              Kakao
            </button>
          </div>
        </div>
      </div>
      
      <div class="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
        <p class="text-sm text-slate-500">
          계정이 없으신가요?
          <button @click="router.push('/signup')" class="font-medium text-brand-600 hover:text-brand-500 hover:underline">
            회원가입
          </button>
        </p>
      </div>
    </div>
  </div>
</template>
