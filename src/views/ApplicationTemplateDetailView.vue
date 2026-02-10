<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const templateId = computed(() => route.params.id)
const loading = ref(true)

// 템플릿 데이터
const template = ref(null)

// 기본 필드 (항상 포함)
const defaultFields = [
  { id: 'name', label: '이름', type: 'text', required: true },
  { id: 'gender', label: '성별', type: 'select', options: '남성 / 여성', required: true },
  { id: 'birthdate', label: '생년월일', type: 'date', placeholder: 'YYYY-MM-DD', required: true },
  { id: 'phone', label: '연락처', type: 'text', required: true },
]

// 필드 타입 라벨
const fieldTypeLabels = {
  text: '텍스트',
  date: '날짜',
  select: '선택형',
  short_text: '단답형 질문',
  long_text: '장문형 질문',
  checkbox: '체크박스',
  file: '첨부파일',
}

// 템플릿 데이터 로드
onMounted(async () => {
  await loadTemplate()
})

const loadTemplate = async () => {
  loading.value = true
  try {
    // TODO: API 연동 - GET /api/v1/recruitment/templates/{templateId}
    // 더미 데이터로 시뮬레이션
    const dummyData = {
      1: {
        id: 1,
        title: '백엔드 개발자 지원서',
        status: '사용중',
        createdAt: '2024.01.15',
        updatedAt: '2024.01.20',
        customFields: [
          { id: 'intro', label: '자기소개', type: 'long_text', required: true },
          { id: 'portfolio', label: '포트폴리오 URL', type: 'short_text', required: false },
        ]
      },
      2: {
        id: 2,
        title: '프론트엔드 개발자 지원서',
        status: '사용중',
        createdAt: '2024.01.18',
        updatedAt: '2024.01.25',
        customFields: [
          { id: 'intro', label: '자기소개', type: 'long_text', required: true },
          { id: 'github', label: 'GitHub', type: 'short_text', required: false },
          { id: 'blog', label: '기술 블로그', type: 'short_text', required: false },
        ]
      },
      3: {
        id: 3,
        title: 'DevOps 엔지니어 지원서',
        status: '미사용',
        createdAt: '2024.01.22',
        updatedAt: '2024.02.01',
        customFields: [
          { id: 'experience', label: 'DevOps 경력 기술', type: 'long_text', required: true },
          { id: 'certifications', label: '보유 자격증', type: 'short_text', required: false },
        ]
      },
    }

    template.value = dummyData[templateId.value] || null
  } catch (error) {
    console.error('Failed to load template:', error)
  } finally {
    loading.value = false
  }
}

// 필드 타입 라벨 가져오기
const getFieldTypeLabel = (type) => {
  return fieldTypeLabels[type] || type
}

// 편집 페이지로 이동
const goToEdit = () => {
  router.push(`/recruitment/templates/${templateId.value}/edit`)
}

// 목록으로 돌아가기
const goBack = () => {
  router.push('/recruitment/templates')
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- 로딩 -->
    <div v-if="loading" class="text-center py-12 text-gray-500">
      로딩 중...
    </div>

    <!-- 템플릿을 찾을 수 없음 -->
    <div v-else-if="!template" class="text-center py-12">
      <p class="text-gray-500 mb-4">템플릿을 찾을 수 없습니다.</p>
      <button
        @click="goBack"
        class="text-brand-600 hover:text-brand-700 font-medium"
      >
        목록으로 돌아가기
      </button>
    </div>

    <template v-else>
      <!-- 헤더 -->
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-3 mb-2">
            <button
              @click="goBack"
              class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 class="text-2xl font-bold text-gray-900">{{ template.title }}</h1>
            <span
              :class="[
                template.status === '사용중'
                  ? 'bg-green-100 text-green-700 border-green-200'
                  : 'bg-gray-100 text-gray-500 border-gray-200',
                'px-3 py-1 rounded-full text-sm font-medium border'
              ]"
            >
              {{ template.status }}
            </span>
          </div>
          <p class="text-gray-500 text-sm ml-8">
            생성일: {{ template.createdAt }} · 수정일: {{ template.updatedAt }}
          </p>
        </div>
        <button
          @click="goToEdit"
          class="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          편집
        </button>
      </div>

      <!-- 기본 필드 섹션 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">기본 항목</h2>
        <p class="text-sm text-gray-500 mb-4">모든 지원서에 기본으로 포함되는 항목입니다.</p>

        <div class="space-y-3">
          <div
            v-for="field in defaultFields"
            :key="field.id"
            class="flex items-center gap-4 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div class="flex-1">
              <span class="text-gray-700 font-medium">{{ field.label }}</span>
              <span class="text-xs text-gray-400 ml-2">{{ getFieldTypeLabel(field.type) }}</span>
              <span v-if="field.options" class="text-gray-400 text-sm ml-2">({{ field.options }})</span>
            </div>
            <div class="flex items-center gap-3">
              <span v-if="field.required" class="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded">필수</span>
              <span class="text-xs text-gray-400 bg-gray-200 px-2 py-1 rounded">기본</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 추가 질문 섹션 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">추가 질문</h2>

        <div v-if="template.customFields && template.customFields.length > 0" class="space-y-3">
          <div
            v-for="(field, index) in template.customFields"
            :key="field.id"
            class="flex items-center gap-4 px-4 py-3 bg-white rounded-lg border border-gray-200"
          >
            <div class="text-gray-400 text-sm font-medium w-6">{{ index + 1 }}</div>
            <div class="flex-1">
              <span class="text-gray-700 font-medium">{{ field.label }}</span>
              <span class="text-xs text-gray-400 ml-2">{{ getFieldTypeLabel(field.type) }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span v-if="field.required" class="text-xs text-brand-600 bg-brand-50 px-2 py-1 rounded">필수</span>
              <span v-else class="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">선택</span>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8 text-gray-500">
          추가된 질문이 없습니다.
        </div>
      </div>

      <!-- 하단 버튼 -->
      <div class="flex items-center justify-between pt-4">
        <button
          @click="goBack"
          class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          목록으로
        </button>
        <button
          @click="goToEdit"
          class="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors font-medium"
        >
          편집하기
        </button>
      </div>
    </template>
  </div>
</template>
