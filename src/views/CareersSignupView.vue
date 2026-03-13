<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApplicantAuth } from '@/composables/useApplicantAuth'
import { setApplicantWorkspaceId } from '@/utils/applicantWorkspace'

const route = useRoute()
const router = useRouter()
const { signup } = useApplicantAuth()

const workspaceId = computed(() => String(route.params.companySlug || ''))
const redirectTo = computed(() => route.query.redirect || `/careers/${workspaceId.value}`)

setApplicantWorkspaceId(workspaceId.value)

const form = ref({
  name: '',
  email: '',
  password: '',
  passwordConfirm: ''
})
const loading = ref(false)
const serverError = ref('')

const isPasswordMismatch = computed(() => {
  if (!form.value.password || !form.value.passwordConfirm) return false
  return form.value.password !== form.value.passwordConfirm
})

const goToCareers = () => {
  router.push(`/careers/${workspaceId.value}`)
}

const goToLogin = () => {
  router.push({ path: `/careers/${workspaceId.value}/login`, query: { redirect: redirectTo.value } })
}

const handleSubmit = async () => {
  if (!form.value.name || !form.value.email || !form.value.password || !form.value.passwordConfirm) {
    serverError.value = '모든 항목을 입력해주세요.'
    return
  }

  if (isPasswordMismatch.value) {
    serverError.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  loading.value = true
  serverError.value = ''

  try {
    await signup(workspaceId.value, form.value.name, form.value.email, form.value.password)
    goToLogin()
  } catch (error) {
    serverError.value =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error?.message ||
      '회원가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-shell min-h-screen overflow-hidden text-slate-900">
    <div class="pointer-events-none absolute inset-0">
      <div class="beam beam-left"></div>
      <div class="beam beam-right"></div>
      <div class="beam beam-bottom"></div>
      <div class="paper-grid"></div>
    </div>

    <header class="relative z-10">
      <div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <button type="button" class="text-left" @click="goToCareers">
          <span class="font-display text-2xl font-semibold tracking-[0.16em] text-slate-900">CAREERS</span>
        </button>

        <button
          type="button"
          class="ghost-button"
          @click="goToCareers"
        >
          채용 목록으로
        </button>
      </div>
    </header>

    <main class="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center justify-center px-6 pb-8 pt-2">
      <section class="w-full max-w-lg">
        <div class="auth-card">
          <div class="card-heading">
            <h2 class="font-display text-[1.5rem] font-semibold tracking-[-0.01em] text-slate-900 md:text-[1.7rem]">회원가입</h2>
          </div>

          <form class="mt-5 space-y-4" @submit.prevent="handleSubmit">
            <div class="space-y-2">
              <label class="field-label">이름</label>
              <input
                v-model.trim="form.name"
                type="text"
                placeholder="이름을 입력해주세요"
                class="field-input"
              />
            </div>

            <div class="space-y-2">
              <label class="field-label">이메일</label>
              <input
                v-model.trim="form.email"
                type="email"
                placeholder="you@email.com"
                class="field-input"
              />
            </div>

            <div class="space-y-2">
              <label class="field-label">비밀번호</label>
              <input
                v-model.trim="form.password"
                type="password"
                placeholder="비밀번호를 입력해주세요"
                class="field-input"
              />
            </div>

            <div class="space-y-2">
              <label class="field-label">비밀번호 확인</label>
              <input
                v-model.trim="form.passwordConfirm"
                type="password"
                placeholder="비밀번호를 다시 입력해주세요"
                :class="['field-input', isPasswordMismatch ? 'field-input-error' : '']"
              />
              <p v-if="isPasswordMismatch" class="text-sm font-medium text-rose-600">
                비밀번호가 일치하지 않습니다.
              </p>
            </div>

            <div v-if="serverError" class="error-box">
              {{ serverError }}
            </div>

            <button
              type="submit"
              :disabled="loading"
              class="submit-button"
            >
              {{ loading ? '가입 중...' : '회원가입 완료' }}
            </button>

            <button
              type="button"
              class="footer-link-row footer-link-row-button"
              @click="goToLogin"
            >
              <span>이미 계정이 있나요?</span>
              <span class="footer-link">로그인</span>
            </button>
          </form>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.auth-shell {
  position: relative;
  background:
    radial-gradient(circle at top right, rgba(45, 212, 191, 0.18), transparent 24%),
    radial-gradient(circle at 14% 18%, rgba(20, 184, 166, 0.14), transparent 20%),
    linear-gradient(180deg, #f6fbfa 0%, #eef8f6 48%, #edf4f3 100%);
}

.beam {
  position: absolute;
  border-radius: 9999px;
  filter: blur(64px);
}

.beam-left {
  top: 4rem;
  left: -4rem;
  width: 16rem;
  height: 16rem;
  background: rgba(45, 212, 191, 0.18);
}

.beam-right {
  right: -3rem;
  top: 6rem;
  width: 18rem;
  height: 18rem;
  background: rgba(13, 148, 136, 0.14);
}

.beam-bottom {
  bottom: 4rem;
  left: 30%;
  width: 20rem;
  height: 12rem;
  background: rgba(153, 246, 228, 0.18);
}

.paper-grid {
  position: absolute;
  inset: 0;
  opacity: 0.16;
  background-image:
    linear-gradient(rgba(15, 23, 42, 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgba(15, 23, 42, 0.035) 1px, transparent 1px);
  background-size: 26px 26px;
}

.auth-card {
  border-radius: 2rem;
  border: 1px solid rgba(20, 184, 166, 0.14);
  background: rgba(255, 255, 255, 0.78);
  padding: 1.5rem;
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 60px rgba(20, 184, 166, 0.12);
}

.card-heading {
  border-bottom: 1px solid rgba(148, 163, 184, 0.16);
  padding-bottom: 0.9rem;
}

.field-label {
  display: block;
  font-size: 0.92rem;
  font-weight: 600;
  color: #334155;
}

.field-input {
  width: 100%;
  border-radius: 1rem;
  border: 1px solid rgba(148, 163, 184, 0.34);
  background: rgba(255, 255, 255, 0.88);
  padding: 0.82rem 0.95rem;
  color: #0f172a;
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.field-input::placeholder {
  color: #94a3b8;
}

.field-input:focus {
  border-color: rgba(20, 184, 166, 0.75);
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.14);
  transform: translateY(-1px);
}

.field-input-error {
  border-color: rgba(244, 63, 94, 0.52);
  box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.1);
}

.error-box {
  border-radius: 1rem;
  border: 1px solid #fecdd3;
  background: #fff1f2;
  padding: 0.9rem 1rem;
  font-size: 0.875rem;
  color: #be123c;
}

.submit-button {
  width: 100%;
  border: 0;
  border-radius: 9999px;
  background: #14b8a6;
  padding: 0.82rem 1.1rem;
  color: #f8fafc;
  font-size: 0.95rem;
  font-weight: 700;
  transition: transform 160ms ease, opacity 160ms ease, box-shadow 160ms ease;
  box-shadow: 0 18px 34px rgba(20, 184, 166, 0.24);
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.ghost-button {
  border-radius: 9999px;
  border: 1px solid rgba(20, 184, 166, 0.18);
  background: rgba(255, 255, 255, 0.68);
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #334155;
  transition: border-color 160ms ease, background-color 160ms ease, color 160ms ease;
}

.ghost-button:hover {
  border-color: rgba(20, 184, 166, 0.42);
  background: rgba(255, 255, 255, 0.88);
  color: #0f172a;
}

.footer-link-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
  padding-top: 1rem;
  font-size: 0.875rem;
  color: #475569;
}

.footer-link-row-button {
  width: 100%;
  background: transparent;
  text-align: left;
  transition: color 160ms ease, border-color 160ms ease;
}

.footer-link-row-button:hover {
  color: #0f172a;
  border-color: rgba(20, 184, 166, 0.28);
}

.footer-link {
  font-weight: 700;
  color: #0f766e;
  transition: color 160ms ease;
}

.footer-link:hover {
  color: #0f172a;
}

@media (max-width: 1023px) {
  .auth-card {
    padding: 1.25rem;
  }
}
</style>
