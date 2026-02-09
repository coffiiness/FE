<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { signup } = useAuth()

const nickname = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const error = ref('')
const loading = ref(false)

const handleSubmit = async () => {
  error.value = ''

  if (password.value !== passwordConfirm.value) {
    error.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  loading.value = true

  try {
    await signup(email.value, password.value, nickname.value)
    router.push('/login')
  } catch (e) {
    error.value = e.response?.data?.message || '회원가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
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
        복잡한 채용 일정, CalFit으로 간편하게
      </p>
    </div>

    <!-- Signup Card -->
    <div class="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
      <div class="px-8 py-8">
        <h2 class="text-xl font-bold text-slate-800 text-center mb-6">회원가입</h2>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label for="nickname" class="block text-sm font-medium text-slate-700">이름</label>
            <input
              id="nickname"
              v-model="nickname"
              type="text"
              required
              class="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm transition-colors"
              placeholder="김철수"
            />
          </div>

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

          <div>
            <label for="passwordConfirm" class="block text-sm font-medium text-slate-700">비밀번호 확인</label>
            <input
              id="passwordConfirm"
              v-model="passwordConfirm"
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
              가입 중...
            </span>
            <span v-else>회원가입</span>
          </button>
        </form>
      </div>

      <div class="px-8 py-4 bg-slate-50 border-t border-slate-100 text-center">
        <p class="text-sm text-slate-500">
          이미 계정이 있으신가요?
          <button @click="router.push('/login')" class="font-medium text-brand-600 hover:text-brand-500 hover:underline">
            로그인
          </button>
        </p>
      </div>
    </div>
  </div>
</template>
