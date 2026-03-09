<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { careerApi } from '@/api/career'
import applicantClient from '@/api/applicantClient'
import { useApplicantAuth } from '@/composables/useApplicantAuth'

const route = useRoute()
const router = useRouter()
const { isAuthenticated, applicant, logout } = useApplicantAuth()

const companySlug = computed(() => route.params.companySlug)
const jobId = computed(() => route.params.jobId)

const companyName = ref('')
const applyForm = ref(null)
const loading = ref(true)
const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

// Base fields (always required)
const formData = ref({
  name: '',
  gender: '',
  birthDate: '',
  phone: '',
  email: ''
})

// Custom field answers keyed by field id
const customAnswers = ref({})

onMounted(async () => {
  try {
    // Fetch company name
    const companiesRes = await careerApi.getCompanies()
    const companies = companiesRes.data.data || []
    const matched = companies.find(c => c.workspaceId === companySlug.value)
    companyName.value = matched ? matched.companyName : companySlug.value

    // Fetch apply form info
    const formRes = await careerApi.getApplyForm(companySlug.value, jobId.value)
    applyForm.value = formRes.data.data

    // Parse custom fields from JSON string
    if (applyForm.value.customFields) {
      try {
        const parsed = JSON.parse(applyForm.value.customFields)
        if (Array.isArray(parsed)) {
          applyForm.value.parsedCustomFields = parsed
          parsed.forEach(f => {
            customAnswers.value[f.id] = ''
          })
        } else {
          applyForm.value.parsedCustomFields = []
        }
      } catch {
        applyForm.value.parsedCustomFields = []
      }
    } else {
      applyForm.value.parsedCustomFields = []
    }

    // Pre-fill email from applicant info if logged in
    if (applicant.value) {
      formData.value.email = applicant.value.email || ''
      formData.value.name = applicant.value.name || ''
    }
  } catch (e) {
    console.error('지원서 양식 로드 실패', e)
    errorMsg.value = '지원서 양식을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
})

const company = computed(() => ({
  name: companyName.value || companySlug.value,
  logo: (companyName.value || companySlug.value)?.charAt(0)?.toUpperCase() || '?'
}))

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

const handleSubmit = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (!isAuthenticated.value) {
    router.push({ path: `/careers/${companySlug.value}/login`, query: { redirect: route.fullPath } })
    return
  }

  // Validate base fields
  if (!formData.value.name.trim()) { errorMsg.value = '이름을 입력해주세요.'; return }
  if (!formData.value.gender) { errorMsg.value = '성별을 선택해주세요.'; return }
  if (!formData.value.birthDate) { errorMsg.value = '생년월일을 입력해주세요.'; return }
  if (!formData.value.phone.trim()) { errorMsg.value = '연락처를 입력해주세요.'; return }
  if (!formData.value.email.trim()) { errorMsg.value = '이메일을 입력해주세요.'; return }

  // Validate required custom fields
  const customFields = applyForm.value?.parsedCustomFields || []
  for (const field of customFields) {
    if (field.required && !customAnswers.value[field.id]?.trim()) {
      errorMsg.value = `"${field.label}" 항목을 입력해주세요.`
      return
    }
  }

  submitting.value = true

  try {
    const payload = {
      recruitmentId: Number(jobId.value),
      recruitmentProcessId: applyForm.value.firstStageId,
      templateId: applyForm.value.templateId,
      name: formData.value.name.trim(),
      gender: formData.value.gender,
      birthDate: formData.value.birthDate,
      phone: formData.value.phone.trim(),
      email: formData.value.email.trim(),
      schema: customAnswers.value
    }

    await applicantClient.post('/applications', payload)
    successMsg.value = '지원서가 성공적으로 제출되었습니다!'
    setTimeout(() => {
      router.push(`/careers/${companySlug.value}`)
    }, 1500)
  } catch (e) {
    const msg = e.response?.data?.error?.message || e.response?.data?.message || e.message
    if (e.response?.status === 401) {
      errorMsg.value = '로그인이 필요합니다. 로그인 후 다시 시도해주세요.'
    } else if (msg?.includes('VALIDATION')) {
      errorMsg.value = '이미 해당 공고에 지원하셨습니다.'
    } else {
      errorMsg.value = msg || '지원서 제출에 실패했습니다.'
    }
  } finally {
    submitting.value = false
  }
}

const getTextLength = (fieldId) => {
  return customAnswers.value[fieldId]?.length || 0
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
      <!-- Login prompt -->
      <div v-if="!isAuthenticated" class="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 flex items-start justify-between gap-4">
        <div class="text-sm">
          지원서를 제출하려면 먼저 로그인해주세요.
        </div>
        <button
          @click="router.push({ path: `/careers/${companySlug}/login`, query: { redirect: route.fullPath } })"
          class="shrink-0 px-3 py-1.5 text-xs font-semibold text-amber-900 border border-amber-300 rounded-md hover:bg-amber-100 transition-colors"
        >
          로그인하기
        </button>
      </div>

      <!-- Success message -->
      <div v-if="successMsg" class="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm font-medium">
        {{ successMsg }}
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">지원서 작성</h1>
        <p class="text-gray-600 mb-1">{{ applyForm?.title }}</p>
        <p class="text-sm text-gray-400 mb-8">아래 양식을 작성하고 지원서를 제출해 주세요.</p>

        <!-- Error message -->
        <div v-if="errorMsg" class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
          {{ errorMsg }}
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Base Fields -->
          <div class="pb-4 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">기본 정보</h2>

            <!-- Name -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                이름 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.name"
                type="text"
                placeholder="이름을 입력해주세요"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            <!-- Gender -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                성별 <span class="text-red-500">*</span>
              </label>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" v-model="formData.gender" value="MALE" class="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500" />
                  <span class="text-sm text-gray-700">남성</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input type="radio" v-model="formData.gender" value="FEMALE" class="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500" />
                  <span class="text-sm text-gray-700">여성</span>
                </label>
              </div>
            </div>

            <!-- Birth Date -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                생년월일 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.birthDate"
                type="date"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            <!-- Phone -->
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                연락처 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.phone"
                type="tel"
                placeholder="010-1234-5678"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                이메일 <span class="text-red-500">*</span>
              </label>
              <input
                v-model="formData.email"
                type="email"
                placeholder="example@email.com"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          <!-- Custom Fields (from template) -->
          <div v-if="applyForm?.parsedCustomFields?.length > 0">
            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">추가 질문</h2>

            <div v-for="field in applyForm.parsedCustomFields" :key="field.id" class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ field.label }}
                <span v-if="field.required" class="text-red-500 ml-1">*</span>
              </label>

              <!-- short_text / text -->
              <input
                v-if="field.type === 'short_text' || field.type === 'text'"
                v-model="customAnswers[field.id]"
                type="text"
                :placeholder="field.placeholder || ''"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />

              <!-- long_text / textarea -->
              <div v-else-if="field.type === 'long_text' || field.type === 'textarea'" class="relative">
                <textarea
                  v-model="customAnswers[field.id]"
                  :placeholder="field.placeholder || ''"
                  :maxlength="field.maxLength || 1000"
                  rows="4"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-800 placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
                ></textarea>
                <span class="absolute bottom-3 right-3 text-xs text-gray-400">
                  {{ getTextLength(field.id) }} / {{ field.maxLength || 1000 }}
                </span>
              </div>

              <!-- select -->
              <select
                v-else-if="field.type === 'select'"
                v-model="customAnswers[field.id]"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">선택해주세요</option>
                <option
                  v-for="opt in (field.options || '').split('/').map(o => o.trim()).filter(Boolean)"
                  :key="opt"
                  :value="opt"
                >{{ opt }}</option>
              </select>

              <!-- checkbox -->
              <label v-else-if="field.type === 'checkbox'" class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="customAnswers[field.id]"
                  class="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                />
                <span class="text-sm text-gray-700">{{ field.label }}</span>
              </label>

              <!-- email -->
              <input
                v-else-if="field.type === 'email'"
                v-model="customAnswers[field.id]"
                type="email"
                :placeholder="field.placeholder || 'example@email.com'"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />

              <!-- fallback: text input -->
              <input
                v-else
                v-model="customAnswers[field.id]"
                type="text"
                :placeholder="field.placeholder || ''"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
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
              :disabled="submitting || !isAuthenticated"
              class="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {{ submitting ? '제출 중...' : '지원하기' }}
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
