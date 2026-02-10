<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const companySlug = computed(() => route.params.companySlug)
const jobId = computed(() => route.params.jobId)

// 더미 회사 정보
const companyInfo = {
  naver: { name: 'NAVER', logo: 'N' },
  kakao: { name: 'Kakao', logo: 'K' },
}

const company = computed(() => companyInfo[companySlug.value] || { name: companySlug.value, logo: companySlug.value?.charAt(0)?.toUpperCase() })

// 템플릿 데이터 (API에서 받아올 JSON)
const template = ref(null)
const loading = ref(true)

// 폼 데이터
const formData = ref({})

// 더미 템플릿 데이터 (실제로는 API에서 templateId로 조회)
const dummyTemplates = {
  'tpl-1': {
    id: 'tpl-1',
    title: '백엔드 개발자 지원서',
    jobTitle: '백엔드 개발자',
    fields: [
      { id: 'name', type: 'text', label: '이름', required: true, placeholder: '이름' },
      { id: 'gender', type: 'radio', label: '성별', required: true, options: ['남성', '여성'] },
      { id: 'birthdate', type: 'date', label: '생년월일', required: true, placeholder: 'YYYY-MM-DD' },
      { id: 'phone', type: 'text', label: '번호', required: true, placeholder: '010-0000-0000' },
      { id: 'email', type: 'email', label: '이메일', required: true, placeholder: 'example@email.com' },
      { id: 'intro', type: 'textarea', label: '간단 자기소개', required: true, placeholder: '자기소개를 입력하세요...', maxLength: 500 },
      { id: 'portfolio', type: 'text', label: '포트폴리오 URL', required: false, placeholder: 'https://github.com/...' },
    ]
  },
  'tpl-2': {
    id: 'tpl-2',
    title: '프론트엔드 개발자 지원서',
    jobTitle: '프론트엔드 개발자',
    fields: [
      { id: 'name', type: 'text', label: '이름', required: true, placeholder: '이름' },
      { id: 'gender', type: 'radio', label: '성별', required: true, options: ['남성', '여성'] },
      { id: 'birthdate', type: 'date', label: '생년월일', required: true, placeholder: 'YYYY-MM-DD' },
      { id: 'phone', type: 'text', label: '번호', required: true, placeholder: '010-0000-0000' },
      { id: 'email', type: 'email', label: '이메일', required: true, placeholder: 'example@email.com' },
      { id: 'intro', type: 'textarea', label: '간단 자기소개', required: true, placeholder: '자기소개를 입력하세요...', maxLength: 500 },
      { id: 'github', type: 'text', label: 'GitHub', required: false, placeholder: 'https://github.com/...' },
      { id: 'blog', type: 'text', label: '기술 블로그', required: false, placeholder: 'https://...' },
    ]
  },
  'tpl-3': {
    id: 'tpl-3',
    title: '일반 지원서',
    jobTitle: '서비스 기획자',
    fields: [
      { id: 'name', type: 'text', label: '이름', required: true, placeholder: '이름' },
      { id: 'gender', type: 'radio', label: '성별', required: true, options: ['남성', '여성'] },
      { id: 'birthdate', type: 'date', label: '생년월일', required: true, placeholder: 'YYYY-MM-DD' },
      { id: 'phone', type: 'text', label: '번호', required: true, placeholder: '010-0000-0000' },
      { id: 'email', type: 'email', label: '이메일', required: true, placeholder: 'example@email.com' },
      { id: 'intro', type: 'textarea', label: '간단 자기소개', required: true, placeholder: '자기소개를 입력하세요...', maxLength: 500 },
    ]
  }
}

// 더미 공고-템플릿 매핑
const jobTemplateMap = {
  '1': 'tpl-1',
  '2': 'tpl-2',
  '3': 'tpl-1',
  '4': 'tpl-3',
  '5': 'tpl-3',
}

// 템플릿 로드
onMounted(() => {
  // 실제로는 API 호출: GET /api/jobs/:jobId/template
  setTimeout(() => {
    const templateId = jobTemplateMap[jobId.value] || 'tpl-3'
    template.value = dummyTemplates[templateId]

    // 폼 데이터 초기화
    template.value.fields.forEach(field => {
      formData.value[field.id] = ''
    })

    loading.value = false
  }, 300)
})

// 취소
const handleCancel = () => {
  router.push(`/careers/${companySlug.value}`)
}

// 제출
const handleSubmit = () => {
  // 필수 필드 검증
  const missingFields = template.value.fields
    .filter(f => f.required && !formData.value[f.id])
    .map(f => f.label)

  if (missingFields.length > 0) {
    alert(`다음 필수 항목을 입력해주세요: ${missingFields.join(', ')}`)
    return
  }

  // TODO: API 연동 - POST /api/applications
  console.log('Submit:', formData.value)
  alert('지원서가 제출되었습니다.')
  router.push(`/careers/${companySlug.value}`)
}

// textarea 글자수
const getTextLength = (fieldId) => {
  return formData.value[fieldId]?.length || 0
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 헤더 -->
    <header class="bg-white border-b border-gray-200">
      <div class="max-w-2xl mx-auto px-6 h-16 flex items-center">
        <button @click="handleCancel" class="flex items-center gap-2 text-gray-600 hover:text-gray-900">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          <span class="font-medium">{{ company.name }} Careers</span>
        </button>
      </div>
    </header>

    <!-- 로딩 -->
    <div v-if="loading" class="max-w-2xl mx-auto px-6 py-12 text-center text-gray-500">
      로딩 중...
    </div>

    <!-- 지원서 폼 -->
    <main v-else class="max-w-2xl mx-auto px-6 py-8">
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <!-- 제목 -->
        <h1 class="text-2xl font-bold text-gray-900 mb-2">지원서 작성</h1>
        <p class="text-gray-600 mb-8">아래 양식을 작성하고 지원서를 제출해 주세요.</p>

        <!-- 폼 필드 -->
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <div v-for="field in template.fields" :key="field.id">
            <!-- 라벨 -->
            <label class="block text-sm font-medium text-gray-700 mb-2">
              {{ field.label }}
              <span v-if="field.required" class="text-red-500 ml-1">*</span>
            </label>

            <!-- 텍스트 입력 -->
            <div v-if="field.type === 'text' || field.type === 'email'" class="relative">
              <span v-if="field.id === 'name'" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </span>
              <span v-else-if="field.id === 'email'" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <span v-else-if="field.id === 'phone'" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </span>
              <input
                v-model="formData[field.id]"
                :type="field.type"
                :placeholder="field.placeholder"
                :class="['w-full py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500', field.id === 'name' || field.id === 'email' || field.id === 'phone' ? 'pl-10 pr-4' : 'px-4']"
              />
            </div>

            <!-- 날짜 입력 -->
            <div v-else-if="field.type === 'date'" class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </span>
              <input
                v-model="formData[field.id]"
                type="date"
                :placeholder="field.placeholder"
                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            <!-- 라디오 버튼 -->
            <div v-else-if="field.type === 'radio'" class="flex gap-6">
              <label
                v-for="option in field.options"
                :key="option"
                class="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  :name="field.id"
                  :value="option"
                  v-model="formData[field.id]"
                  class="w-4 h-4 text-brand-600 border-gray-300 focus:ring-brand-500"
                />
                <span class="text-gray-700">{{ option }}</span>
              </label>
            </div>

            <!-- 텍스트영역 -->
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

            <!-- 파일 업로드 -->
            <div v-else-if="field.type === 'file'">
              <input
                type="file"
                :id="field.id"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
          </div>

          <!-- 버튼 영역 -->
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
              지원서 제출
            </button>
          </div>
        </form>

        <!-- 개인정보 동의 문구 -->
        <p class="text-sm text-gray-500 text-center mt-6">
          지원서를 제출하면 '<span class="text-brand-600 underline cursor-pointer">개인정보</span>' 처리방침에 동의하게 됩니다.
        </p>
      </div>
    </main>
  </div>
</template>
