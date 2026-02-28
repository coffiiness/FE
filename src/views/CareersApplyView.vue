<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApplicantAuth } from '@/composables/useApplicantAuth'

const route = useRoute()
const router = useRouter()
const { isAuthenticated, logout } = useApplicantAuth()

const companySlug = computed(() => route.params.companySlug)
const jobId = computed(() => route.params.jobId)

const companyInfo = {
  naver: { name: 'NAVER', logo: 'N' },
  kakao: { name: 'Kakao', logo: 'K' },
}

const company = computed(() => companyInfo[companySlug.value] || { name: companySlug.value, logo: companySlug.value?.charAt(0)?.toUpperCase() })

const template = ref(null)
const loading = ref(true)
const formData = ref({})

const showLoginModal = ref(false)
const openLoginModal = () => {
  showLoginModal.value = true
}
const closeLoginModal = () => {
  showLoginModal.value = false
  router.push(`/careers/${companySlug.value}`)
}
const handleAuthAction = () => {
  if (isAuthenticated.value) {
    logout()
    router.push(`/careers/${companySlug.value}`)
  } else {
    goToLogin()
  }
}

const goToLogin = () => {
  router.push({ path: '/applicants/login', query: { redirect: route.fullPath } })
}

const dummyTemplates = {
  'tpl-1': {
    id: 'tpl-1',
    title: 'Backend Engineer Application',
    jobTitle: 'Backend Engineer',
    fields: [
      { id: 'name', type: 'text', label: '이름', required: true, placeholder: '이름' },
      { id: 'email', type: 'email', label: '이메일', required: true, placeholder: 'example@email.com' },
      { id: 'phone', type: 'text', label: '휴대폰 번호', required: true, placeholder: '010-0000-0000' },
      { id: 'intro', type: 'textarea', label: '소개', required: true, placeholder: '500자 이내로 작성해주세요.', maxLength: 500 },
    ]
  },
  'tpl-2': {
    id: 'tpl-2',
    title: 'Frontend Engineer Application',
    jobTitle: 'Frontend Engineer',
    fields: [
      { id: 'name', type: 'text', label: '이름', required: true, placeholder: '이름' },
      { id: 'email', type: 'email', label: '이메일', required: true, placeholder: 'example@email.com' },
      { id: 'phone', type: 'text', label: '휴대폰 번호', required: true, placeholder: '010-0000-0000' },
      { id: 'intro', type: 'textarea', label: '소개', required: true, placeholder: '500자 이내로 작성해주세요.', maxLength: 500 },
    ]
  },
  'tpl-3': {
    id: 'tpl-3',
    title: 'General Application',
    jobTitle: 'General',
    fields: [
      { id: 'name', type: 'text', label: '이름', required: true, placeholder: '이름' },
      { id: 'email', type: 'email', label: '이메일', required: true, placeholder: 'example@email.com' },
      { id: 'phone', type: 'text', label: '휴대폰 번호', required: true, placeholder: '010-0000-0000' },
      { id: 'intro', type: 'textarea', label: '소개', required: true, placeholder: '500자 이내로 작성해주세요.', maxLength: 500 },
    ]
  }
}

const jobTemplateMap = {
  '1': 'tpl-1',
  '2': 'tpl-2',
  '3': 'tpl-1',
  '4': 'tpl-3',
  '5': 'tpl-3',
}

onMounted(() => {
  if (!isAuthenticated.value) {
    openLoginModal()
  }
  setTimeout(() => {
    const templateId = jobTemplateMap[jobId.value] || 'tpl-3'
    template.value = dummyTemplates[templateId]

    template.value.fields.forEach(field => {
      formData.value[field.id] = ''
    })

    loading.value = false
  }, 300)
})

const handleCancel = () => {
  router.push(`/careers/${companySlug.value}`)
}

const handleSubmit = () => {
  if (!isAuthenticated.value) {
    openLoginModal()
    return
  }

  const missingFields = template.value.fields
    .filter(f => f.required && !formData.value[f.id])
    .map(f => f.label)

  if (missingFields.length > 0) {
    alert(`Missing required fields: ${missingFields.join(', ')}`)
    return
  }

  console.log('Submit:', formData.value)
  alert('Application submitted.')
  router.push(`/careers/${companySlug.value}`)
}

const getTextLength = (fieldId) => {
  return formData.value[fieldId]?.length || 0
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-2xl mx-auto px-6 h-16 flex items-center justify-between">
        <button @click="handleCancel" class="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="font-medium">{{ company.name }} Careers</span>
        </button>
        <button
          @click="handleAuthAction"
          class="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          {{ isAuthenticated ? '로그아웃' : '로그인' }}
        </button>
      </div>
    </header>

    <div v-if="loading" class="max-w-2xl mx-auto px-6 py-12 text-center text-gray-500">
      로딩 중...
    </div>

    <main v-else class="max-w-2xl mx-auto px-6 py-8">
      <div v-if="isAuthenticated" class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">지원서 작성</h1>
        <p class="text-gray-600 mb-8">아래 양식을 작성해 지원서를 제출해 주세요.</p>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div v-for="field in template.fields" :key="field.id">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ field.label }}
              <span v-if="field.required" class="text-red-500 ml-1">*</span>
            </label>

            <div v-if="field.type === 'text' || field.type === 'email'" class="relative">
              <input
                v-model="formData[field.id]"
                :type="field.type"
                :placeholder="field.placeholder"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            <div v-else-if="field.type === 'textarea'" class="relative">
              <textarea
                v-model="formData[field.id]"
                :placeholder="field.placeholder"
                :maxlength="field.maxLength"
                rows="4"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
              ></textarea>
              <span v-if="field.maxLength" class="absolute bottom-3 right-3 text-xs text-gray-400">
                {{ getTextLength(field.id) }} / {{ field.maxLength }}
              </span>
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              @click="handleCancel"
              class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              취소
            </button>
            <button
              type="submit"
              class="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
            >
              제출
            </button>
          </div>
        </form>
      </div>
    </main>
  </div>

  <div
    v-if="showLoginModal"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
  >
    <div class="w-full max-w-sm rounded-xl bg-white shadow-xl border border-gray-200 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-2">로그인이 필요합니다</h3>
      <p class="text-sm text-gray-600"> 지원하려면 로그인해 주세요.</p>
      <div class="mt-6 flex justify-end gap-2">
        <button
          type="button"
          @click="closeLoginModal"
          class="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="button"
          @click="goToLogin"
          class="px-4 py-2 text-sm font-semibold text-white bg-brand-600 rounded-lg hover:bg-brand-700"
        >
          로그인
        </button>
      </div>
    </div>
  </div>
</template>
