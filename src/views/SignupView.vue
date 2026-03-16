<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import AuthShell from '@/components/auth/AuthShell.vue'

const route = useRoute()
const router = useRouter()
const { signup, login } = useAuth()

// 폼 입력 데이터 반응형 변수
const nickname = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const error = ref('')
const loading = ref(false)

const goToLogin = () => {
  router.push({
    path: '/login',
    query: route.query.redirect ? { redirect: route.query.redirect } : {}
  })
}

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

    const redirectPath = route.query.redirect
    if (redirectPath) {
      router.push(redirectPath)
    } else {
      router.push({
        name: 'SignupSuccess',
        query: { name: nickname.value }
      })
    }
  } catch (e) {
    error.value = e.response?.data?.error?.message || '회원가입에 실패했습니다. 다시 시도해주세요.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell
    eyebrow="Create your account"
    title="회원가입"
    description="조직 계정을 만들고 자동화된 채용 운영을 시작하세요."
  >
    <form class="space-y-5" @submit.prevent="handleSubmit">
      <label class="block">
        <span class="mb-2 block text-sm font-bold text-slate-800">이름</span>
        <input
          id="nickname"
          v-model="nickname"
          type="text"
          required
          class="auth-input"
          placeholder="홍길동"
        />
      </label>

      <label class="block">
        <span class="mb-2 block text-sm font-bold text-slate-800">이메일</span>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          class="auth-input"
          placeholder="name@company.com"
        />
      </label>

      <label class="block">
        <span class="mb-2 block text-sm font-bold text-slate-800">비밀번호</span>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          class="auth-input"
          placeholder="••••••••"
        />
      </label>

      <label class="block">
        <span class="mb-2 block text-sm font-bold text-slate-800">비밀번호 확인</span>
        <input
          id="passwordConfirm"
          v-model="passwordConfirm"
          type="password"
          required
          class="auth-input"
          placeholder="••••••••"
        />
      </label>

      <div v-if="error" class="auth-error">
        {{ error }}
      </div>

      <button
        type="submit"
        :disabled="loading"
        class="auth-submit"
      >
        <span v-if="loading" class="inline-flex items-center justify-center gap-2">
          <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          가입 중...
        </span>
        <span v-else>회원가입 완료</span>
      </button>
    </form>

    <template #footer>
      <span>이미 계정이 있으신가요?</span>
      <button type="button" class="auth-footer-link" @click="goToLogin">
        로그인하기
      </button>
    </template>
  </AuthShell>
</template>

<style scoped>
.auth-input {
  width: 100%;
  height: 3.9rem;
  padding: 0 1rem;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 0.95rem;
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
  font-size: 1.03rem;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease;
}

.auth-input::placeholder {
  color: #94a3b8;
}

.auth-input:focus {
  outline: none;
  border-color: rgba(13, 148, 136, 0.42);
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.12);
  background: #ffffff;
}

.auth-error {
  padding: 0.95rem 1rem;
  border: 1px solid rgba(248, 113, 113, 0.18);
  border-radius: 0.95rem;
  background: #fff4f4;
  color: #c2410c;
  font-size: 0.93rem;
  font-weight: 600;
}

.auth-submit {
  width: 100%;
  height: 3.95rem;
  border: 0;
  border-radius: 1rem;
  background: linear-gradient(180deg, rgba(20, 184, 166, 0.98), rgba(13, 148, 136, 0.98));
  color: #ffffff;
  font-size: 1.05rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  box-shadow: 0 18px 40px rgba(13, 148, 136, 0.22);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    opacity 160ms ease;
}

.auth-submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 22px 42px rgba(13, 148, 136, 0.28);
}

.auth-submit:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.auth-footer-link {
  border: 0;
  background: transparent;
  color: #0f766e;
  font-weight: 700;
}

.auth-footer-link:hover {
  text-decoration: underline;
}

@media (max-width: 767px) {
  .auth-input,
  .auth-submit {
    height: 3.55rem;
  }
}
</style>
