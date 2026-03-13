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

const handleSubmit = async () => {
  if (!form.value.name || !form.value.email || !form.value.password || !form.value.passwordConfirm) {
    serverError.value = '모든 항목을 입력해주세요.'
    return
  }

  if (form.value.password !== form.value.passwordConfirm) {
    serverError.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  loading.value = true
  serverError.value = ''

  try {
    await signup(workspaceId.value, form.value.name, form.value.email, form.value.password)
    router.push({ path: `/careers/${workspaceId.value}/login`, query: { redirect: redirectTo.value } })
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
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
        <span class="text-xl font-bold text-gray-900">Careers</span>
        <button
          @click="router.push(`/careers/${workspaceId}`)"
          class="text-sm font-semibold text-gray-600 hover:text-gray-900"
        >
          채용 목록
        </button>
      </div>
    </header>

    <main class="max-w-2xl mx-auto px-6 py-10">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">지원자 회원가입</h1>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">이름</label>
            <input
              v-model.trim="form.name"
              type="text"
              placeholder="이름을 입력해주세요"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
            <input
              v-model.trim="form.email"
              type="email"
              placeholder="you@email.com"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
            <input
              v-model.trim="form.password"
              type="password"
              placeholder="비밀번호를 입력해주세요"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
            <input
              v-model.trim="form.passwordConfirm"
              type="password"
              placeholder="비밀번호를 다시 입력해주세요"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div v-if="serverError" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md border border-red-100">
            {{ serverError }}
          </div>

          <div class="pt-4 flex items-center justify-end">
            <button
              type="submit"
              :disabled="loading"
              class="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {{ loading ? '가입 중...' : '회원가입' }}
            </button>
          </div>

          <div class="text-sm text-gray-600 pt-2 text-right">
            이미 계정이 있으신가요?
            <button
              type="button"
              class="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              @click="router.push({ path: `/careers/${workspaceId}/login`, query: { redirect: redirectTo } })"
            >
              로그인
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>
</template>
