<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthShell from '@/components/auth/AuthShell.vue'

const router = useRouter()
const route = useRoute()

const userName = ref(route.query.name || '회원')

const createWorkspace = () => {
  router.push('/workspace/create')
}

const goToLogin = () => {
  router.push('/login')
}
</script>

<template>
  <AuthShell
    eyebrow="Welcome aboard"
    title="회원가입이 완료되었습니다"
    :description="`${userName}님, 이제 팀을 위한 워크스페이스를 만들어보세요.`"
    max-width="44rem"
  >
    <div class="space-y-5">
      <button type="button" class="success-card success-card--primary" @click="createWorkspace">
        <div class="success-card__icon">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div class="success-card__content">
          <div class="success-card__title-row">
            <h3 class="success-card__title">워크스페이스 생성하기</h3>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-brand-600 transition-transform group-hover:translate-x-1" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </div>
          <p class="success-card__description">
            팀원 초대, 공고 관리, 면접 일정 운영을 시작할 기본 공간을 만듭니다.
          </p>
        </div>
      </button>

      <div class="success-note">
        <h4 class="success-note__title">초대를 기다리는 중인가요?</h4>
        <p class="success-note__description">
          이미 팀 초대를 받았다면 이메일 속 링크로 바로 워크스페이스에 참여할 수 있습니다.
        </p>
      </div>
    </div>

    <template #footer>
      <button type="button" class="success-footer-link" @click="goToLogin">
        로그인 화면으로 돌아가기
      </button>
    </template>
  </AuthShell>
</template>

<style scoped>
.success-card {
  width: 100%;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.35rem 1.4rem;
  border-radius: 1.2rem;
  text-align: left;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease,
    border-color 160ms ease;
}

.success-card--primary {
  border: 1px solid rgba(45, 212, 191, 0.3);
  background: linear-gradient(180deg, rgba(240, 253, 250, 0.95), rgba(255, 255, 255, 0.98));
  box-shadow: 0 16px 30px rgba(13, 148, 136, 0.08);
}

.success-card--primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 22px 36px rgba(13, 148, 136, 0.13);
  border-color: rgba(20, 184, 166, 0.42);
}

.success-card__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  border-radius: 0.95rem;
  background: rgba(20, 184, 166, 0.12);
  color: #0f766e;
  flex-shrink: 0;
}

.success-card__content {
  min-width: 0;
  flex: 1;
}

.success-card__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.success-card__title {
  font-size: 1.1rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: #0f172a;
}

.success-card__description {
  margin-top: 0.3rem;
  font-size: 0.93rem;
  line-height: 1.65;
  color: #64748b;
}

.success-note {
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 1.2rem;
  background: rgba(255, 255, 255, 0.92);
  padding: 1.1rem 1.2rem;
}

.success-note__title {
  font-size: 0.95rem;
  font-weight: 800;
  color: #0f172a;
}

.success-note__description {
  margin-top: 0.35rem;
  font-size: 0.88rem;
  line-height: 1.65;
  color: #64748b;
  word-break: keep-all;
}

.success-footer-link {
  border: 0;
  background: transparent;
  color: #0f766e;
  font-weight: 700;
}

.success-footer-link:hover {
  text-decoration: underline;
}
</style>
