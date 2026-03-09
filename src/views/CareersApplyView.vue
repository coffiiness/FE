<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { applicantApi } from '@/api/applicant'
import { useApplicantAuth } from '@/composables/useApplicantAuth'

const route = useRoute()
const router = useRouter()
const { isAuthenticated, logout } = useApplicantAuth()

const companySlug = computed(() => route.params.companySlug)
const jobId = computed(() => route.params.jobId)

const companyInfo = {
  naver: { name: 'NAVER', logo: 'N' },
  kakao: { name: 'Kakao', logo: 'K' }
}

const company = computed(() => companyInfo[companySlug.value] || {
  name: companySlug.value,
  logo: companySlug.value?.charAt(0)?.toUpperCase()
})

const template = ref(null)
const loading = ref(true)

const formData = ref({})
const submitting = ref(false)

const dummyTemplates = {
  'tpl-1': {
    id: 'tpl-1',
    title: 'Backend Engineer Application',
    jobTitle: 'Backend Engineer',
    fields: [
      { id: 'name', type: 'text', label: '이름', required: true, placeholder: '이름' },
      { id: 'email', type: 'email', label: '이메일', required: true, placeholder: 'example@email.com' },
      { id: 'intro', type: 'textarea', label: '간단 자기소개', required: true, placeholder: '자기소개를 입력하세요...', maxLength: 500 },
      { id: 'portfolio', type: 'text', label: '포트폴리오 URL', required: false, placeholder: 'https://github.com/...' }
    ]
  },
  'tpl-2': {
    id: 'tpl-2',
    title: 'Frontend Engineer Application',
    jobTitle: 'Frontend Engineer',
    fields: [
      { id: 'name', type: 'text', label: '이름', required: true, placeholder: '이름' },
      { id: 'email', type: 'email', label: '이메일', required: true, placeholder: 'example@email.com' },
      { id: 'intro', type: 'textarea', label: '간단 자기소개', required: true, placeholder: '자기소개를 입력하세요...', maxLength: 500 },
      { id: 'github', type: 'text', label: 'GitHub', required: false, placeholder: 'https://github.com/...' },
      { id: 'blog', type: 'text', label: '기술 블로그', required: false, placeholder: 'https://...' }
    ]
  },
  'tpl-3': {
    id: 'tpl-3',
    title: 'General Application',
    jobTitle: 'General',
    fields: [
      { id: 'name', type: 'text', label: '이름', required: true, placeholder: '이름' },
      { id: 'email', type: 'email', label: '이메일', required: true, placeholder: 'example@email.com' },
      { id: 'intro', type: 'textarea', label: '간단 자기소개', required: true, placeholder: '자기소개를 입력하세요...', maxLength: 500 }
    ]
  }
}

const jobTemplateMap = {
  '1': 'tpl-1',
  '2': 'tpl-2',
  '3': 'tpl-1',
  '4': 'tpl-3',
  '5': 'tpl-3'
}

onMounted(() => {
  setTimeout(() => {
    const templateId = jobTemplateMap[jobId.value] || 'tpl-3'
    template.value = dummyTemplates[templateId]

    template.value.fields.forEach((field) => {
      formData.value[field.id] = ''
    })

    loading.value = false
  }, 300)
})

const handleAuthAction = () => {
  if (isAuthenticated.value) {
    logout()
    router.push(`/careers/${companySlug.value}`)
  } else {
    router.push({ path: `/careers/${companySlug.value}/login`, query: { redirect: route.fullPath } })
  }
}

const handleCancel = () => {
  router.push(`/careers/${companySlug.value}`)
}

const handleSubmit = () => {
  const missingFields = template.value.fields
    .filter((field) => field.required && !formData.value[field.id])
    .map((field) => field.label)

  if (missingFields.length > 0) {
    alert(`다음 필수 항목을 입력해주세요: ${missingFields.join(', ')}`)
    return
  }

  console.log('Submit:', formData.value)
  alert('지원서가 제출되었습니다.')
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
      <div class="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 flex items-start justify-between gap-4">
        <div class="text-sm">
          중복 지원 관리를 위해 지원 전에 간단 로그인해주세요.
        </div>
        <button
          @click="router.push({ path: `/careers/${companySlug}/login`, query: { redirect: route.fullPath } })"
          class="shrink-0 px-3 py-1.5 text-xs font-semibold text-amber-900 border border-amber-300 rounded-md hover:bg-amber-100 transition-colors"
        >
          로그인하기
        </button>
      </div>
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">지원서 작성</h1>
        <p class="text-gray-600 mb-8">아래 양식을 작성하고 지원서를 제출해 주세요.</p>

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
                :class="['w-full py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500', field.id === 'name' || field.id === 'email' || field.id === 'phone' ? 'pl-10 pr-4' : 'px-4']"
              />
            </div>

            <div v-else-if="field.type === 'textarea'" class="relative">
              <textarea
                v-model="formData[field.id]"
                :placeholder="field.placeholder"
                :maxlength="field.maxLength"
                rows="4"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none font-semibold"
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
              :disabled="submitting"
              class="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
            >
              제출
            </button>
          </div>
        </form>

        <p class="text-sm text-gray-500 text-center mt-6">
          지원서를 제출하면 '<span class="text-brand-600 underline cursor-pointer">개인정보</span>' 처리방침에 동의하게 됩니다.
        </p>
      </div>
    </main>
  </div>
</template>
