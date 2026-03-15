<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useRecruitmentStore } from '@/stores/recruitment'
import { TEMPLATE_STATUS, normalizeTemplateStatus } from '@/utils/templateStatus'
import { useHrAccessGuard } from '@/composables/useHrAccessGuard'

const router = useRouter()
const route = useRoute()
const recruitmentStore = useRecruitmentStore()
const {
  modal,
  loadMemberType,
  ensureHrAccess,
  onModalConfirm,
  onModalCancel
} = useHrAccessGuard()

const templateId = computed(() => route.params.id)
const isEditMode = computed(() => !!templateId.value)
const loading = ref(false)

const templateTitle = ref('')
const templateStatus = ref(TEMPLATE_STATUS.UNUSED)

const defaultFields = ref([
  { id: 'name', label: '이름', type: 'text', required: true, editable: false },
  { id: 'gender', label: '성별', type: 'select', options: ['남성', '여성'], required: true, editable: false },
  { id: 'birthdate', label: '생년월일', type: 'date', placeholder: 'YYYY-MM-DD', required: true, editable: false },
  { id: 'phone', label: '연락처', type: 'text', required: true, editable: false },
  { id: 'email', label: '이메일', type: 'email', required: true, editable: false },
  { id: 'shortBio', label: '간단 자기소개', type: 'text', multiline: true, maxLength: 1000, required: true, editable: false }
])
const customFields = ref([])

const fieldTypeOptions = [
  { value: 'text', label: '텍스트 질문', icon: 'text' },
  { value: 'select', label: '선택형 질문', icon: 'list' },
  { value: 'checkbox', label: '체크박스 질문', icon: 'check' },
  { value: 'file', label: '첨부파일 질문', icon: 'attachment' }
]

const showFieldTypeDropdown = ref(false)
const newFieldLabel = ref('')

const toOptionsArray = (value) => {
  if (Array.isArray(value)) return value.map((item) => String(item || '').trim()).filter(Boolean)
  if (typeof value === 'string') return value.split(/[\/,\n]/).map((item) => item.trim()).filter(Boolean)
  return []
}

const toNumberOrNull = (value) => {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? n : null
}

const normalizeIncomingField = (field = {}, index = 0) => {
  const legacyType = String(field?.type || '').trim()
  const normalizedType = legacyType === 'short_text' || legacyType === 'long_text' || legacyType === 'textarea'
    ? 'text'
    : legacyType || 'text'

  const multilineDefault = legacyType === 'long_text' || legacyType === 'textarea'
  const maxLengthDefault = legacyType === 'short_text' ? 200 : 1000

  return {
    id: field?.id || `custom_${Date.now()}_${index}`,
    label: String(field?.label || '').trim(),
    type: normalizedType,
    required: Boolean(field?.required),
    multiline: Boolean(field?.multiline ?? multilineDefault),
    maxLength: toNumberOrNull(field?.maxLength) ?? maxLengthDefault,
    options: toOptionsArray(field?.options),
    accept: String(field?.accept || '.pdf,.doc,.docx,.jpg,.jpeg,.png').trim(),
    maxFileSizeMB: toNumberOrNull(field?.maxFileSizeMB) ?? 10
  }
}

const normalizeOutgoingCustomFields = (fields) => {
  return fields
    .map((field, index) => normalizeIncomingField(field, index))
    .map((field) => ({
      id: field.id,
      label: field.label,
      type: field.type,
      required: field.required,
      multiline: field.type === 'text' ? Boolean(field.multiline) : false,
      maxLength: field.type === 'text' ? (toNumberOrNull(field.maxLength) ?? 1000) : null,
      options: field.type === 'select' || field.type === 'checkbox' ? toOptionsArray(field.options) : [],
      accept: field.type === 'file' ? field.accept : null,
      maxFileSizeMB: field.type === 'file' ? (toNumberOrNull(field.maxFileSizeMB) ?? 10) : null
    }))
    .filter((field) => field.label && field.type)
}

const createFieldByType = (type, label) => {
  const base = {
    id: `custom_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    label: label || '새 질문',
    type,
    required: false,
    multiline: false,
    maxLength: 200,
    options: [],
    accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png',
    maxFileSizeMB: 10
  }

  if (type === 'text') {
    return { ...base, multiline: false, maxLength: 200 }
  }
  if (type === 'select') {
    return { ...base, options: ['옵션 1', '옵션 2'] }
  }
  if (type === 'checkbox') {
    return { ...base, options: ['체크 1', '체크 2'] }
  }
  if (type === 'file') {
    return { ...base, accept: '.pdf,.doc,.docx,.jpg,.jpeg,.png', maxFileSizeMB: 10 }
  }
  return base
}

onMounted(async () => {
  try {
    await loadMemberType()
    await recruitmentStore.fetchApplicationTemplates()
  } catch (error) {
    console.error('템플릿 목록을 불러오지 못했습니다.', error)
  }

  if (isEditMode.value) {
    await loadTemplate()
  }
})

const loadTemplate = async () => {
  loading.value = true
  try {
    const fromList = recruitmentStore.templates.find((template) => template.id === Number(templateId.value))
    const data = await recruitmentStore.fetchTemplateById(Number(templateId.value)).catch(() => fromList)

    if (data) {
      templateTitle.value = data.title || data.name || ''
      templateStatus.value = normalizeTemplateStatus(data.status)
      customFields.value = Array.isArray(data.customFields)
        ? data.customFields.map((field, index) => normalizeIncomingField(field, index))
        : []
    }
  } catch (error) {
    console.error('템플릿을 불러오지 못했습니다.', error)
  } finally {
    loading.value = false
  }
}

const addField = (type) => {
  const next = createFieldByType(type, newFieldLabel.value.trim() || undefined)
  customFields.value.push(next)
  newFieldLabel.value = ''
  showFieldTypeDropdown.value = false
}

const removeField = (index) => {
  customFields.value.splice(index, 1)
}

const addOption = (field) => {
  field.options = toOptionsArray(field.options)
  field.options.push(`옵션 ${field.options.length + 1}`)
}

const removeOption = (field, optionIndex) => {
  field.options = toOptionsArray(field.options)
  field.options.splice(optionIndex, 1)
}

const handleCancel = () => {
  router.push('/recruitment/templates')
}

const handleSave = async () => {
  const actionLabel = isEditMode.value ? '지원서 템플릿 수정' : '지원서 템플릿 생성'
  if (!(await ensureHrAccess(`${actionLabel}은 인사담당자만 가능합니다.`))) {
    return
  }

  const payload = {
    title: templateTitle.value,
    status: templateStatus.value,
    customFields: normalizeOutgoingCustomFields(customFields.value)
  }

  try {
    if (isEditMode.value) {
      await recruitmentStore.updateTemplate({ id: Number(templateId.value), ...payload })
    } else {
      await recruitmentStore.addTemplate(payload)
    }

    router.push('/recruitment/templates')
  } catch (error) {
    console.error('템플릿 저장에 실패했습니다:', error)
  }
}

const getFieldTypeLabel = (field) => {
  if (field.type === 'text') {
    return field.multiline ? `텍스트 질문(장문, ${field.maxLength || 1000}자)` : `텍스트 질문(단답, ${field.maxLength || 200}자)`
  }
  if (field.type === 'select') return '선택형 질문'
  if (field.type === 'checkbox') return '체크박스 질문'
  if (field.type === 'file') return `첨부파일 질문(${field.maxFileSizeMB || 10}MB)`
  return field.type
}

const pageTitle = computed(() => (isEditMode.value ? '지원서 템플릿 수정' : '지원서 템플릿 생성'))
const saveButtonText = computed(() => (isEditMode.value ? '수정' : '적용'))
</script>

<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div v-if="loading" class="text-center py-12 text-gray-500">로딩 중...</div>

    <template v-else>
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ pageTitle }}</h1>
        <p class="mt-2 text-gray-600">지원서 템플릿의 제목과 상태를 설정하고, 추가 질문을 구성해 주세요.</p>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label class="block text-sm font-bold text-gray-900 mb-2">제목</label>
        <input
          v-model="templateTitle"
          type="text"
          placeholder="지원서 템플릿 제목을 입력해 주세요"
          class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />

        <div class="mt-4">
          <label class="block text-sm font-bold text-gray-900 mb-2">상태</label>
          <select
            v-model="templateStatus"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium bg-white focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          >
            <option :value="TEMPLATE_STATUS.IN_USE">{{ TEMPLATE_STATUS.IN_USE }}</option>
            <option :value="TEMPLATE_STATUS.UNUSED">{{ TEMPLATE_STATUS.UNUSED }}</option>
          </select>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <label class="text-sm font-bold text-gray-900">질문 구성</label>
        </div>

        <div class="space-y-3 mb-6">
          <div
            v-for="field in defaultFields"
            :key="field.id"
            class="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div class="flex items-center gap-2 text-gray-400">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <div class="flex-1">
              <span class="text-gray-700 font-medium">{{ field.label }}</span>
              <span v-if="field.options?.length" class="text-gray-400 ml-2">{{ field.options.join(' / ') }}</span>
              <span v-if="field.placeholder" class="text-gray-400 ml-2">{{ field.placeholder }}</span>
            </div>
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 text-sm text-gray-600" @click.prevent>
                <input type="checkbox" :checked="field.required" readonly class="w-4 h-4 text-brand-600 rounded border-gray-300 pointer-events-none" />
                필수
              </label>
              <span class="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">기본</span>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-200 my-6"></div>

        <div class="space-y-4 mb-6">
          <div
            v-for="(field, index) in customFields"
            :key="field.id || `${field.label}-${index}`"
            class="px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-brand-300 transition-colors"
          >
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2 text-gray-400 cursor-move">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </div>
              <div class="flex-1">
                <input
                  v-model="field.label"
                  type="text"
                  class="w-full bg-transparent border-none focus:ring-0 p-0 text-gray-900 font-medium"
                  placeholder="질문을 입력해 주세요"
                />
                <span class="text-xs text-gray-400">{{ getFieldTypeLabel(field) }}</span>
              </div>
              <div class="flex items-center gap-3">
                <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input type="checkbox" v-model="field.required" class="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500" />
                  필수
                </label>
                <button @click="removeField(index)" class="p-1 text-gray-400 hover:text-red-500 transition-colors">
                  <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div v-if="field.type === 'text'" class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <label class="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" v-model="field.multiline" class="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500" />
                장문 입력(체크 시 textarea)
              </label>
              <div>
                <label class="text-xs text-gray-500">글자수 제한</label>
                <input
                  v-model.number="field.maxLength"
                  type="number"
                  min="1"
                  class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>

            <div v-if="field.type === 'select' || field.type === 'checkbox'" class="mt-3">
              <div class="flex items-center justify-between mb-2">
                <label class="text-xs font-semibold text-gray-600">옵션 목록</label>
                <button
                  type="button"
                  @click="addOption(field)"
                  class="text-xs px-2 py-1 rounded border border-brand-200 text-brand-700 hover:bg-brand-50"
                >
                  + 옵션 추가
                </button>
              </div>

              <div class="space-y-2">
                <div v-for="(option, optionIndex) in field.options" :key="`${field.id}-opt-${optionIndex}`" class="flex items-center gap-2">
                  <input
                    v-model="field.options[optionIndex]"
                    type="text"
                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    :placeholder="`옵션 ${optionIndex + 1}`"
                  />
                  <button
                    type="button"
                    @click="removeOption(field, optionIndex)"
                    class="p-2 text-gray-400 hover:text-red-500"
                  >
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div v-if="field.type === 'file'" class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-gray-500">허용 확장자(쉼표 구분)</label>
                <input
                  v-model="field.accept"
                  type="text"
                  placeholder=".pdf,.doc,.docx,.jpg,.png"
                  class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              <div>
                <label class="text-xs text-gray-500">최대 파일 크기(MB)</label>
                <input
                  v-model.number="field.maxFileSizeMB"
                  type="number"
                  min="1"
                  class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="flex-1 relative">
            <input
              v-model="newFieldLabel"
              type="text"
              placeholder="+ 질문 항목을 추가해 주세요"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              @focus="showFieldTypeDropdown = false"
            />
          </div>
          <div class="relative">
            <button
              @click="showFieldTypeDropdown = !showFieldTypeDropdown"
              class="flex items-center gap-2 px-4 py-3 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              필드 추가
            </button>

            <div
              v-if="showFieldTypeDropdown"
              class="absolute right-0 mt-2 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10"
            >
              <button
                v-for="option in fieldTypeOptions"
                :key="option.value"
                @click="addField(option.value)"
                class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <p class="text-sm text-gray-500 text-center">
        지원서를 제출하면 '<span class="text-brand-600 underline cursor-pointer">개인정보</span>' 처리방침에 동의하게 됩니다.
      </p>

      <div class="flex items-center justify-end gap-3 pt-4">
        <button @click="handleCancel" class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">취소</button>
        <button @click="handleSave" class="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium">{{ saveButtonText }}</button>
      </div>
    </template>
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
