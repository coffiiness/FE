<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { careerApi } from '@/api/career'
import applicantClient from '@/api/applicantClient'
import { useApplicantAuth } from '@/composables/useApplicantAuth'
import { useModal } from '@/composables/useModal'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const route = useRoute()
const router = useRouter()
const { isAuthenticated, applicant, logout } = useApplicantAuth()
const { modal, openModal, onModalConfirm, onModalCancel } = useModal()

const companySlug = computed(() => route.params.companySlug)
const jobId = computed(() => route.params.jobId)
const applyRoutePath = computed(() => `/careers/${companySlug.value}/${jobId.value}/apply`)

const companyName = ref('')
const applyForm = ref(null)
const loading = ref(true)
const submitting = ref(false)
const errorMsg = ref('')
const successMsg = ref('')
const authPromptShown = ref(false)

const formData = ref({
  name: '',
  gender: '',
  birthDate: '',
  phone: '',
  email: '',
  shortBio: ''
})

const customAnswers = ref({})

const parseCustomFields = (formData) => {
  const raw = formData?.customFields ?? formData?.questions ?? formData?.questionFields ?? []

  let parsed = raw
  for (let i = 0; i < 3; i += 1) {
    if (Array.isArray(parsed)) break
    if (typeof parsed !== 'string') break
    try {
      parsed = JSON.parse(parsed)
    } catch {
      parsed = []
      break
    }
  }

  if (!Array.isArray(parsed)) parsed = []

  return parsed
    .map((field, index) => ({
      ...field,
      id: field?.id || `custom_${index}`,
      options: Array.isArray(field?.options)
        ? field.options.map((item) => String(item || '').trim()).filter(Boolean)
        : typeof field?.options === 'string'
          ? field.options.split(/[\/,\n]/).map((item) => item.trim()).filter(Boolean)
          : []
    }))
    .filter((field) => {
      // "간단 자기소개"는 기본 정보 필드이므로 추가 질문 영역에서 제외
      const normalizedId = String(field?.id || '').trim().toLowerCase()
      const normalizedLabel = String(field?.label || '').trim().replace(/\s+/g, '')
      if (normalizedId === 'shortbio') return false
      if (normalizedLabel === '간단자기소개') return false
      return true
    })
}

const initAnswerForField = (field) => {
  if (field.type === 'file') return null
  if (field.type === 'checkbox') return []
  return ''
}

const handleFileChange = (field, event) => {
  const file = event?.target?.files?.[0]
  if (!file) {
    customAnswers.value[field.id] = null
    return
  }

  const maxFileSizeMB = Number(field?.maxFileSizeMB || 10)
  const maxBytes = maxFileSizeMB * 1024 * 1024
  if (Number.isFinite(maxBytes) && maxBytes > 0 && file.size > maxBytes) {
    errorMsg.value = `"${field.label}" 파일은 최대 ${maxFileSizeMB}MB까지 업로드할 수 있습니다.`
    event.target.value = ''
    customAnswers.value[field.id] = null
    return
  }

  customAnswers.value[field.id] = file
}

const getFileName = (value) => {
  if (typeof File !== 'undefined' && value instanceof File) return value.name
  return ''
}

const normalizeSchemaForSubmit = (schema) => {
  return Object.entries(schema).reduce((acc, [key, value]) => {
    if (typeof File !== 'undefined' && value instanceof File) {
      // /applications는 schema를 단순 값으로 받는 환경이 있어 파일명으로 전달
      acc[key] = value.name || ''
      return acc
    }

    if (Array.isArray(value) || (value && typeof value === 'object')) {
      acc[key] = JSON.stringify(value)
      return acc
    }

    acc[key] = value ?? ''
    return acc
  }, {})
}

const resolveApiData = (response) => {
  const body = response?.data
  if (body?.data !== undefined) return body.data
  return body
}

const getExactUploadContentType = (file) => file?.type || 'application/octet-stream'

const createUploadError = (stage, fieldLabel, message, cause, details = {}) => {
  const error = new Error(`"${fieldLabel}" 파일 업로드 중 ${message}`)
  error.stage = stage
  error.cause = cause
  error.details = details
  return error
}

const uploadApplicationFiles = async (applicationId, applicantId) => {
  const fileFields = (applyForm.value?.parsedCustomFields || []).filter((field) => field.type === 'file')

  for (const field of fileFields) {
    const file = customAnswers.value[field.id]
    if (!(typeof File !== 'undefined' && file instanceof File)) {
      continue
    }

    const exactContentType = getExactUploadContentType(file)

    const requestBody = {
      applicationId,
      applicantId,
      fieldKey: field.id,
      originalFilename: file.name,
      contentType: exactContentType
    }

    let presign
    try {
      const presignResponse = await applicantClient.post('/application-files/presign-upload', requestBody)
      presign = resolveApiData(presignResponse)
    } catch (error) {
      throw createUploadError('presign', field.label, 'presign 발급에 실패했습니다.', error)
    }
    if (!presign?.uploadUrl || !presign?.fileId) {
      throw createUploadError('presign', field.label, 'presign 정보를 받지 못했습니다.')
    }

    const uploadResponse = await fetch(presign.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': exactContentType
      },
      body: file
    })

    if (!uploadResponse.ok) {
      const responseText = await uploadResponse.text().catch(() => '')
      throw createUploadError(
        'put',
        field.label,
        'S3 PUT에 실패했습니다.',
        uploadResponse,
        {
          status: uploadResponse.status,
          responseText,
          requestContentType: exactContentType
        }
      )
    }

    try {
      await applicantClient.post('/application-files/complete', { fileId: presign.fileId })
    } catch (error) {
      throw createUploadError('complete', field.label, 'complete 처리에 실패했습니다.', error)
    }
  }
}

const promptLoginBeforeApply = () => {
  if (authPromptShown.value || isAuthenticated.value) return

  authPromptShown.value = true
  loading.value = false
  openModal({
    title: '로그인이 필요합니다',
    message: '지원서를 작성하려면 먼저 로그인해주세요.',
    type: 'warning',
    showCancel: true,
    confirmText: '로그인하기',
    cancelText: '공고 목록으로',
    onConfirm: () => {
      router.push({
        path: `/careers/${companySlug.value}/login`,
        query: { redirect: applyRoutePath.value }
      })
    },
    onCancel: () => {
      router.push(`/careers/${companySlug.value}`)
    }
  })
}

onMounted(async () => {
  if (!isAuthenticated.value) {
    promptLoginBeforeApply()
    return
  }

  try {
    const companiesRes = await careerApi.getCompanies()
    const companies = companiesRes.data?.data || []
    const matched = companies.find((company) => company.workspaceId === companySlug.value)
    companyName.value = matched ? matched.companyName : companySlug.value

    const formRes = await careerApi.getApplyForm(companySlug.value, jobId.value)
    applyForm.value = formRes.data?.data || null

    const parsedCustomFields = parseCustomFields(applyForm.value)
    applyForm.value = {
      ...applyForm.value,
      parsedCustomFields
    }

    parsedCustomFields.forEach((field) => {
      customAnswers.value[field.id] = initAnswerForField(field)
    })

    if (applicant.value) {
      formData.value.email = applicant.value.email || ''
      formData.value.name = applicant.value.name || ''
    }
  } catch (error) {
    console.error('지원서 양식 로드 실패', error)
    errorMsg.value = '지원서 양식을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
})

watch(isAuthenticated, (nextValue) => {
  if (!nextValue) return
  authPromptShown.value = false
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

const validateForm = () => {
  if (!formData.value.name.trim()) { errorMsg.value = '이름을 입력해주세요.'; return false }
  if (!formData.value.gender) { errorMsg.value = '성별을 선택해주세요.'; return false }
  if (!formData.value.birthDate) { errorMsg.value = '생년월일을 입력해주세요.'; return false }
  if (!formData.value.phone.trim()) { errorMsg.value = '연락처를 입력해주세요.'; return false }
  if (!formData.value.email.trim()) { errorMsg.value = '이메일을 입력해주세요.'; return false }
  if (!formData.value.shortBio.trim()) { errorMsg.value = '간단 자기소개를 입력해주세요.'; return false }

  for (const field of applyForm.value?.parsedCustomFields || []) {
    const answer = customAnswers.value[field.id]
    const isEmptyString = typeof answer === 'string' && !answer.trim()
    const isUnchecked = Array.isArray(answer) ? answer.length === 0 : typeof answer === 'boolean' && !answer
    const isEmptyFile = field.type === 'file' && !(typeof File !== 'undefined' && answer instanceof File)

    if (field.required && (answer === null || answer === undefined || isEmptyString || isUnchecked || isEmptyFile)) {
      errorMsg.value = `"${field.label}" 항목을 입력해주세요.`
      return false
    }
  }

  return true
}

const handleSubmit = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (!isAuthenticated.value) {
    promptLoginBeforeApply()
    return
  }

  if (!validateForm()) return

  if (!applyForm.value) {
    errorMsg.value = '지원서 양식을 불러오지 못했습니다. 페이지를 새로고침 해주세요.'
    return
  }

  submitting.value = true
  try {
    const applicantId = Number(applicant.value?.id ?? applicant.value?.applicantId ?? 0)
    const hasFileAttachment = (applyForm.value?.parsedCustomFields || []).some((field) => {
      if (field.type !== 'file') return false
      const answer = customAnswers.value[field.id]
      return typeof File !== 'undefined' && answer instanceof File
    })

    if (hasFileAttachment && (!Number.isFinite(applicantId) || applicantId <= 0)) {
      throw new Error('지원자 정보 확인에 실패했습니다. 다시 로그인 후 시도해주세요.')
    }

    const schemaPayload = normalizeSchemaForSubmit({
      ...customAnswers.value,
      shortBio: formData.value.shortBio.trim()
    })

    const payload = {
      applicantId: Number.isFinite(applicantId) && applicantId > 0 ? applicantId : null,
      recruitmentId: Number(applyForm.value?.recruitmentId ?? jobId.value),
      recruitmentProcessId: Number(applyForm.value?.firstStageId ?? 0) || null,
      templateId: Number(applyForm.value?.templateId ?? 0) || null,
      name: formData.value.name.trim(),
      gender: formData.value.gender,
      birthDate: formData.value.birthDate,
      phone: formData.value.phone.trim(),
      email: formData.value.email.trim(),
      formFields: schemaPayload
    }

    const createResponse = await applicantClient.post('/applications', payload)
    const created = resolveApiData(createResponse)
    const applicationId = Number(created?.applicationId ?? created?.id ?? 0)

    let fileUploadFailed = false

    if (hasFileAttachment) {
      if (!Number.isFinite(applicationId) || applicationId <= 0) {
        throw new Error('지원서 ID 확인에 실패하여 파일 업로드를 진행할 수 없습니다.')
      }

      try {
        await uploadApplicationFiles(applicationId, applicantId)
      } catch (uploadError) {
        fileUploadFailed = true
        const responseText = String(uploadError?.details?.responseText || '')
        if (uploadError?.stage === 'put' && responseText.includes('SignatureDoesNotMatch')) {
          errorMsg.value = `${uploadError.message} S3 응답: SignatureDoesNotMatch`
        } else if (uploadError?.stage === 'put' && responseText.includes('AccessDenied')) {
          errorMsg.value = `${uploadError.message} S3 응답: AccessDenied`
        } else {
          errorMsg.value = uploadError?.message || '첨부 파일 업로드에 실패했습니다.'
        }
        console.error('첨부파일 업로드 실패', uploadError)
      }
    }

    successMsg.value = fileUploadFailed
      ? '지원서는 제출되었지만 첨부 파일은 완료 처리되지 않았습니다.'
      : '지원서가 성공적으로 제출되었습니다.'

    if (!fileUploadFailed) {
      setTimeout(() => {
        router.push(`/careers/${companySlug.value}`)
      }, 1500)
    }
  } catch (error) {
    const message = error.response?.data?.error?.message || error.response?.data?.message || error.message
    if (error.response?.status === 401) {
      errorMsg.value = '로그인이 필요합니다. 다시 로그인 후 시도해주세요.'
    } else {
      errorMsg.value = message || '지원서 제출에 실패했습니다.'
    }
  } finally {
    submitting.value = false
  }
}

const getTextLength = (fieldId) => customAnswers.value[fieldId]?.length || 0
const getValueLength = (value) => (value ? String(value).length : 0)
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

    <div v-if="loading" class="max-w-2xl mx-auto px-6 py-12 text-center text-gray-500">로딩 중...</div>

    <main v-else-if="!applyForm && errorMsg" class="max-w-2xl mx-auto px-6 py-12">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <div class="text-red-500 text-4xl mb-4">!</div>
        <h2 class="text-lg font-semibold text-gray-900 mb-2">지원서 양식을 불러올 수 없습니다</h2>
        <p class="text-gray-500 mb-6">{{ errorMsg }}</p>
        <button
          @click="$router.push(`/careers/${companySlug}`)"
          class="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-semibold"
        >
          채용 공고 목록으로 돌아가기
        </button>
      </div>
    </main>

    <main v-else class="max-w-2xl mx-auto px-6 py-8">
      <div v-if="successMsg" class="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-800 text-sm font-medium">{{ successMsg }}</div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">지원서 작성</h1>
        <p class="text-3xl font-bold text-gray-900 mb-1">{{ applyForm?.title }}</p>
        <p class="text-sm text-gray-400 mb-8">아래 양식을 작성하고 지원서를 제출해 주세요.</p>

        <div v-if="errorMsg" class="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">{{ errorMsg }}</div>

        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div class="pb-4 border-b border-gray-100">
            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">기본 정보</h2>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">이름 <span class="text-red-500">*</span></label>
              <input v-model="formData.name" type="text" placeholder="이름을 입력해주세요" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">성별 <span class="text-red-500">*</span></label>
              <div class="flex gap-4">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="formData.gender" type="radio" value="MALE" class="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500" />
                  <span class="text-sm text-gray-700">남성</span>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <input v-model="formData.gender" type="radio" value="FEMALE" class="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500" />
                  <span class="text-sm text-gray-700">여성</span>
                </label>
              </div>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">생년월일 <span class="text-red-500">*</span></label>
              <input v-model="formData.birthDate" type="date" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">연락처<span class="text-red-500">*</span></label>
              <input v-model="formData.phone" type="tel" placeholder="010-1234-5678" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">이메일<span class="text-red-500">*</span></label>
              <input v-model="formData.email" type="email" placeholder="example@email.com" class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">간단 자기소개 <span class="text-red-500">*</span></label>
              <div class="relative">
                <textarea
                  v-model="formData.shortBio"
                  :maxlength="1000"
                  rows="4"
                  placeholder="간단한 자기소개를 작성해주세요"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
                ></textarea>
                <span class="absolute bottom-3 right-3 text-xs text-gray-400">{{ getValueLength(formData.shortBio) }} / 1000</span>
              </div>
            </div>
          </div>

          <div v-if="applyForm?.parsedCustomFields?.length > 0">
            <h2 class="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">추가 질문</h2>

            <div v-for="field in applyForm.parsedCustomFields" :key="field.id" class="mb-4 rounded-xl border border-gray-200 bg-gray-50/40 p-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                {{ field.label }}
                <span v-if="field.required" class="text-red-500 ml-1">*</span>
              </label>

              <template v-if="field.type === 'short_text' || field.type === 'text'">
                <input
                  v-model="customAnswers[field.id]"
                  type="text"
                  :placeholder="field.placeholder || ''"
                  :maxlength="field.maxLength || 200"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
                <p class="mt-1 text-right text-xs text-gray-400">{{ getValueLength(customAnswers[field.id]) }} / {{ field.maxLength || 200 }}</p>
              </template>

              <div v-else-if="field.type === 'long_text' || field.type === 'textarea'" class="relative">
                <textarea
                  v-model="customAnswers[field.id]"
                  :placeholder="field.placeholder || ''"
                  :maxlength="field.maxLength || 1000"
                  rows="4"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none"
                ></textarea>
                <span class="absolute bottom-3 right-3 text-xs text-gray-400">{{ getTextLength(field.id) }} / {{ field.maxLength || 1000 }}</span>
              </div>

              <select
                v-else-if="field.type === 'select'"
                v-model="customAnswers[field.id]"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              >
                <option value="">선택해주세요</option>
                <option
                  v-for="option in field.options || []"
                  :key="option"
                  :value="option"
                >
                  {{ option }}
                </option>
              </select>

              <div v-else-if="field.type === 'checkbox'" class="space-y-2">
                <label
                  v-for="option in field.options || []"
                  :key="`${field.id}-${option}`"
                  class="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    v-model="customAnswers[field.id]"
                    :value="option"
                    type="checkbox"
                    class="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                  />
                  <span class="text-sm text-gray-700">{{ option }}</span>
                </label>
              </div>

              <div v-else-if="field.type === 'file'" class="space-y-2">
                <input
                  type="file"
                  :accept="field.accept || undefined"
                  @change="handleFileChange(field, $event)"
                  class="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium file:mr-3 file:px-3 file:py-1.5 file:rounded-md file:border-0 file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                />
                <p class="text-xs text-gray-500">
                  허용 확장자: {{ field.accept || '모든 파일' }} / 최대 {{ field.maxFileSizeMB || 10 }}MB
                </p>
                <p v-if="getFileName(customAnswers[field.id])" class="text-xs text-brand-700">
                  선택 파일: {{ getFileName(customAnswers[field.id]) }}
                </p>
              </div>

              <input
                v-else
                v-model="customAnswers[field.id]"
                type="text"
                :placeholder="field.placeholder || ''"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          <div class="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button type="button" @click="handleCancel" class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">취소</button>
            <button
              type="submit"
              :disabled="submitting || !isAuthenticated || !applyForm"
              class="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {{ submitting ? '제출 중...' : '지원하기' }}
            </button>
          </div>
        </form>

        <p class="text-sm text-gray-500 text-center mt-6">지원서를 제출하면 '<span class="text-brand-600 underline cursor-pointer">개인정보</span>' 처리방침에 동의하게 됩니다.</p>
      </div>
    </main>
  </div>

  <ConfirmModal
    :show="modal.show"
    :title="modal.title"
    :message="modal.message"
    :type="modal.type"
    :show-cancel="modal.showCancel"
    :confirm-text="modal.confirmText"
    :cancel-text="modal.cancelText"
    @confirm="onModalConfirm"
    @cancel="onModalCancel"
  />
</template>

