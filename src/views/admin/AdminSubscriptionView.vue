<script setup>
import { ref, computed } from 'vue'

const searchQuery = ref('')
const activeTab = ref('전체')
const currentPage = ref(1)
const itemsPerPage = 8

const tabs = [
  { name: '전체', count: 47 },
  { name: '활성', count: 35 },
  { name: '체험 중', count: 3 },
  { name: '해지', count: 9 }
]

// Mock data — 추후 adminApi.getSubscriptions() 로 교체
const subscriptions = ref([
  {
    company: '스타트업허브',
    domain: 'startuphub.kr',
    initial: '스',
    initialColor: 'bg-purple-500',
    plan: '엔터프라이즈',
    planColor: 'bg-brand-100 text-brand-700',
    users: 10,
    startDate: '2024.08.15',
    monthlyCharge: 890000,
    status: '활성',
    statusColor: 'text-brand-600'
  },
  {
    company: '넥스트코드',
    domain: 'nextcode.io',
    initial: '넥',
    initialColor: 'bg-blue-500',
    plan: '엔터프라이즈',
    planColor: 'bg-brand-100 text-brand-700',
    users: 5,
    startDate: '2024.06.01',
    monthlyCharge: 445000,
    status: '활성',
    statusColor: 'text-brand-600'
  },
  {
    company: '디지털웍스',
    domain: 'digitalworks.kr',
    initial: '디',
    initialColor: 'bg-indigo-500',
    plan: '비즈니스',
    planColor: 'bg-blue-100 text-blue-700',
    users: 8,
    startDate: '2025.02.03',
    monthlyCharge: 0,
    status: '체험 중',
    statusColor: 'text-amber-600'
  },
  {
    company: '테크밸리',
    domain: 'techvalley.com',
    initial: '테',
    initialColor: 'bg-emerald-500',
    plan: '엔터프라이즈',
    planColor: 'bg-brand-100 text-brand-700',
    users: 15,
    startDate: '2024.03.10',
    monthlyCharge: 1335000,
    status: '활성',
    statusColor: 'text-brand-600'
  },
  {
    company: '퓨처랩',
    domain: 'futurelab.co.kr',
    initial: '퓨',
    initialColor: 'bg-violet-500',
    plan: '비즈니스',
    planColor: 'bg-blue-100 text-blue-700',
    users: 3,
    startDate: '2025.01.15',
    monthlyCharge: 0,
    status: '활성',
    statusColor: 'text-brand-600'
  },
  {
    company: '클라우드나인',
    domain: 'cloud9.co.kr',
    initial: '클',
    initialColor: 'bg-sky-500',
    plan: '엔터프라이즈',
    planColor: 'bg-brand-100 text-brand-700',
    users: 15,
    startDate: '2024.01.20',
    monthlyCharge: 1335000,
    status: '해지 예정',
    statusColor: 'text-rose-500'
  },
  {
    company: '그린테크',
    domain: 'greentech.kr',
    initial: '그',
    initialColor: 'bg-teal-500',
    plan: '비즈니스',
    planColor: 'bg-blue-100 text-blue-700',
    users: 4,
    startDate: '2025.01.21',
    monthlyCharge: 0,
    status: '만료',
    statusColor: 'text-gray-400'
  },
  {
    company: '인피니티소프트',
    domain: 'infinitysoft.co.kr',
    initial: '인',
    initialColor: 'bg-rose-500',
    plan: '엔터프라이즈',
    planColor: 'bg-brand-100 text-brand-700',
    users: 22,
    startDate: '2024.05.01',
    monthlyCharge: 1958000,
    status: '활성',
    statusColor: 'text-brand-600'
  }
])

const filteredSubscriptions = computed(() => {
  let result = subscriptions.value
  if (activeTab.value !== '전체') {
    if (activeTab.value === '해지') {
      result = result.filter(s => s.status === '해지 예정' || s.status === '만료')
    } else {
      result = result.filter(s => s.status === activeTab.value)
    }
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(s =>
      s.company.toLowerCase().includes(q) || s.domain.toLowerCase().includes(q)
    )
  }
  return result
})

const totalPages = computed(() =>
  Math.ceil(filteredSubscriptions.value.length / itemsPerPage) || 1
)

const paginatedSubscriptions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredSubscriptions.value.slice(start, start + itemsPerPage)
})

const formatWon = (v) => {
  if (v === 0) return '무료'
  return '₩' + v.toLocaleString('ko-KR')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Search & Actions -->
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <!-- Search -->
        <div class="relative">
          <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="회사명, 도메인 검색..."
            class="pl-10 pr-4 py-2.5 w-80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
          />
        </div>
        <button class="inline-flex items-center px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          필터
        </button>
        <button class="inline-flex items-center px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          내보내기
        </button>
      </div>

      <!-- Status Tabs -->
      <div class="flex items-center gap-2">
        <button
          v-for="tab in tabs"
          :key="tab.name"
          class="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
          :class="
            activeTab === tab.name
              ? 'bg-brand-500 text-white border-brand-500'
              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          "
          @click="activeTab = tab.name; currentPage = 1"
        >
          {{ tab.name }} {{ tab.count }}
        </button>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b border-gray-100 bg-slate-50/50">
              <th class="px-6 py-3.5 font-medium">회사명</th>
              <th class="px-6 py-3.5 font-medium">요금제</th>
              <th class="px-6 py-3.5 font-medium">사용자 수</th>
              <th class="px-6 py-3.5 font-medium">구독 시작일</th>
              <th class="px-6 py-3.5 font-medium">월 청구액</th>
              <th class="px-6 py-3.5 font-medium">상태</th>
              <th class="px-6 py-3.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="sub in paginatedSubscriptions"
              :key="sub.company"
              class="border-b border-gray-50 hover:bg-slate-50/50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" :class="sub.initialColor">
                    {{ sub.initial }}
                  </div>
                  <div>
                    <p class="font-semibold text-gray-900">{{ sub.company }}</p>
                    <p class="text-xs text-gray-400">{{ sub.domain }}</p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="sub.planColor">
                  {{ sub.plan }}
                </span>
              </td>
              <td class="px-6 py-4 text-gray-600">{{ sub.users }}명</td>
              <td class="px-6 py-4 text-gray-500">{{ sub.startDate }}</td>
              <td class="px-6 py-4 text-gray-700 font-medium">{{ formatWon(sub.monthlyCharge) }}</td>
              <td class="px-6 py-4">
                <span class="font-semibold" :class="sub.statusColor">{{ sub.status }}</span>
              </td>
              <td class="px-6 py-4">
                <button class="text-brand-500 hover:text-brand-700 text-sm font-medium">상세 →</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 flex items-center justify-between border-t border-gray-100">
        <p class="text-sm text-gray-500">총 {{ filteredSubscriptions.length }}개 중 {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredSubscriptions.length) }}</p>
        <div class="flex items-center gap-1">
          <button
            v-for="page in totalPages"
            :key="page"
            class="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
            :class="currentPage === page ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'"
            @click="currentPage = page"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
