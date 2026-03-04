<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const companySlug = computed(() => route.params.companySlug)
const redirectTo = computed(() => route.query.redirect || `/careers/${companySlug.value}`)

const companyInfo = {
  naver: { name: 'NAVER', logo: 'N' },
  kakao: { name: 'Kakao', logo: 'K' },
}

const company = computed(() => companyInfo[companySlug.value] || { name: companySlug.value, logo: companySlug.value?.charAt(0)?.toUpperCase() })

const form = ref({
  name: '',
  gender: '',
  email: '',
  password: '',
  passwordConfirm: ''
})

const modal = ref({
  open: false,
  title: '',
  message: '',
  nextPath: null
})

const openModal = (title, message, nextPath = null) => {
  modal.value = { open: true, title, message, nextPath }
}

const closeModal = () => {
  modal.value.open = false
}

const handleSubmit = () => {
  const missing = []
  if (!form.value.name) missing.push('이름')
  if (!form.value.gender) missing.push('성별')
  if (!form.value.email) missing.push('이메일')
  if (!form.value.password) missing.push('비밀번호')
  if (!form.value.passwordConfirm) missing.push('비밀번호 확인')

  if (missing.length > 0) {
    openModal('입력 필요', `다음 항목을 입력해주세요: ${missing.join(', ')}`)
    return
  }

  if (form.value.password !== form.value.passwordConfirm) {
    openModal('비밀번호 오류', '비밀번호가 일치하지 않습니다.')
    return
  }

  console.log('Careers signup:', form.value)
  openModal('회원가입 완료', '회원가입이 완료되었습니다.', redirectTo.value)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold">
            {{ company.logo }}
          </div>
          <span class="text-xl font-bold text-gray-900">{{ company.name }} Careers</span>
        </div>
        <button
          @click="router.push(`/careers/${companySlug}`)"
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
              v-model="form.name"
              type="text"
              placeholder="이름을 입력해주세요"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">성별</label>
            <div class="flex gap-6">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="form.gender"
                  type="radio"
                  name="gender"
                  value="남"
                  class="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500"
                />
                <span class="text-gray-700">남</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  v-model="form.gender"
                  type="radio"
                  name="gender"
                  value="여"
                  class="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500"
                />
                <span class="text-gray-700">여</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">이메일</label>
            <input
              v-model="form.email"
              type="email"
              placeholder="you@email.com"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
            <input
              v-model="form.password"
              type="password"
              placeholder="비밀번호를 입력해주세요"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인</label>
            <input
              v-model="form.passwordConfirm"
              type="password"
              placeholder="비밀번호를 다시 입력해주세요"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>

          <div class="pt-4 flex items-center justify-end">
            <button
              type="submit"
              class="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
            >
              회원가입
            </button>
          </div>
          <div class="text-sm text-gray-600 pt-2 text-right">
            이미 계정이 있으신가요?
            <button
              type="button"
              class="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              @click="router.push({ path: `/careers/${companySlug}/login`, query: { redirect: redirectTo } })"
            >
              로그인
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>

  <div
    v-if="modal.open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
  >
    <div class="w-full max-w-sm rounded-xl bg-white shadow-xl border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ modal.title }}</h3>
      <p class="text-sm text-gray-600">{{ modal.message }}</p>
      <div class="mt-6 flex justify-end">
        <button
          type="button"
          @click="closeModal(); if (modal.nextPath) router.push(modal.nextPath)"
          class="px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  </div>
</template>
