<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

// 편집 모드 여부
const templateId = computed(() => route.params.id)
const isEditMode = computed(() => !!templateId.value)
const loading = ref(false)

// 템플릿 데이터
const templateTitle = ref('')

// 기본 필드 (삭제 불가)
const defaultFields = ref([
  { id: 'name', label: '이름', type: 'text', required: true, editable: false },
  { id: 'gender', label: '성별', type: 'select', options: '남성 / 여성', required: true, editable: false },
  { id: 'birthdate', label: '생년월일', type: 'date', placeholder: 'YYYY-MM-DD', required: true, editable: false },
  { id: 'phone', label: '연락처', type: 'text', required: true, editable: false },
])

// 추가 질문 필드
const customFields = ref([])

// 필드 타입 옵션
const fieldTypeOptions = [
  { value: 'short_text', label: '단답형 질문', icon: 'text' },
  { value: 'long_text', label: '장문형 질문', icon: 'paragraph' },
  { value: 'select', label: '선택형 질문', icon: 'list' },
  { value: 'checkbox', label: '체크박스', icon: 'check' },
  { value: 'file', label: '첨부파일', icon: 'attachment' },
]

// 드롭다운 상태
const showFieldTypeDropdown = ref(false)
const newFieldLabel = ref('')

// 편집 모드일 때 데이터 로드
onMounted(async () => {
  if (isEditMode.value) {
    await loadTemplate()
  }
})

// 템플릿 데이터 로드
const loadTemplate = async () => {
  loading.value = true
  try {
    // TODO: API 연동 - GET /api/v1/recruitment/templates/{templateId}
    // 더미 데이터로 시뮬레이션
    const dummyData = {
      1: { title: '백엔드 개발자 지원서', customFields: [
        { id: 'intro', label: '자기소개', type: 'long_text', required: true },
        { id: 'portfolio', label: '포트폴리오 URL', type: 'short_text', required: false },
      ]},
      2: { title: '프론트엔드 개발자 지원서', customFields: [
        { id: 'intro', label: '자기소개', type: 'long_text', required: true },
        { id: 'github', label: 'GitHub', type: 'short_text', required: false },
        { id: 'blog', label: '기술 블로그', type: 'short_text', required: false },
      ]},
    }

    const data = dummyData[templateId.value]
    if (data) {
      templateTitle.value = data.title
      customFields.value = data.customFields || []
    }
  } catch (error) {
    console.error('Failed to load template:', error)
  } finally {
    loading.value = false
  }
}

// 새 필드 추가
const addField = (type) => {
  const typeOption = fieldTypeOptions.find(opt => opt.value === type)
  customFields.value.push({
    id: `custom_${Date.now()}`,
    label: newFieldLabel.value || `새 ${typeOption.label}`,
    type: type,
    required: false,
    options: type === 'select' ? '옵션1 / 옵션2' : '',
  })
  newFieldLabel.value = ''
  showFieldTypeDropdown.value = false
}

// 필드 삭제
const removeField = (index) => {
  customFields.value.splice(index, 1)
}

// 취소
const handleCancel = () => {
  router.push('/recruitment/templates')
}

// 저장
const handleSave = async () => {
  const payload = {
    title: templateTitle.value,
    fields: [...defaultFields.value, ...customFields.value],
  }

  if (isEditMode.value) {
    // TODO: API 연동 - PUT /api/v1/recruitment/templates/{templateId}
    console.log('Template updated:', templateId.value, payload)
  } else {
    // TODO: API 연동 - POST /api/v1/recruitment/templates
    console.log('Template created:', payload)
  }

  router.push('/recruitment/templates')
}

// 필드 타입 라벨 가져오기
const getFieldTypeLabel = (type) => {
  const option = fieldTypeOptions.find(opt => opt.value === type)
  return option ? option.label : type
}

// 페이지 제목
const pageTitle = computed(() => isEditMode.value ? '지원서 템플릿 수정' : '지원서 템플릿 작성')
const saveButtonText = computed(() => isEditMode.value ? '저장' : '적용')
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- 로딩 -->
    <div v-if="loading" class="text-center py-12 text-gray-500">
      로딩 중...
    </div>

    <template v-else>
      <!-- 헤더 -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900">{{ pageTitle }}</h1>
        <p class="mt-2 text-gray-600">
          지원서 템플릿의 제목을 설정하고 필요한 질문 항목을 추가하여 지원서를 작성할 수 있도록 설정해 주세요.
        </p>
      </div>

      <!-- 템플릿 제목 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <label class="block text-sm font-semibold text-gray-700 mb-2">제목</label>
        <input
          v-model="templateTitle"
          type="text"
          placeholder="지원서 템플릿의 제목을 입력하세요..."
          class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
      </div>

      <!-- 질문 필드 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <label class="text-sm font-semibold text-gray-700">질문 추가</label>
        </div>

        <!-- 기본 필드 (삭제 불가) -->
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
              <label class="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  :checked="field.required"
                  disabled
                  class="w-4 h-4 text-brand-600 rounded border-gray-300"
                />
                필수
              </label>
              <span class="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">기본</span>
            </div>
          </div>
        </div>

        <!-- 구분선 -->
        <div class="border-t border-gray-200 my-6"></div>

        <!-- 추가 질문 필드 -->
        <div class="space-y-3 mb-6">
          <div
            v-for="(field, index) in customFields"
            :key="field.id"
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
                placeholder="질문을 입력하세요..."
              />
              <span class="text-xs text-gray-400">{{ getFieldTypeLabel(field.type) }}</span>
            </div>
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                <input
                  type="checkbox"
                  v-model="field.required"
                  class="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                />
                필수
              </label>
              <button
                @click="removeField(index)"
                class="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 새 질문 추가 -->
        <div class="flex items-center gap-3">
          <div class="flex-1 relative">
            <input
              v-model="newFieldLabel"
              type="text"
              placeholder="+ 질문 항목을 추가하세요..."
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
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

            <!-- 드롭다운 메뉴 -->
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

      <!-- 안내 문구 -->
      <p class="text-sm text-gray-500 text-center">
        지원서를 제출하면 '<span class="text-brand-600 underline cursor-pointer">개인정보</span>' 처리방침에 동의하게 됩니다.
      </p>

      <!-- 버튼 영역 -->
      <div class="flex items-center justify-end gap-3 pt-4">
        <button
          @click="handleCancel"
          class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          취소
        </button>
        <button
          @click="handleSave"
          class="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
        >
          {{ saveButtonText }}
        </button>
      </div>
    </template>
  </div>
</template>
