<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const route = useRoute()
const router = useRouter()
const { login } = useAuth()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const goToSignup = () => {
  router.push({
    path: '/signup',
    query: route.query.redirect ? { redirect: route.query.redirect } : {}
  })
}

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    const data = await login(email.value, password.value)
    const redirectPath = route.query.redirect
    if (redirectPath) {
      router.push(redirectPath)
    } else if (data.user.role === 'ADMIN') {
      router.push('/admin/dashboard')
    } else if (!data.workspaceId) {
      router.push('/workspace/create')
    } else {
      router.push('/dashboard')
    }
  } catch (e) {
    error.value = e.response?.data?.error?.message || '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

const handleQuickLogin = async (nextEmail, nextPassword) => {
  email.value = nextEmail
  password.value = nextPassword
  await handleLogin()
}
</script>

<template>
  <div class="login-shell">
    <div class="login-shell__background" aria-hidden="true">
      <div class="login-shell__beam login-shell__beam--blue"></div>
      <div class="login-shell__beam login-shell__beam--amber"></div>
      <div class="login-shell__beam login-shell__beam--rose"></div>
      <div class="login-shell__beam login-shell__beam--teal"></div>
      <div class="login-shell__glow"></div>
    </div>

    <header class="login-shell__header">
      <div class="login-shell__brand">
        <img
          class="login-shell__brand-image"
          src="/headerLogo.PNG"
          alt="Header logo"
        />
      </div>
    </header>

    <main class="login-shell__content">
      <section class="login-card">
        <div class="login-card__copy">
          <span class="login-card__eyebrow">Workspace sign in</span>
          <h1 class="login-card__title">계정에 로그인</h1>
          <p class="login-card__description">
            이메일과 비밀번호를 입력해 채용 운영 화면으로 돌아오세요.
          </p>
        </div>

        <form class="login-form" @submit.prevent="handleLogin">
          <label class="login-field">
            <span class="login-field__label">이메일</span>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="login-field__input"
              placeholder="name@company.com"
            />
          </label>

          <label class="login-field">
            <span class="login-field__label">비밀번호</span>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              class="login-field__input"
              placeholder="••••••••"
            />
          </label>

          <div v-if="error" class="login-form__error">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="login-form__submit"
          >
            <span v-if="loading" class="login-form__submit-content">
              <svg class="login-form__spinner" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              로그인 중...
            </span>
            <span v-else>로그인</span>
          </button>

          <div class="login-form__quick-actions">
            <p class="login-form__quick-label">평가용 빠른 로그인</p>
            <div class="login-form__quick-grid">
              <button
                type="button"
                :disabled="loading"
                class="login-form__quick-button"
                @click="handleQuickLogin('hr.kim@coffiiness.com', '1q2w3e4r')"
              >
                <span class="login-form__quick-badge">인사담당자</span>
                <span class="login-form__quick-button-title">채용 운영과 자원 관리용 계정</span>
              </button>

              <button
                type="button"
                :disabled="loading"
                class="login-form__quick-button"
                @click="handleQuickLogin('dev.han@coffiiness.com', '1q2w3e4r')"
              >
                <span class="login-form__quick-badge">면접관</span>
                <span class="login-form__quick-button-title">면접 일정과 후보자 확인용 계정</span>
              </button>

              <button
                type="button"
                :disabled="loading"
                class="login-form__quick-button"
                @click="handleQuickLogin('admin@calfit.com', '1q2w3e4r')"
              >
                <span class="login-form__quick-badge">관리자</span>
                <span class="login-form__quick-button-title">통계와 리포트 확인용 계정</span>
              </button>
            </div>
          </div>
        </form>

        <div class="login-card__footer">
          <span>계정이 없으신가요?</span>
          <button type="button" class="login-card__footer-link" @click="goToSignup">
            무료로 회원가입하기
          </button>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.login-shell {
  --login-bg: #f7f8fc;
  --login-card-shadow: 0 24px 64px rgba(15, 23, 42, 0.16);
  --login-border: rgba(148, 163, 184, 0.24);
  --login-text: #1f2a44;
  --login-muted: #667085;
  --login-accent: #0d9488;
  --login-accent-strong: #0f766e;
  --login-accent-soft: #ecfdf5;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(247, 248, 252, 0.94) 100%);
}

.login-shell__background {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.login-shell__beam {
  position: absolute;
  filter: blur(10px);
  opacity: 0.88;
  transform: rotate(-18deg);
  border-radius: 999px;
  animation: login-beam-float 16s ease-in-out infinite alternate;
}

.login-shell__beam--blue {
  top: -9rem;
  right: 32%;
  width: 28rem;
  height: 90rem;
  background: linear-gradient(180deg, rgba(204, 251, 241, 0.96), rgba(94, 234, 212, 0.22));
  animation-duration: 18s;
}

.login-shell__beam--amber {
  top: -14rem;
  right: 14%;
  width: 20rem;
  height: 96rem;
  background: linear-gradient(180deg, rgba(153, 246, 228, 0.96), rgba(20, 184, 166, 0.2));
  animation-duration: 14s;
  animation-delay: -4s;
}

.login-shell__beam--rose {
  top: -12rem;
  right: -1rem;
  width: 24rem;
  height: 108rem;
  background: linear-gradient(180deg, rgba(45, 212, 191, 0.92), rgba(19, 78, 74, 0.14));
  animation-duration: 20s;
  animation-delay: -8s;
}

.login-shell__beam--teal {
  bottom: -22rem;
  left: -12rem;
  width: 36rem;
  height: 36rem;
  transform: none;
  opacity: 0.5;
  filter: blur(80px);
  background: radial-gradient(circle, rgba(16, 185, 129, 0.32), rgba(16, 185, 129, 0));
  animation: login-orb-drift 22s ease-in-out infinite alternate;
}

.login-shell__glow {
  position: absolute;
  inset: 7rem auto auto 8%;
  width: min(38rem, 44vw);
  height: min(38rem, 44vw);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.48) 32%, rgba(255, 255, 255, 0) 72%);
  filter: blur(12px);
  animation: login-glow-drift 18s ease-in-out infinite alternate;
}

.login-shell__header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  min-height: 5.5rem;
  padding: 0 1.5rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.72);
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(18px);
}

.login-shell__brand {
  display: inline-flex;
  align-items: center;
  padding: 0;
}

.login-shell__brand-image {
  display: block;
  width: auto;
  height: 2.5rem;
  object-fit: contain;
}

.login-shell__content {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 4.5rem 1.5rem 2.5rem;
}

.login-card {
  width: min(100%, 33.6rem);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 1.75rem;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: var(--login-card-shadow);
  backdrop-filter: blur(22px);
}

.login-card__copy {
  padding: 2.45rem 2.45rem 1.1rem;
}

.login-card__eyebrow {
  display: inline-flex;
  align-items: center;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: var(--login-accent-soft);
  color: var(--login-accent-strong);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.login-card__title {
  margin-top: 1.15rem;
  font-size: clamp(1.7rem, 2.8vw, 2.4rem);
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: -0.05em;
  color: var(--login-text);
}

.login-card__description {
  margin-top: 0.85rem;
  max-width: 24rem;
  font-size: 0.92rem;
  line-height: 1.6;
  color: var(--login-muted);
}

.login-form {
  padding: 0 2.45rem 1.65rem;
}

.login-field {
  display: block;
}

.login-field + .login-field {
  margin-top: 1.1rem;
}

.login-field__label {
  display: block;
  margin-bottom: 0.65rem;
  font-size: 0.92rem;
  font-weight: 700;
  color: var(--login-text);
}

.login-field__input {
  width: 100%;
  height: 3.2rem;
  padding: 0 1rem;
  border: 1px solid var(--login-border);
  border-radius: 0.95rem;
  background: rgba(255, 255, 255, 0.96);
  color: #0f172a;
  font-size: 0.95rem;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease;
}

.login-field__input::placeholder {
  color: #94a3b8;
}

.login-field__input:focus {
  outline: none;
  border-color: rgba(13, 148, 136, 0.42);
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.12);
  background: #ffffff;
}

.login-form__error {
  margin-top: 1rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid rgba(248, 113, 113, 0.18);
  border-radius: 0.95rem;
  background: #fff4f4;
  color: #c2410c;
  font-size: 0.86rem;
  font-weight: 600;
}

.login-form__submit {
  width: 100%;
  height: 3.2rem;
  margin-top: 1.3rem;
  border: 0;
  border-radius: 1rem;
  background: linear-gradient(180deg, rgba(20, 184, 166, 0.98), rgba(13, 148, 136, 0.98));
  color: #ffffff;
  font-size: 0.98rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  box-shadow: 0 18px 40px rgba(13, 148, 136, 0.22);
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    opacity 160ms ease;
}

.login-form__submit:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 22px 42px rgba(13, 148, 136, 0.28);
}

.login-form__submit:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.login-form__submit-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
}

.login-form__quick-actions {
  margin-top: 1.5rem;
  padding-top: 1.1rem;
  border-top: 1px solid rgba(226, 232, 240, 0.9);
}

.login-form__quick-label {
  margin-bottom: 0.7rem;
  font-size: 0.79rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #64748b;
}

.login-form__quick-grid {
  display: grid;
  gap: 0.85rem;
}

.login-form__quick-button {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.18rem;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(13, 148, 136, 0.16);
  border-radius: 1rem;
  background: linear-gradient(180deg, rgba(248, 255, 252, 0.98), rgba(236, 253, 245, 0.94));
  color: var(--login-accent-strong);
  text-align: left;
  transition:
    transform 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease,
    background-color 160ms ease,
    opacity 160ms ease;
}

.login-form__quick-button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: rgba(13, 148, 136, 0.3);
  background: linear-gradient(180deg, rgba(240, 253, 250, 1), rgba(204, 251, 241, 0.92));
  box-shadow: 0 14px 30px rgba(13, 148, 136, 0.12);
}

.login-form__quick-button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.login-form__quick-button--disabled {
  border-color: rgba(148, 163, 184, 0.22);
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.95));
  color: #475569;
  box-shadow: none;
}

.login-form__quick-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.18rem 0.5rem;
  border-radius: 999px;
  background: rgba(13, 148, 136, 0.12);
  color: #0f766e;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.login-form__quick-badge--muted {
  background: rgba(148, 163, 184, 0.18);
  color: #64748b;
}

.login-form__quick-button-title {
  font-size: 0.94rem;
  font-weight: 700;
  line-height: 1.35;
}

.login-form__quick-button-meta {
  font-size: 0.8rem;
  font-weight: 600;
  color: #0f766e;
  opacity: 0.86;
}

.login-form__spinner {
  width: 1rem;
  height: 1rem;
  animation: login-spin 0.9s linear infinite;
}

.login-card__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  padding: 1.2rem 1.4rem 1.35rem;
  border-top: 1px solid rgba(226, 232, 240, 0.8);
  border-bottom-left-radius: 1.75rem;
  border-bottom-right-radius: 1.75rem;
  background: rgba(248, 250, 255, 0.86);
  color: var(--login-muted);
  font-size: 0.9rem;
}

.login-card__footer-link {
  border: 0;
  background: transparent;
  color: var(--login-accent-strong);
  font-weight: 700;
}

.login-card__footer-link:hover {
  text-decoration: underline;
}

@keyframes login-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes login-beam-float {
  0% {
    transform: translate3d(0, 0, 0) rotate(-18deg) scale(1);
  }

  100% {
    transform: translate3d(2.25rem, -2rem, 0) rotate(-14deg) scale(1.035);
  }
}

@keyframes login-orb-drift {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  100% {
    transform: translate3d(4rem, -2.5rem, 0) scale(1.08);
  }
}

@keyframes login-glow-drift {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }

  100% {
    transform: translate3d(3rem, 1.5rem, 0) scale(1.06);
  }
}

@media (max-width: 767px) {
  .login-shell__header {
    min-height: 4.75rem;
    padding: 0 1rem;
  }

  .login-shell__brand {
    max-width: 100%;
  }

  .login-shell__brand-image {
    height: 2.1rem;
  }

  .login-shell__content {
    padding: 2.5rem 1rem 1.5rem;
  }

  .login-card {
    border-radius: 1.3rem;
  }

  .login-card__copy {
    padding: 1.75rem 1.2rem 1rem;
  }

  .login-card__description {
    font-size: 0.94rem;
  }

  .login-form {
    padding: 0 1.2rem 1.2rem;
  }

  .login-field__input,
  .login-form__submit {
    height: 3.05rem;
  }

  .login-card__footer {
    flex-direction: column;
    gap: 0.15rem;
    padding: 1.2rem 1rem 1.35rem;
  }
}
</style>
