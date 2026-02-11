<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { signup } = useAuth()

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
    // 2. 서버에 회원가입 요청 (useAuth 활용)
    // 만약 아직 백엔드 연결 전이라면 이 줄을 주석 처리하고 테스트하세요.
    await signup(email.value, password.value, nickname.value)

    // 3.  가입 성공 시 축하 화면으로 이동
    // router/index.js에 설정한 name: 'SignupSuccess'와 일치해야 합니다.
    router.push({
      name: 'SignupSuccess',
      query: { name: nickname.value } // 축하 페이지에 이름 전달
    })
  } catch (e) {
    // 에러 발생 시 메시지 표시
    error.value = e.response?.data?.message || '회원가입에 실패했습니다. 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen px-4 bg-slate-50">
    <div class="text-center mb-8">
      <h1 class="text-4xl font-extrabold text-slate-900 tracking-tight">
        <span class="text-brand-600">Cal</span>Fit
      </h1>
      <p class="mt-3 text-base font-medium text-slate-600">
        복잡한 채용 일정, CalFit으로 간편하게
      </p>
    </div>

    <div class="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      <div class="px-8 py-10">
        <h2 class="text-2xl font-black text-slate-900 text-center mb-8">회원가입</h2>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div>
            <label for="nickname" class="block text-sm font-bold text-slate-900 mb-1.5">이름</label>
            <input
                id="nickname"
                v-model="nickname"
                type="text"
                required
                class="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                placeholder="김철수"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-bold text-slate-900 mb-1.5">이메일</label>
            <input
                id="email"
                v-model="email"
                type="email"
                required
                class="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                placeholder="name@company.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-bold text-slate-900 mb-1.5">비밀번호</label>
            <input
                id="password"
                v-model="password"
                type="password"
                required
                class="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                placeholder="••••••••"
            />
          </div>

          <div>
            <label for="passwordConfirm" class="block text-sm font-bold text-slate-900 mb-1.5">비밀번호 확인</label>
            <input
                id="passwordConfirm"
                v-model="passwordConfirm"
                type="password"
                required
                class="mt-1 block w-full px-4 py-3 border border-slate-300 rounded-xl shadow-sm text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                placeholder="••••••••"
            />
          </div>

          <div v-if="error" class="text-sm text-red-700 font-bold text-center bg-red-50 py-3 rounded-xl border border-red-200">
            {{ error }}
          </div>

          <button
              type="submit"
              :disabled="loading"
              class="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-lg text-base font-black text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <span v-if="loading" class="flex items-center">
              <svg class="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              가입 중...
            </span>
            <span v-else>회원가입 완료</span>
          </button>
        </form>
      </div>

      <div class="px-8 py-5 bg-slate-100 border-t border-slate-200 text-center">
        <p class="text-sm font-bold text-slate-600">
          이미 계정이 있으신가요?
          <button @click="router.push('/login')" class="font-black text-brand-600 hover:text-brand-700 hover:underline ml-1">
            로그인하기
          </button>
        </p>
      </div>
    </div>
  </div>
</template>