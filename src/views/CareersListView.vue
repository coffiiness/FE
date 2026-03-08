<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { careerApi } from '@/api/career'
import { useApplicantAuth } from '@/composables/useApplicantAuth'

const route = useRoute()
const router = useRouter()
const { isAuthenticated, logout } = useApplicantAuth()

const companySlug = computed(() => route.params.companySlug)


// API 데이터
const jobs = ref([])
const loading = ref(true)
const error = ref(null)

const searchQuery = ref('')
const selectedCareerType = ref('')

// 회사 정보 (첫 글자를 로고로 사용)
const companyName = ref('')

const fetchRecruitments = async (search) => {
  loading.value = true
  error.value = null
  try {
    const res = await careerApi.getRecruitments(companySlug.value, search || undefined)
    jobs.value = res.data.data || []
  } catch (err) {
    error.value = '채용 공고를 불러오는데 실패했습니다.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    // 회사명 조회를 위해 전체 회사 목록에서 찾기
    const companiesRes = await careerApi.getCompanies()
    const companies = companiesRes.data.data || []
    const matched = companies.find(c => c.workspaceId === companySlug.value)
    if (matched) {
      companyName.value = matched.companyName
    } else {
      companyName.value = companySlug.value
    }

    // 해당 회사의 채용 공고 조회
    await fetchRecruitments()
  } catch (err) {
    error.value = '채용 공고를 불러오는데 실패했습니다.'
    console.error(err)
  }
})

let debounceTimer = null
watch(searchQuery, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchRecruitments(val.trim()), 300)
})

const company = computed(() => ({
  name: companyName.value || companySlug.value,
  logo: (companyName.value || companySlug.value)?.charAt(0)?.toUpperCase() || '?'
}))

// 경력 유형 필터 옵션
const careerTypes = [
  { label: '신입', value: 'NEW' },
  { label: '경력', value: 'EXPERIENCED' },
  { label: '무관', value: 'IRRELEVANT' }
]

// 경력 텍스트 변환
const getCareerText = (job) => {
  if (job.careerType === 'NEW') return '신입'
  if (job.careerType === 'EXPERIENCED') {
    const min = job.minExperienceYears
    const max = job.maxExperienceYears
    if (min && max) return `경력 ${min}~${max}년`
    if (min) return `경력 ${min}년 이상`
    return '경력'
  }
  return '경력 무관'
}

// 마감일 텍스트
const getDeadlineText = (endDate) => {
  if (!endDate) return '-'
  const end = new Date(endDate)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return '마감'
  if (diffDays <= 3) return `D-${diffDays} (마감 임박)`
  return `D-${diffDays}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
}

// 필터링 (경력 유형만 클라이언트 필터, 제목 검색은 서버 사이드)
const filteredJobs = computed(() => {
  return jobs.value.filter(job => {
    return !selectedCareerType.value || job.careerType === selectedCareerType.value
  })
})

// 지원하기
const goToApply = (recruitmentId) => {
  router.push(`/careers/${companySlug.value}/${recruitmentId}/apply`)
}

// 카테고리 선택
const toggleCareerType = (type) => {
  selectedCareerType.value = selectedCareerType.value === type ? '' : type
}

const handleAuthAction = () => {
  if (isAuthenticated.value) {
    logout()
    router.push(`/careers/${companySlug.value}`)
  } else {
    router.push({ path: '/applicants/login', query: { redirect: route.fullPath } })
  }
}
</script>

<template>
  <div class="min-h-screen bg-white">
    <!-- Header -->
    <header class="border-b border-gray-200">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-brand-600 rounded flex items-center justify-center text-white font-bold">
            {{ company.logo }}
          </div>
          <span class="text-xl font-bold text-gray-900">{{ company.name }} Careers</span>
        </div>
        <div class="flex items-center gap-6">
          <nav class="flex items-center gap-6">
            <button @click="router.push('/careers')" class="text-gray-600 hover:text-gray-900 font-medium text-sm">
              전체 기업
            </button>
            <span class="text-gray-900 font-medium border-b-2 border-gray-900 pb-1">APPLY</span>
          </nav>
          <button
            @click="handleAuthAction"
            class="px-4 py-2 text-sm font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            {{ isAuthenticated ? '로그아웃' : '로그인' }}
          </button>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-20">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="max-w-6xl mx-auto px-6 py-20 text-center text-gray-500">
      <p>{{ error }}</p>
    </div>

    <!-- Main Content -->
    <div v-else class="max-w-6xl mx-auto px-6 py-8">
      <div class="flex gap-8">
        <!-- Sidebar Filter -->
        <aside class="w-56 flex-shrink-0">
          <div class="sticky top-8">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">필터</h3>

            <!-- Career Type Filter -->
            <div class="mb-6">
              <h4 class="text-sm font-medium text-gray-700 mb-3">경력 유형</h4>
              <div class="space-y-2">
                <label
                  v-for="type in careerTypes"
                  :key="type.value"
                  class="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :checked="selectedCareerType === type.value"
                    @change="toggleCareerType(type.value)"
                    class="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                  />
                  <span class="text-sm text-gray-600">{{ type.label }}</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        <!-- Job List -->
        <main class="flex-1">
          <!-- Search & Count -->
          <div class="flex items-center justify-between mb-6">
            <p class="text-gray-600">
              총 <span class="font-semibold text-gray-900">{{ filteredJobs.length }}</span>개의 채용공고가 있습니다.
            </p>
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="공고 검색"
                class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-64"
              />
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <!-- Job Cards -->
          <div class="space-y-4">
            <div
              v-for="job in filteredJobs"
              :key="job.recruitmentId"
              @click="goToApply(job.recruitmentId)"
              class="border border-gray-200 rounded-lg p-6 hover:border-brand-400 hover:shadow-md transition-all cursor-pointer"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ job.title }}</h3>
                  <div class="flex flex-wrap gap-2 mb-3">
                    <span class="px-2 py-1 bg-brand-50 text-brand-700 text-xs font-bold rounded">
                      {{ getCareerText(job) }}
                    </span>
                    <span v-if="job.targetCount" class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {{ job.targetCount }}명 모집
                    </span>
                  </div>
                </div>
                <div class="text-right ml-4 flex-shrink-0">
                  <p class="text-sm font-semibold" :class="getDeadlineText(job.endDate).includes('임박') ? 'text-rose-500' : 'text-gray-600'">
                    {{ getDeadlineText(job.endDate) }}
                  </p>
                  <p class="text-xs text-gray-400 mt-1">
                    {{ formatDate(job.startDate) }} ~ {{ formatDate(job.endDate) }}
                  </p>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="filteredJobs.length === 0" class="text-center py-12 text-gray-500">
              채용 공고가 없습니다.
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

