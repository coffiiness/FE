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
    companies.value = res.data?.data || []
  } catch (err) {
    error.value = '회사 목록을 불러오는 데 실패했습니다.'
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchCompanies())

let debounceTimer = null
watch(searchQuery, (value) => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => fetchCompanies(value.trim()), 300)
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
  <div class="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#f3f8f7_100%)]">
    <section class="border-b border-slate-200/80 bg-white/90">
      <div class="max-w-5xl mx-auto px-6 py-10">
        <div class="max-w-3xl">
          <h1 class="text-3xl font-semibold tracking-[-0.02em] text-slate-900 mb-2">채용 중인 기업</h1>
          <p class="text-slate-600 mb-6">관심 있는 기업을 찾아 채용 공고를 확인해보세요.</p>
        </div>
        <div class="relative max-w-md">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="기업명으로 검색"
            class="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl bg-white text-sm text-slate-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:outline-none"
          />
        </div>
      </div>
    </section>

    <main class="max-w-5xl mx-auto px-6 py-8">
      <div v-if="loading" class="min-h-[40vh] bg-white"></div>

      <div v-else-if="error" class="text-center py-20 text-gray-500">{{ error }}</div>

      <div v-else>
        <p class="mb-5 text-sm text-slate-600">총 <span class="font-semibold text-slate-900">{{ companies.length }}</span>개 기업이 채용 중입니다.</p>

        <div class="space-y-3">
          <div
            v-for="company in companies"
            :key="company.workspaceId"
            @click="goToCompany(company.workspaceId)"
            class="group flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all hover:border-brand-300 hover:shadow-md"
          >
            <div class="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-brand-100 bg-brand-50 text-base font-bold text-brand-700">
              {{ company.companyName?.charAt(0) || '?' }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="truncate text-base font-semibold text-slate-900 transition-colors group-hover:text-brand-700">{{ company.companyName }}</h3>
              <p class="text-sm text-slate-500">{{ getEmployeeScaleText(company.employeeScale) }}</p>
            </div>
            <span class="inline-flex flex-shrink-0 items-center rounded-lg bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
              {{ company.openCount }}건 채용 중
            </span>
            <svg class="h-5 w-5 flex-shrink-0 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <div v-if="companies.length === 0" class="text-center py-20 text-gray-500">검색 결과가 없습니다.</div>
      </div>
    </main>
  </div>
</template>
