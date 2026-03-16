<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { workspaceApi } from '@/api/workspace'
import AuthShell from '@/components/auth/AuthShell.vue'

const router = useRouter()

const teamName = ref('')
const contact = ref('')
const employeeCount = ref('1 ~ 10명')
const role = ref('인사 담당자')

const error = ref('')
const loading = ref(false)

const goBack = () => {
  router.back()
}

const handleStart = async () => {
  error.value = ''
  loading.value = true

  try {
    const res = await workspaceApi.createWorkspace({
      name: teamName.value,
      contactPhone: contact.value,
      employeeScale: employeeCount.value
    })
    const workspace = res.data.data
    if (workspace?.workspaceId) {
      localStorage.setItem('workspaceId', workspace.workspaceId)
    }
    router.push({ name: 'Dashboard' })
  } catch (e) {
    error.value = e.response?.data?.error?.message || '워크스페이스 생성에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell
    eyebrow="Workspace setup"
    title="워크스페이스 생성"
    description="팀 정보를 입력하고 채용 운영 공간을 바로 시작하세요."
    max-width="48rem"
  >
    <template #copy>
      <button type="button" class="mb-5 inline-flex items-center gap-2 text-sm font-bold text-slate-500 transition hover:text-brand-700" @click="goBack">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        이전으로
      </button>
      <span class="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">Workspace setup</span>
      <h1 class="mt-5 text-[clamp(2.1rem,3.4vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.05em] text-slate-900">워크스페이스 생성</h1>
      <p class="mt-3 max-w-2xl text-base leading-7 text-slate-500">
        팀 규모와 기본 정보를 입력하면 CalFit 대시보드로 바로 연결됩니다.
      </p>
    </template>

    <form class="space-y-6" @submit.prevent="handleStart">
      <label class="block">
        <span class="mb-2 block text-sm font-bold text-slate-800">워크스페이스 이름</span>
        <input
          v-model="teamName"
          type="text"
          required
          placeholder="예: CalFit 디자인팀"
          class="auth-input"
        />
      </label>

      <label class="block">
        <span class="mb-2 block text-sm font-bold text-slate-800">담당자 연락처</span>
        <input
          v-model="contact"
          type="text"
          placeholder="010-0000-0000"
          class="auth-input"
        />
      </label>

      <div class="grid gap-4 md:grid-cols-2">
        <label class="block">
          <span class="mb-2 block text-sm font-bold text-slate-800">직원 수</span>
          <select v-model="employeeCount" class="auth-input auth-input--select">
            <option>1 ~ 10명</option>
            <option>11 ~ 50명</option>
            <option>51 ~ 300명</option>
            <option>301 ~ 1,000명</option>
            <option>1,000명 이상</option>
          </select>
        </label>

        <label class="block">
          <span class="mb-2 block text-sm font-bold text-slate-800">나의 역할</span>
          <select v-model="role" class="auth-input auth-input--select">
            <option>인사 담당자</option>
            <option>면접관</option>
            <option>대표</option>
          </select>
        </label>
      </div>

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
          워크스페이스 생성 중...
        </span>
        <span v-else>CalFit 시작하기</span>
      </button>
    </form>
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

.auth-input--select {
  appearance: none;
  background-image:
    linear-gradient(45deg, transparent 50%, #64748b 50%),
    linear-gradient(135deg, #64748b 50%, transparent 50%);
  background-position:
    calc(100% - 18px) calc(50% - 3px),
    calc(100% - 12px) calc(50% - 3px);
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
  padding-right: 2.8rem;
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

@media (max-width: 767px) {
  .auth-input,
  .auth-submit {
    height: 3.55rem;
  }
}
</style>
