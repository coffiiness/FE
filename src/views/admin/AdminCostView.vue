<script setup>
import { ref, computed } from 'vue'

// Mock data — 추후 adminApi.getCostSummary() 로 교체
const categories = ref([
  { name: '인건비', amount: 4500000, percent: 54.5, color: 'bg-blue-500', barColor: 'bg-blue-500' },
  { name: '서버 / 인프라', amount: 2100000, percent: 25.5, color: 'bg-amber-500', barColor: 'bg-amber-500' },
  { name: '마케팅', amount: 1200000, percent: 14.5, color: 'bg-violet-500', barColor: 'bg-violet-500' },
  { name: '기타 (외주, 사무)', amount: 450000, percent: 5.5, color: 'bg-rose-500', barColor: 'bg-rose-500' }
])

const monthlyTrend = ref([
  { month: '9월', amount: 7200000 },
  { month: '10월', amount: 7550000 },
  { month: '11월', amount: 7800000 },
  { month: '12월', amount: 8000000 },
  { month: '1월', amount: 8100000 },
  { month: '2월', amount: 8250000, current: true }
])

const costItems = ref([
  { id: 'CST-001', category: '인건비', categoryColor: 'bg-blue-100 text-blue-700', name: '개발자 급여 (본인)', amount: 4500000, month: '2025.02', note: '월 고정비' },
  { id: 'CST-002', category: '서버/인프라', categoryColor: 'bg-amber-100 text-amber-700', name: 'AWS EC2 + RDS', amount: 1200000, month: '2025.02', note: '운영 서버' },
  { id: 'CST-003', category: '서버/인프라', categoryColor: 'bg-amber-100 text-amber-700', name: 'CloudFront + S3', amount: 350000, month: '2025.02', note: 'CDN/스토리지' },
  { id: 'CST-004', category: '서버/인프라', categoryColor: 'bg-amber-100 text-amber-700', name: '도메인 / SSL', amount: 50000, month: '2025.02', note: '연간 비용 월할' },
  { id: 'CST-005', category: '서버/인프라', categoryColor: 'bg-amber-100 text-amber-700', name: '모니터링 (Datadog)', amount: 500000, month: '2025.02', note: 'Pro 플랜' },
  { id: 'CST-006', category: '마케팅', categoryColor: 'bg-violet-100 text-violet-700', name: 'Google Ads', amount: 800000, month: '2025.02', note: '키워드 광고' },
  { id: 'CST-007', category: '마케팅', categoryColor: 'bg-violet-100 text-violet-700', name: '콘텐츠 마케팅', amount: 400000, month: '2025.02', note: '블로그/SNS' },
  { id: 'CST-008', category: '기타', categoryColor: 'bg-rose-100 text-rose-700', name: '사무용품 / 비품', amount: 150000, month: '2025.02', note: '' },
  { id: 'CST-009', category: '기타', categoryColor: 'bg-rose-100 text-rose-700', name: '외주 디자인', amount: 300000, month: '2025.02', note: '랜딩 페이지' }
])

const maxTrend = computed(() =>
  Math.max(...monthlyTrend.value.map(d => d.amount))
)

const maxCategory = computed(() =>
  Math.max(...categories.value.map(c => c.amount))
)

const formatWon = (v) => '₩' + v.toLocaleString('ko-KR')

const formatShort = (v) => {
  if (v >= 1000000) return '₩' + (v / 1000000).toFixed(1) + 'M'
  if (v >= 1000) return '₩' + (v / 1000).toFixed(0) + 'K'
  return '₩' + v
}
</script>

<template>
  <div class="space-y-6">
    <!-- Category Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      <div
        v-for="cat in categories"
        :key="cat.name"
        class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative overflow-hidden"
      >
        <div class="absolute top-0 left-0 right-0 h-1" :class="cat.color" />
        <p class="text-sm text-gray-500 mb-1">{{ cat.name }}</p>
        <p class="text-2xl font-bold text-gray-900">{{ formatWon(cat.amount) }}</p>
        <p class="text-sm text-gray-400 mt-1">전체 비용의 {{ cat.percent }}%</p>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <!-- Category Bar -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 class="text-lg font-bold text-gray-800 mb-6">카테고리별 비용 비중</h3>
        <div class="space-y-5">
          <div v-for="cat in categories" :key="cat.name" class="flex items-center gap-4">
            <span class="text-sm text-gray-600 w-24 text-right shrink-0">{{ cat.name }}</span>
            <div class="flex-1 bg-gray-100 rounded-full h-8 relative overflow-hidden">
              <div
                class="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700"
                :class="cat.barColor"
                :style="{ width: (cat.amount / maxCategory * 100) + '%' }"
              >
                <span class="text-white text-xs font-bold">{{ formatShort(cat.amount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Monthly Trend -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 class="text-lg font-bold text-gray-800 mb-6">월별 총 비용 추이</h3>
        <div class="flex items-end justify-between h-48 px-2 gap-4">
          <div v-for="d in monthlyTrend" :key="d.month" class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full flex justify-center items-end h-40">
              <div
                class="w-12 rounded-t transition-all duration-500"
                :class="d.current ? 'bg-brand-400' : 'bg-gray-200'"
                :style="{ height: (d.amount / maxTrend * 100) + '%' }"
              />
            </div>
            <span
              class="text-xs mt-1 font-medium"
              :class="d.current ? 'text-brand-500' : 'text-gray-500'"
            >{{ d.month }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Cost Detail Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-bold text-gray-800">비용 상세 내역</h3>
          <span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">MOCK DATA</span>
        </div>
        <button class="inline-flex items-center px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors">
          <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          비용 등록
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b border-gray-100">
              <th class="px-6 py-3.5 font-medium">비용 ID</th>
              <th class="px-6 py-3.5 font-medium">카테고리</th>
              <th class="px-6 py-3.5 font-medium">항목명</th>
              <th class="px-6 py-3.5 font-medium">금액</th>
              <th class="px-6 py-3.5 font-medium">발생월</th>
              <th class="px-6 py-3.5 font-medium">비고</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in costItems"
              :key="item.id"
              class="border-b border-gray-50 hover:bg-slate-50/50 transition-colors"
            >
              <td class="px-6 py-4 text-gray-500 font-mono">{{ item.id }}</td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="item.categoryColor">
                  {{ item.category }}
                </span>
              </td>
              <td class="px-6 py-4 text-gray-900">{{ item.name }}</td>
              <td class="px-6 py-4 font-semibold text-gray-800">{{ formatWon(item.amount) }}</td>
              <td class="px-6 py-4 text-gray-500">{{ item.month }}</td>
              <td class="px-6 py-4 text-gray-400">{{ item.note }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
