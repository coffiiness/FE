<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useRecruitmentStore } from '@/stores/recruitment'
import { TEMPLATE_STATUS, normalizeTemplateStatus } from '@/utils/templateStatus'

const router = useRouter()
const route = useRoute()
const recruitmentStore = useRecruitmentStore()

const templateId = computed(() => route.params.id)
const isEditMode = computed(() => !!templateId.value)
const loading = ref(false)

const templateTitle = ref('')
const templateStatus = ref(TEMPLATE_STATUS.UNUSED)

const defaultFields = ref([
  { id: 'name', label: '이름', type: 'text', required: true, editable: false },
  { id: 'gender', label: '성별', type: 'select', options: '남성 / 여성', required: true, editable: false },
  { id: 'birthdate', label: '생년월일', type: 'date', placeholder: 'YYYY-MM-DD', required: true, editable: false },
  { id: 'phone', label: '연락처', type: 'text', required: true, editable: false },
  { id: 'email', label: '이메일', type: 'email', required: true, editable: false },
  { id: 'shortBio', label: '간단 자기소개', type: 'long_text', required: true, editable: false }
])

const customFields = ref([])

const fieldTypeOptions = [
  { value: 'short_text', label: '단답형 질문', icon: 'text' },
  { value: 'long_text', label: '장문형 질문', icon: 'paragraph' },
  { value: 'select', label: '선택형 질문', icon: 'list' },
  { value: 'checkbox', label: '체크박스', icon: 'check' },
  { value: 'file', label: '첨부 파일', icon: 'attachment' }
]

const showFieldTypeDropdown = ref(false)
const newFieldLabel = ref('')

onMounted(async () => {
  try {
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
    const data = recruitmentStore.templates.find((template) => template.id === Number(templateId.value))
    if (data) {
      templateTitle.value = data.title || data.name || ''
      templateStatus.value = normalizeTemplateStatus(data.status)
      customFields.value = Array.isArray(data.customFields) ? [...data.customFields] : []
    }
  } catch (error) {
    console.error('템플릿을 불러오지 못했습니다.', error)
  } finally {
    loading.value = false
  }
}

const addField = (type) => {
  const typeOption = fieldTypeOptions.find((option) => option.value === type)
  customFields.value.push({
    id: `custom_${Date.now()}`,
    label: newFieldLabel.value.trim() || `새 ${typeOption?.label || '질문'}`,
    type,
    required: false,
    options: type === 'select' ? '옵션1 / 옵션2' : ''
  })
  newFieldLabel.value = ''
  showFieldTypeDropdown.value = false
}

const removeField = (index) => {
  customFields.value.splice(index, 1)
}

const handleCancel = () => {
  router.push('/recruitment/templates')
}

const normalizeOutgoingCustomFields = (fields) => {
  return fields
    .map((field, index) => ({
      id: field?.id || `custom_${Date.now()}_${index}`,
      label: String(field?.label || '').trim(),
      type: String(field?.type || '').trim(),
      required: Boolean(field?.required),
      options: field?.options ?? ''
    }))
    .filter((field) => field.label && field.type)
}

const handleSave = async () => {
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

const getFieldTypeLabel = (type) => {
  const option = fieldTypeOptions.find((value) => value.value === type)
  return option ? option.label : type
}

const pageTitle = computed(() => (isEditMode.value ? '지원서 템플릿 수정' : '지원서 템플릿 생성'))
const saveButtonText = computed(() => (isEditMode.value ? '수정' : '적용'))
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
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
          placeholder="지원서 템플릿 제목을 입력해 주세요..."
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-700 placeholder:text-gray-400"
        />

        <div class="mt-4">
          <label class="block text-sm font-bold text-gray-900 mb-2">상태</label>
          <select
            v-model="templateStatus"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-700 bg-white"
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
              <span class="text-gray-700">{{ field.label }}</span>
              <span v-if="field.options" class="text-gray-400 ml-2">{{ field.options }}</span>
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

        <div class="space-y-3 mb-6">
          <div
            v-for="(field, index) in customFields"
            :key="field.id || `${field.label}-${index}`"
            class="flex items-center gap-4 px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-brand-300 transition-colors"
          >
            <div class="flex items-center gap-2 text-gray-400 cursor-move">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </div>
            <div class="flex-1">
              <input
                v-model="field.label"
                type="text"
                class="w-full bg-transparent border-none focus:ring-0 p-0 text-gray-700"
                placeholder="질문을 입력해 주세요..."
              />
              <span class="text-xs text-gray-400">{{ getFieldTypeLabel(field.type) }}</span>
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
        </div>

        <div class="flex items-center gap-3">
          <div class="flex-1 relative">
            <input
              v-model="newFieldLabel"
              type="text"
              placeholder="+ 질문 항목을 추가해 주세요..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 text-gray-700 placeholder:text-gray-400"
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
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10"
            >
              <button
                v-for="option in fieldTypeOptions"
                :key="option.value"
                @click="addField(option.value)"
                class="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
              >
                <svg v-if="option.icon === 'text'" class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h8" />
                </svg>
                <svg v-else-if="option.icon === 'paragraph'" class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h12" />
                </svg>
                <svg v-else-if="option.icon === 'list'" class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg v-else-if="option.icon === 'check'" class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else-if="option.icon === 'attachment'" class="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
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
</template>
