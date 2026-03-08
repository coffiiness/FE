<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { careerApi } from '@/api/career'

const router = useRouter()

const companies = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')

const fetchCompanies = async (search) => {
  loading.value = true
  error.value = null
  try {
    const res = await careerApi.getCompanies(search || undefined)
    companies.value = res.data.data || []
  } catch (err) {
    error.value = '회사 목록을 불러오는데 실패했습니다.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchCompanies())

let debounceTimer = null
watch(searchQuery, (val) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchCompanies(val.trim()), 300)
})

const getEmployeeScaleText = (scale) => {
  const map = {
    SCALE_1_10: '1~10명',
    SCALE_11_50: '11~50명',
    SCALE_51_200: '51~200명',
    SCALE_201_500: '201~500명',
    SCALE_501_PLUS: '500명 이상'
  }
  return map[scale] || scale || '-'
}

const goToCompany = (workspaceId) => {
  router.push(`/careers/${workspaceId}`)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero -->
    <section class="bg-white border-b border-gray-200">
      <div class="max-w-5xl mx-auto px-6 py-12 text-center">
        <h1 class="text-3xl font-bold text-gray-900 mb-3">채용 중인 기업</h1>
        <p class="text-gray-600 mb-8">다양한 기업의 채용 공고를 확인하고 지원해 보세요.</p>
        <div class="relative max-w-md mx-auto">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="기업명으로 검색"
            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm text-black focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>
      </div>
    </section>

    <!-- Content -->
    <main class="max-w-5xl mx-auto px-6 py-8">
      <!-- Loading -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="text-center py-20 text-gray-500">
        <p>{{ error }}</p>
      </div>

      <!-- Company List -->
      <div v-else>
        <p class="text-gray-600 mb-6">
          총 <span class="font-semibold text-gray-900">{{ companies.length }}</span>개 기업이 채용 중입니다.
        </p>

        <div class="space-y-4">
          <div
            v-for="company in companies"
            :key="company.workspaceId"
            @click="goToCompany(company.workspaceId)"
            class="bg-white border border-gray-200 rounded-xl p-6 hover:border-brand-400 hover:shadow-lg transition-all cursor-pointer group flex items-center gap-4"
          >
            <div class="w-12 h-12 bg-brand-50 border border-brand-100 rounded-xl flex items-center justify-center text-brand-600 font-bold text-lg flex-shrink-0">
              {{ company.companyName?.charAt(0) || '?' }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-bold text-gray-900 group-hover:text-brand-600 transition-colors truncate">
                {{ company.companyName }}
              </h3>
              <p class="text-sm text-gray-500">{{ getEmployeeScaleText(company.employeeScale) }}</p>
            </div>
            <span class="inline-flex items-center px-3 py-1 bg-brand-50 text-brand-700 text-sm font-bold rounded-lg flex-shrink-0">
              {{ company.openCount }}건 채용 중
            </span>
            <svg class="w-5 h-5 text-gray-400 group-hover:text-brand-600 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <!-- Empty -->
        <div v-if="companies.length === 0" class="text-center py-20 text-gray-500">
          검색 결과가 없습니다.
        </div>
      </div>
    </main>
  </div>
</template>
