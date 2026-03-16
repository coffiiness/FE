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
  <div class="mx-auto max-w-6xl px-4 py-4 md:px-6 md:py-5">
    <div
      v-if="loading"
      class="rounded-[28px] border border-slate-200 bg-white px-6 py-16 text-center text-sm font-bold text-slate-500 shadow-sm"
    >
      로딩 중...
    </div>

    <template v-else>
      <div class="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-200 px-5 py-5 md:px-7 md:py-6">
          <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div class="min-w-0 flex-1 space-y-4">
              <h1 class="text-3xl font-extrabold tracking-[-0.04em] text-slate-900">{{ pageTitle }}</h1>

              <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div>
                  <label class="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">제목</label>
                  <input
                    v-model="templateTitle"
                    type="text"
                    placeholder="지원서 템플릿 제목"
                    class="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                  />
                </div>

                <div>
                  <label class="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-500">상태</label>
                  <select
                    v-model="templateStatus"
                    class="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                  >
                    <option :value="TEMPLATE_STATUS.IN_USE">{{ TEMPLATE_STATUS.IN_USE }}</option>
                    <option :value="TEMPLATE_STATUS.UNUSED">{{ TEMPLATE_STATUS.UNUSED }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end gap-2">
              <button
                @click="handleCancel"
                class="inline-flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-800"
              >
                취소
              </button>
              <button
                @click="handleSave"
                class="inline-flex h-12 items-center justify-center rounded-xl bg-brand-600 px-4 text-sm font-bold text-white transition-colors hover:bg-brand-700"
              >
                {{ saveButtonText }}
              </button>
            </div>
          </div>
        </div>

        <div class="px-5 py-5 md:px-7 md:py-6">
          <div class="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
            <div class="border-b border-slate-200 px-5 py-4">
              <h2 class="text-lg font-black tracking-[-0.03em] text-slate-900">질문 구성</h2>
            </div>

            <div class="space-y-6 px-5 py-5">
              <section class="space-y-3">
                <h3 class="text-xs font-black uppercase tracking-[0.14em] text-slate-500">기본 항목</h3>

                <div class="space-y-3">
                  <div
                    v-for="field in defaultFields"
                    :key="field.id"
                    class="flex items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3"
                  >
                    <div class="flex items-center gap-2 text-slate-400">
                      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </div>
                    <div class="flex-1">
                      <span class="font-medium text-slate-700">{{ field.label }}</span>
                      <span v-if="field.options?.length" class="ml-2 text-slate-400">{{ field.options.join(' / ') }}</span>
                      <span v-if="field.placeholder" class="ml-2 text-slate-400">{{ field.placeholder }}</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <label class="flex items-center gap-2 text-sm text-slate-600" @click.prevent>
                        <input
                          type="checkbox"
                          :checked="field.required"
                          readonly
                          class="h-4 w-4 rounded border-slate-300 text-brand-600 pointer-events-none"
                        />
                        필수
                      </label>
                      <span class="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">기본</span>
                    </div>
                  </div>
                </div>
              </section>

              <div class="border-t border-slate-200"></div>

              <section class="space-y-4">
                <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 class="text-xs font-black uppercase tracking-[0.14em] text-slate-500">추가 질문</h3>

                  <div class="flex items-center gap-3">
                    <div class="relative flex-1 sm:min-w-[18rem]">
                      <input
                        v-model="newFieldLabel"
                        type="text"
                        placeholder="질문 항목 추가"
                        class="h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                        @focus="showFieldTypeDropdown = false"
                      />
                    </div>

                    <div class="relative">
                      <button
                        @click="showFieldTypeDropdown = !showFieldTypeDropdown"
                        class="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                      >
                        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                        </svg>
                        필드 추가
                      </button>

                      <div
                        v-if="showFieldTypeDropdown"
                        class="absolute right-0 z-10 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-2 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)]"
                      >
                        <button
                          v-for="option in fieldTypeOptions"
                          :key="option.value"
                          @click="addField(option.value)"
                          class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                        >
                          {{ option.label }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="space-y-4">
                  <div
                    v-for="(field, index) in customFields"
                    :key="field.id || `${field.label}-${index}`"
                    class="rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-brand-300"
                  >
                    <div class="flex items-center gap-4">
                      <div class="flex cursor-move items-center gap-2 text-slate-400">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </div>

                      <div class="flex-1">
                        <input
                          v-model="field.label"
                          type="text"
                          class="w-full border-none bg-transparent p-0 font-medium text-slate-900 focus:ring-0"
                          placeholder="질문 입력"
                        />
                        <span class="text-xs text-slate-400">{{ getFieldTypeLabel(field) }}</span>
                      </div>

                      <div class="flex items-center gap-3">
                        <label class="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                          <input
                            type="checkbox"
                            v-model="field.required"
                            class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                          />
                          필수
                        </label>
                        <button @click="removeField(index)" class="p-1 text-slate-400 transition-colors hover:text-rose-500">
                          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div v-if="field.type === 'text'" class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <label class="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          v-model="field.multiline"
                          class="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                        장문 입력(체크 시 textarea)
                      </label>
                      <div>
                        <label class="text-xs text-slate-500">글자수 제한</label>
                        <input
                          v-model.number="field.maxLength"
                          type="number"
                          min="1"
                          class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                        />
                      </div>
                    </div>

                    <div v-if="field.type === 'select' || field.type === 'checkbox'" class="mt-3">
                      <div class="mb-2 flex items-center justify-between">
                        <label class="text-xs font-semibold text-slate-600">옵션 목록</label>
                        <button
                          type="button"
                          @click="addOption(field)"
                          class="rounded-lg border border-brand-200 px-2 py-1 text-xs font-bold text-brand-700 hover:bg-brand-50"
                        >
                          + 옵션 추가
                        </button>
                      </div>

                      <div class="space-y-2">
                        <div
                          v-for="(option, optionIndex) in field.options"
                          :key="`${field.id}-opt-${optionIndex}`"
                          class="flex items-center gap-2"
                        >
                          <input
                            v-model="field.options[optionIndex]"
                            type="text"
                            class="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                            :placeholder="`옵션 ${optionIndex + 1}`"
                          />
                          <button
                            type="button"
                            @click="removeOption(field, optionIndex)"
                            class="p-2 text-slate-400 hover:text-rose-500"
                          >
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div v-if="field.type === 'file'" class="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label class="text-xs text-slate-500">허용 확장자(쉼표 구분)</label>
                        <input
                          v-model="field.accept"
                          type="text"
                          placeholder=".pdf,.doc,.docx,.jpg,.png"
                          class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                        />
                      </div>
                      <div>
                        <label class="text-xs text-slate-500">최대 파일 크기(MB)</label>
                        <input
                          v-model.number="field.maxFileSizeMB"
                          type="number"
                          min="1"
                          class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-900 outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="customFields.length === 0"
                    class="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-5 py-12 text-center text-sm font-bold text-slate-400"
                  >
                    추가 질문이 없습니다.
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </template>

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
  </div>
</template>
