<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

const router = useRouter()
const route = useRoute()

const applicantId = computed(() => route.params.id)
const loading = ref(true)

// 지원자 데이터
const applicant = ref(null)

// 상태별 배지 스타일
const getStatusStyle = (status) => {
  const styles = {
    '서류 검토': 'bg-teal-100 text-teal-700 border-teal-200',
    '1차 면접': 'bg-blue-100 text-blue-700 border-blue-200',
    '2차 면접': 'bg-blue-100 text-blue-700 border-blue-200',
    '처우 협의': 'bg-amber-100 text-amber-700 border-amber-200',
    '합격': 'bg-green-100 text-green-700 border-green-200',
    '불합격': 'bg-gray-100 text-gray-500 border-gray-200',
  }
  return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200'
}

// 지원자 데이터 로드
onMounted(async () => {
  await loadApplicant()
})

const loadApplicant = async () => {
  loading.value = true
  try {
    // TODO: API 연동 - GET /api/v1/recruitment/applicants/{applicantId}
    // 더미 데이터로 시뮬레이션
    const dummyData = {
      1: {
        id: 1,
        name: '박지원',
        email: 'parkjiwon@email.com',
        phone: '010-1234-5678',
        gender: '여성',
        birthdate: '1995-03-15',
        job: '백엔드 개발자',
        status: '1차 면접',
        nextSchedule: '2024.02.06 10:00',
        appliedDate: '2024.02.01',
        answers: [
          { label: '자기소개', value: '안녕하세요. 3년차 백엔드 개발자 박지원입니다. Java와 Spring Boot를 주로 사용하며, MSA 아키텍처 경험이 있습니다.' },
          { label: '포트폴리오 URL', value: 'https://github.com/parkjiwon' },
        ],
        resume: { name: '박지원_이력서.pdf', url: '#' }
      },
      2: {
        id: 2,
        name: '김철수',
        email: 'kimcs@email.com',
        phone: '010-2345-6789',
        gender: '남성',
        birthdate: '1992-07-22',
        job: '백엔드 개발자',
        status: '2차 면접',
        nextSchedule: '2024.02.07 14:00',
        appliedDate: '2024.01.28',
        answers: [
          { label: '자기소개', value: '5년차 시니어 백엔드 개발자입니다. 대규모 트래픽 처리 경험이 있으며, 팀 리딩 경험도 있습니다.' },
          { label: '포트폴리오 URL', value: 'https://kimcs.dev' },
        ],
        resume: { name: '김철수_이력서.pdf', url: '#' }
      },
      3: {
        id: 3,
        name: '이영희',
        email: 'leeyh@email.com',
        phone: '010-3456-7890',
        gender: '여성',
        birthdate: '1997-11-08',
        job: '프론트엔드 개발자',
        status: '서류 검토',
        nextSchedule: null,
        appliedDate: '2024.02.03',
        answers: [
          { label: '자기소개', value: 'React와 Vue.js를 사용하는 2년차 프론트엔드 개발자입니다.' },
          { label: 'GitHub', value: 'https://github.com/leeyh' },
          { label: '기술 블로그', value: 'https://leeyh.tistory.com' },
        ],
        resume: { name: '이영희_이력서.pdf', url: '#' }
      },
    }

    applicant.value = dummyData[applicantId.value] || null
  } catch (error) {
    console.error('Failed to load applicant:', error)
  } finally {
    loading.value = false
  }
}

// 이니셜 추출
const getInitial = (name) => name?.charAt(0) || ''

// 목록으로 돌아가기
const goBack = () => {
  router.push('/recruitment/applicants')
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <!-- 로딩 -->
    <div v-if="loading" class="text-center py-12 text-gray-500">
      로딩 중...
    </div>

    <!-- 지원자를 찾을 수 없음 -->
    <div v-else-if="!applicant" class="text-center py-12">
      <p class="text-gray-500 mb-4">지원자를 찾을 수 없습니다.</p>
      <button
        @click="goBack"
        class="text-brand-600 hover:text-brand-700 font-medium"
      >
        목록으로 돌아가기
      </button>
    </div>

    <template v-else>
      <!-- 헤더 -->
      <div class="flex items-center gap-3">
        <button
          @click="goBack"
          class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 class="text-2xl font-bold text-gray-900">지원자 상세</h1>
      </div>

      <!-- 기본 정보 -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-start gap-4">
          <!-- 프로필 아바타 -->
          <div class="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-2xl font-bold">
            {{ getInitial(applicant.name) }}
          </div>

          <!-- 정보 -->
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-1">
              <h2 class="text-xl font-bold text-gray-900">{{ applicant.name }}</h2>
              <span
                :class="[getStatusStyle(applicant.status), 'px-3 py-1 rounded-full text-sm font-medium border']"
              >
                {{ applicant.status }}
              </span>
            </div>
            <p class="text-gray-600">{{ applicant.job }}</p>
          </div>
        </div>

        <!-- 상세 정보 그리드 -->
        <div class="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div>
            <p class="text-sm text-gray-500 mb-1">이메일</p>
            <p class="text-gray-900">{{ applicant.email }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">연락처</p>
            <p class="text-gray-900">{{ applicant.phone }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">성별</p>
            <p class="text-gray-900">{{ applicant.gender }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">생년월일</p>
            <p class="text-gray-900">{{ applicant.birthdate }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">지원일</p>
            <p class="text-gray-900">{{ applicant.appliedDate }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500 mb-1">다음 일정</p>
            <p class="text-gray-900">{{ applicant.nextSchedule || '-' }}</p>
          </div>
        </div>
      </div>

      <!-- 이력서 -->
      <div v-if="applicant.resume" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">이력서</h3>
        <a
          :href="applicant.resume.url"
          class="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="font-medium text-gray-900">{{ applicant.resume.name }}</p>
            <p class="text-sm text-gray-500">PDF 문서</p>
          </div>
          <svg class="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      </div>

      <!-- 지원서 답변 -->
      <div v-if="applicant.answers && applicant.answers.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">지원서 답변</h3>
        <div class="space-y-6">
          <div
            v-for="(answer, index) in applicant.answers"
            :key="index"
          >
            <p class="text-sm font-medium text-gray-700 mb-2">{{ answer.label }}</p>
            <p class="text-gray-900 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">{{ answer.value }}</p>
          </div>
        </div>
      </div>

      <!-- 하단 버튼 -->
      <div class="flex items-center justify-start pt-4">
        <button
          @click="goBack"
          class="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
        >
          목록으로
        </button>
      </div>
    </template>
  </div>
</template>
