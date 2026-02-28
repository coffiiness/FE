<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApplicantAuth } from '@/composables/useApplicantAuth'

const route = useRoute()
const router = useRouter()
const { isAuthenticated, logout } = useApplicantAuth()

const companySlug = computed(() => route.params.companySlug)

const searchQuery = ref('')
const selectedCategory = ref('')

const companyInfo = {
  naver: { name: 'NAVER', logo: 'N' },
  kakao: { name: 'Kakao', logo: 'K' },
}

const company = computed(() => companyInfo[companySlug.value] || { name: companySlug.value, logo: companySlug.value?.charAt(0)?.toUpperCase() })

// 직무 카테고리
const categories = ['개발', '기획', '디자인', '마케팅', '경영지원']

// 샘플 채용 공고
const jobs = ref([
  { id: 1, title: '백엔드 개발자', category: '개발', tags: ['Java', 'Spring', 'MSA'], deadline: '2024.03.15', templateId: 'tpl-1' },
  { id: 2, title: '프론트엔드 개발자', category: '개발', tags: ['Vue.js', 'TypeScript', 'React'], deadline: '2024.03.20', templateId: 'tpl-2' },
  { id: 3, title: 'DevOps 엔지니어', category: '개발', tags: ['Kubernetes', 'AWS', 'CI/CD'], deadline: '2024.03.25', templateId: 'tpl-1' },
  { id: 4, title: '서비스 기획자', category: '기획', tags: ['B2C', '커머스', '신입/경력'], deadline: '2024.03.18', templateId: 'tpl-3' },
  { id: 5, title: 'UI/UX 디자이너', category: '디자인', tags: ['Figma', '모바일', '웹'], deadline: '2024.03.22', templateId: 'tpl-3' },
])

// ?꾪꽣留?
const filteredJobs = computed(() => {
  return jobs.value.filter(job => {
    const matchesSearch = !searchQuery.value ||
      job.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      job.tags.some(tag => tag.toLowerCase().includes(searchQuery.value.toLowerCase()))
    const matchesCategory = !selectedCategory.value || job.category === selectedCategory.value
    return matchesSearch && matchesCategory
  })
})

const goToApply = (jobId) => {
  router.push(`/careers/${companySlug.value}/${jobId}/apply`)
}

const toggleCategory = (category) => {
  selectedCategory.value = selectedCategory.value === category ? '' : category
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
    <header class="border-b border-gray-200">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white font-bold">
            {{ company.logo }}
          </div>
          <span class="text-xl font-bold text-gray-900">{{ company.name }} Careers</span>
        </div>
        <div class="flex items-center gap-6">
          <nav class="flex items-center gap-6">
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

    <div class="max-w-6xl mx-auto px-6 py-8">
      <div class="flex gap-8">
        <aside class="w-56 flex-shrink-0">
          <div class="sticky top-8">
            <h3 class="text-sm font-semibold text-gray-900 mb-4">필터</h3>

            <div class="mb-6">
              <h4 class="text-sm font-medium text-gray-700 mb-3">직무</h4>
              <div class="space-y-2">
                <label
                  v-for="category in categories"
                  :key="category"
                  class="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    :checked="selectedCategory === category"
                    @change="toggleCategory(category)"
                    class="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                  />
                  <span class="text-sm text-gray-600">{{ category }}</span>
                </label>
              </div>
            </div>
          </div>
        </aside>

        <main class="flex-1">
          <div class="flex items-center justify-between mb-6">
            <p class="text-gray-600">
              총 <span class="font-semibold text-gray-900">{{ filteredJobs.length }}</span>개의 채용공고가 있습니다.
            </p>
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="검색어를 입력하세요"
                class="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 w-64"
              />
              <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div class="space-y-4">
            <div
              v-for="job in filteredJobs"
              :key="job.id"
              @click="goToApply(job.id)"
              class="border border-gray-200 rounded-lg p-6 hover:border-brand-400 hover:shadow-md transition-all cursor-pointer"
            >
              <div class="flex items-start justify-between">
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-2">{{ job.title }}</h3>
                  <div class="flex flex-wrap gap-2">
                    <span
                      v-for="tag in job.tags"
                      :key="tag"
                      class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-sm text-gray-500">{{ job.deadline }}</p>
                  <p class="text-xs text-gray-400 mt-1">마감</p>
                </div>
              </div>
            </div>

            <div v-if="filteredJobs.length === 0" class="text-center py-12 text-gray-500">
              검색 결과가 없습니다.
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>



