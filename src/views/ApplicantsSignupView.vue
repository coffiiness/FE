<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApplicantAuth } from '@/composables/useApplicantAuth'

const route = useRoute()
const router = useRouter()
const { signup } = useApplicantAuth()

const redirectTo = computed(() => route.query.redirect || '/')

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const loading = ref(false)
const serverError = ref('')

const emailError = computed(() => {
  if (!email.value) return '이메일을 입력해주세요.'
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) return '이메일 형식이 올바르지 않습니다.'
  return ''
})

const nameError = computed(() => {
  if (!name.value) return '이름을 입력해주세요.'
  if (name.value.length < 2 || name.value.length > 50) return '이름은 2~50자로 입력해주세요.'
  return ''
})

const passwordError = computed(() => {
  if (!password.value) return '비밀번호를 입력해주세요.'
  if (password.value.length < 4 || password.value.length > 20) return '비밀번호는 4~20자로 입력해주세요.'
  return ''
})

const passwordConfirmError = computed(() => {
  if (!passwordConfirm.value) return '비밀번호 확인을 입력해주세요.'
  if (password.value && passwordConfirm.value && password.value !== passwordConfirm.value) {
    return '비밀번호가 일치하지 않습니다.'
  }
  return ''
})

const resolveServerErrorMessage = (err) => {
  const code = err?.response?.data?.error?.code
  if (code === 'APPLICANT_EMAIL_ALREADY_EXISTS') {
    return '이미 가입된 이메일입니다. 로그인해주세요.'
  }
  if (code === 'TENANT_ID_REQUIRED') {
    return '테넌트 ID가 필요합니다. 다시 시도해주세요.'
  }
  if (code === 'E401') {
    return '이메일 또는 비밀번호를 확인해주세요.'
  }
  if (code === 'E400') {
    return '입력값을 다시 확인해주세요.'
  }
  return '잠시 후 다시 시도해주세요.'
}

const handleSubmit = async () => {
  serverError.value = ''

  if (emailError.value || nameError.value || passwordError.value || passwordConfirmError.value) {
    return
  }

  loading.value = true

  try {
    await signup(name.value, email.value, password.value)
    router.push({ path: '/applicants/login', query: { redirect: redirectTo.value } })
  } catch (err) {
    serverError.value = resolveServerErrorMessage(err)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-10">
        <div class="mb-8 text-center">
          <h1 class="text-2xl font-bold text-gray-900">회원가입</h1>
        </div>

        <form class="space-y-5" @submit.prevent="handleSubmit">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-2">이름</label>
            <input
                id="name"
                v-model.trim="name"
                type="text"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-brand-500"
                placeholder="이름을 입력하세요"
            />
            <p v-if="nameError" class="mt-2 text-xs text-red-600">{{ nameError }}</p>
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
            <input
                id="email"
                v-model.trim="email"
                type="email"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-brand-500"
                placeholder="example@email.com"
            />
            <p v-if="emailError" class="mt-2 text-xs text-red-600">{{ emailError }}</p>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
            <input
                id="password"
                v-model.trim="password"
                type="password"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-brand-500"
                placeholder="비밀번호를 입력하세요"
            />
            <p v-if="passwordError" class="mt-2 text-xs text-red-600">{{ passwordError }}</p>
          </div>

          <div>
            <label for="passwordConfirm" class="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
            <input
                id="passwordConfirm"
                v-model.trim="passwordConfirm"
                type="password"
                required
                class="w-full rounded-lg border border-gray-300 px-3 py-3 text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-brand-500"
                placeholder="비밀번호를 다시 입력하세요"
            />
            <p v-if="passwordConfirmError" class="mt-2 text-xs text-red-600">{{ passwordConfirmError }}</p>
          </div>

          <div v-if="serverError" class="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md border border-red-100">
            {{ serverError }}
          </div>

          <button
              type="submit"
              :disabled="loading"
              class="w-full rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="loading">가입 중...</span>
            <span v-else>회원가입</span>
          </button>
        </form>

        <div class="mt-6 text-center text-sm text-gray-600">
          이미 계정이 있으신가요?
          <button
              @click="router.push({ path: '/applicants/login', query: { redirect: redirectTo } })"
              class="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  </div>
</template>