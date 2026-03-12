<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { applicationBoardApi } from '@/api/applicationBoard'
import { recruitmentApi } from '@/api/recruitment'

const router = useRouter()
const route = useRoute()

const detailId = computed(() => route.params.id)
const loading = ref(true)
const loadError = ref('')
const applicant = ref(null)

const statusLabelMap = {
  DOCUMENT_REVIEW: '서류 검토',
  FIRST_INTERVIEW: '1차 면접',
  SECOND_INTERVIEW: '2차 면접',
  OFFER_NEGOTIATION: '처우 협의',
  HIRED: '합격',
  PASSED: '합격',
  REJECTED: '불합격',
  FAILED: '불합격'
}

const genderLabelMap = {
  MALE: '남성',
  FEMALE: '여성',
  M: '남성',
  F: '여성'
}

const normalizeStatus = (status) => {
  if (!status) return '서류 검토'
  return statusLabelMap[status] || status
}

const normalizeGender = (gender) => {
  if (!gender) return '-'
  return genderLabelMap[gender] || gender
}

const formatDate = (value) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

const formatDateTime = (value) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return String(value)
  }

  const datePart = formatDate(date)
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${datePart} ${hour}:${minute}`
}

const parseJsonSafely = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const toAnswerList = (detail) => {
  const answerList = []
  const pushAnswer = (label, value) => {
    if (value == null || value === '') return
    answerList.push({ label, value: String(value) })
  }

  pushAnswer('간단 자기소개', detail?.shortBio ?? detail?.selfIntroduction)
  pushAnswer('포트폴리오 URL', detail?.portfolioUrl ?? detail?.portfolio)

  if (Array.isArray(detail?.answers)) {
    detail.answers.forEach((item, index) => {
      const label = item?.label ?? item?.question ?? `답변 ${index + 1}`
      const value = item?.value ?? item?.answer
      pushAnswer(label, value)
    })
  }

  const parsedFormFields = parseJsonSafely(detail?.formFields)
  if (Array.isArray(parsedFormFields)) {
    parsedFormFields.forEach((item, index) => {
      const label = item?.label ?? item?.question ?? `답변 ${index + 1}`
      const value = item?.value ?? item?.answer
      pushAnswer(label, value)
    })
  } else if (parsedFormFields && typeof parsedFormFields === 'object') {
    Object.entries(parsedFormFields).forEach(([label, value]) => {
      pushAnswer(label, value)
    })
  }

  if (detail?.answerMap && typeof detail.answerMap === 'object') {
    Object.entries(detail.answerMap).forEach(([label, value]) => {
      pushAnswer(label, value)
    })
  }

  return answerList
}

const toApplicantDetailModel = (detail, recruitmentTitle = '-') => {
  const files = Array.isArray(detail?.files) ? detail.files : []
  const primaryFile = files[0] || null
  const resumeUrl =
    detail?.resumeUrl ?? detail?.resumeDownloadUrl ?? detail?.resume?.url ?? primaryFile?.downloadUrl ?? null
  const resumeName =
    detail?.resumeFileName ??
    detail?.resumeName ??
    detail?.resume?.name ??
    primaryFile?.fileName ??
    (primaryFile ? '이력서 파일' : null)

  return {
    id: detail?.applicationId ?? detail?.applicantId ?? detail?.id ?? detailId.value,
    name: detail?.name ?? detail?.applicantName ?? '-',
    email: detail?.email ?? detail?.applicantEmail ?? '-',
    phone: detail?.phone ?? detail?.phoneNumber ?? '-',
    gender: normalizeGender(detail?.gender ?? detail?.sex),
    birthdate: formatDate(detail?.birthDate ?? detail?.birthdate),
    job: detail?.recruitmentTitle ?? detail?.jobTitle ?? detail?.job ?? recruitmentTitle,
    status: normalizeStatus(detail?.status ?? detail?.applicationStatus ?? detail?.progressStatus),
    nextSchedule: formatDateTime(detail?.nextSchedule ?? detail?.nextInterviewAt ?? detail?.nextScheduleAt),
    appliedDate: formatDate(detail?.appliedAt ?? detail?.appliedDate ?? detail?.createdAt),
    answers: toAnswerList(detail),
    resume: resumeUrl || resumeName ? { name: resumeName, url: resumeUrl } : null
  }
}

const getDetailErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    '지원자 상세 정보를 불러오지 못했습니다.'
  )
}

const loadApplicant = async () => {
  if (!detailId.value) {
    applicant.value = null
    loading.value = false
    loadError.value = '잘못된 접근입니다.'
    return
  }

  loading.value = true
  loadError.value = ''

  try {
    const response = await applicationBoardApi.getApplicationDetail(detailId.value)
    const payload = applicationBoardApi.extractResponseData(response)
    const detail = payload?.application ?? payload?.item ?? payload

    if (!detail || typeof detail !== 'object') {
      applicant.value = null
      loadError.value = '지원자를 찾을 수 없습니다.'
      return
    }

    let recruitmentTitle = '-'
    if (detail?.recruitmentId) {
      try {
        const recruitmentResponse = await recruitmentApi.getRecruitmentDetail(detail.recruitmentId)
        recruitmentTitle = recruitmentResponse?.data?.data?.title || '-'
      } catch {
        recruitmentTitle = '-'
      }
    }

    applicant.value = toApplicantDetailModel(detail, recruitmentTitle)
  } catch (error) {
    applicant.value = null
    loadError.value = getDetailErrorMessage(error)
  } finally {
    loading.value = false
  }
}

onMounted(loadApplicant)
watch(detailId, loadApplicant)

const getStatusStyle = (status) => {
  const styles = {
    '서류 검토': 'bg-teal-100 text-teal-700 border-teal-200',
    '1차 면접': 'bg-blue-100 text-blue-700 border-blue-200',
    '2차 면접': 'bg-blue-100 text-blue-700 border-blue-200',
    '처우 협의': 'bg-amber-100 text-amber-700 border-amber-200',
    합격: 'bg-green-100 text-green-700 border-green-200',
    불합격: 'bg-gray-100 text-gray-500 border-gray-200'
  }
  return styles[status] || 'bg-gray-100 text-gray-700 border-gray-200'
}

const getInitial = (name) => name?.charAt(0) || ''

const goBack = () => {
  router.push('/recruitment/applicants')
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div v-if="loading" class="text-center py-12 text-gray-500">
      로딩 중...
    </div>

    <div v-else-if="!applicant" class="text-center py-12">
      <p class="text-gray-500 mb-4">{{ loadError || '지원자를 찾을 수 없습니다.' }}</p>
      <button
        @click="goBack"
        class="text-brand-600 hover:text-brand-700 font-medium"
      >
        목록으로 돌아가기
      </button>
    </div>

    <template v-else>
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

      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-start gap-4">
          <div class="w-16 h-16 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 text-2xl font-bold">
            {{ getInitial(applicant.name) }}
          </div>

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

      <div v-if="applicant.resume" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">이력서</h3>

        <a
          v-if="applicant.resume.url"
          :href="applicant.resume.url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="font-medium text-gray-900">{{ applicant.resume.name }}</p>
            <p class="text-sm text-gray-500">파일 다운로드</p>
          </div>
        </a>

        <div
          v-else
          class="flex items-center gap-3 p-4 border border-gray-200 rounded-lg bg-gray-50"
        >
          <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="flex-1">
            <p class="font-medium text-gray-900">{{ applicant.resume.name }}</p>
          </div>
        </div>
      </div>

      <div v-if="applicant.answers.length > 0" class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
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
