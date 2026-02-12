<script setup>
import { ref, computed } from 'vue'

const periodTab = ref('monthly')

// Mock data — 추후 adminApi.getDashboardSummary() 로 교체
const summary = ref({
  mrr: 12430000,
  mrrGrowth: 12.3,
  subscribers: 47,
  newThisMonth: 5,
  churnRate: 2.1,
  churnImprove: -0.5,
  totalCost: 8250000,
  costGrowth: 3.1
})

const trendData = ref([
  { month: '7월', revenue: 8200000, cost: 6800000 },
  { month: '8월', revenue: 8600000, cost: 7000000 },
  { month: '9월', revenue: 9000000, cost: 7200000 },
  { month: '10월', revenue: 9200000, cost: 7550000 },
  { month: '11월', revenue: 10100000, cost: 7800000 },
  { month: '12월', revenue: 10500000, cost: 8000000 },
  { month: '1월', revenue: 11070000, cost: 8100000 },
  { month: '2월', revenue: 12430000, cost: 8250000 }
])

const planDistribution = ref([
  { name: '비즈니스 (무료)', count: 26, color: 'bg-brand-400' },
  { name: '엔터프라이즈', count: 12, color: 'bg-amber-400' },
  { name: '해지 / 만료', count: 9, color: 'bg-slate-300' }
])

const totalCustomers = computed(() =>
  planDistribution.value.reduce((sum, p) => sum + p.count, 0)
)

const recentChanges = ref([
  { company: '스타트업허브', plan: '엔터프라이즈', type: '신규 구독', typeColor: 'text-brand-500', date: '2025.02.08', amount: 890000, status: '활성', statusColor: 'bg-brand-100 text-brand-700' },
  { company: '넥스트코드', plan: '비즈니스 → 엔터프라이즈', type: '업그레이드', typeColor: 'text-blue-500', date: '2025.02.05', amount: 445000, status: '활성', statusColor: 'bg-brand-100 text-brand-700' },
  { company: '디지털웍스', plan: '비즈니스', type: '신규 가입', typeColor: 'text-brand-500', date: '2025.02.03', amount: 0, status: '활성', statusColor: 'bg-brand-100 text-brand-700' },
  { company: '클라우드나인', plan: '엔터프라이즈', type: '해지 요청', typeColor: 'text-rose-500', date: '2025.02.01', amount: 1335000, status: '해지 예정', statusColor: 'bg-rose-100 text-rose-700' }
])

const maxRevenue = computed(() =>
  Math.max(...trendData.value.map(d => d.revenue))
)

const formatWon = (v) => {
  if (v === 0) return '무료'
  return '₩' + v.toLocaleString('ko-KR')
}
</script>

<template>
  <div class="space-y-6">
    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
      <!-- MRR -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center text-sm text-gray-500 mb-2">
          <svg class="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          MRR (월간 반복 매출)
        </div>
        <p class="text-3xl font-bold text-gray-900">{{ formatWon(summary.mrr) }}</p>
        <p class="text-sm mt-1 text-brand-500">
          <svg class="w-3.5 h-3.5 inline mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          +{{ summary.mrrGrowth }}% vs 전월
        </p>
      </div>

      <!-- Subscribers -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center text-sm text-gray-500 mb-2">
          <svg class="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          구독 고객 수
        </div>
        <p class="text-3xl font-bold text-gray-900">{{ summary.subscribers }} <span class="text-lg font-normal text-gray-500">개사</span></p>
        <p class="text-sm mt-1 text-brand-500">
          <svg class="w-3.5 h-3.5 inline mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
          +{{ summary.newThisMonth }} 신규 (이번 달)
        </p>
      </div>

      <!-- Churn Rate -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center text-sm text-gray-500 mb-2">
          <svg class="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          이탈률 (Churn Rate)
        </div>
        <p class="text-3xl font-bold text-gray-900">{{ summary.churnRate }}%</p>
        <p class="text-sm mt-1 text-brand-500">
          <svg class="w-3.5 h-3.5 inline mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
          </svg>
          {{ summary.churnImprove }}%p 개선
        </p>
      </div>

      <!-- Total Cost -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center text-sm text-gray-500 mb-2">
          <svg class="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          월간 비용 합계
        </div>
        <p class="text-3xl font-bold text-gray-900">{{ formatWon(summary.totalCost) }}</p>
        <p class="text-sm mt-1 text-rose-500">
          <svg class="w-3.5 h-3.5 inline mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          +{{ summary.costGrowth }}% vs 전월
        </p>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <!-- Revenue / Cost Trend -->
      <div class="xl:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-bold text-gray-800">매출 · 비용 추이 (최근 8개월)</h3>
          <div class="flex rounded-lg overflow-hidden border border-gray-200">
            <button
              class="px-4 py-1.5 text-sm font-medium transition-colors"
              :class="periodTab === 'monthly' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
              @click="periodTab = 'monthly'"
            >월별</button>
            <button
              class="px-4 py-1.5 text-sm font-medium transition-colors"
              :class="periodTab === 'quarterly' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
              @click="periodTab = 'quarterly'"
            >분기별</button>
          </div>
        </div>

        <!-- Simple Bar Chart -->
        <div class="flex items-end justify-between h-56 px-2 gap-3">
          <div v-for="d in trendData" :key="d.month" class="flex-1 flex flex-col items-center gap-1">
            <div class="w-full flex justify-center gap-1 items-end h-48">
              <!-- Revenue bar -->
              <div
                class="w-5 bg-brand-400 rounded-t transition-all duration-500"
                :style="{ height: (d.revenue / maxRevenue * 100) + '%' }"
              />
              <!-- Cost bar -->
              <div
                class="w-5 bg-gray-200 rounded-t transition-all duration-500"
                :style="{ height: (d.cost / maxRevenue * 100) + '%' }"
              />
            </div>
            <span class="text-xs text-gray-500 mt-1">{{ d.month }}</span>
          </div>
        </div>

        <div class="flex items-center justify-center gap-6 mt-4 text-sm text-gray-500">
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-sm bg-brand-400" /> 매출
          </span>
          <span class="flex items-center gap-1.5">
            <span class="w-3 h-3 rounded-sm bg-gray-200" /> 비용
          </span>
        </div>
      </div>

      <!-- Plan Distribution Donut -->
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 class="text-lg font-bold text-gray-800 mb-6">요금제별 고객 비중</h3>

        <div class="flex flex-col items-center">
          <!-- Donut Chart (CSS) -->
          <div class="relative w-44 h-44 mb-6">
            <svg viewBox="0 0 36 36" class="w-full h-full -rotate-90">
              <circle
                v-for="(plan, i) in planDistribution"
                :key="plan.name"
                cx="18" cy="18" r="15.91549430918954"
                fill="none"
                :stroke="i === 0 ? '#2dd4bf' : i === 1 ? '#fbbf24' : '#cbd5e1'"
                stroke-width="3.5"
                :stroke-dasharray="(plan.count / totalCustomers * 100) + ' ' + (100 - plan.count / totalCustomers * 100)"
                :stroke-dashoffset="-(planDistribution.slice(0, i).reduce((s, p) => s + p.count / totalCustomers * 100, 0))"
              />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center">
              <span class="text-3xl font-bold text-gray-900">{{ totalCustomers }}</span>
              <span class="text-xs text-gray-500">전체 고객</span>
            </div>
          </div>

          <!-- Legend -->
          <div class="space-y-3 w-full">
            <div v-for="plan in planDistribution" :key="plan.name" class="flex items-center justify-between text-sm">
              <span class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :class="plan.color" />
                {{ plan.name }}
              </span>
              <span class="text-gray-500">— {{ plan.count }}개사</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Changes -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100">
      <div class="p-6 border-b border-gray-100">
        <h3 class="text-lg font-bold text-gray-800">최근 구독 변동</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b border-gray-100">
              <th class="px-6 py-3 font-medium">회사명</th>
              <th class="px-6 py-3 font-medium">요금제</th>
              <th class="px-6 py-3 font-medium">변동 유형</th>
              <th class="px-6 py-3 font-medium">변동일</th>
              <th class="px-6 py-3 font-medium">월 청구액</th>
              <th class="px-6 py-3 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in recentChanges"
              :key="row.company + row.date"
              class="border-b border-gray-50 hover:bg-slate-50 transition-colors"
            >
              <td class="px-6 py-4 font-semibold text-gray-900">{{ row.company }}</td>
              <td class="px-6 py-4 text-gray-600">{{ row.plan }}</td>
              <td class="px-6 py-4 font-medium" :class="row.typeColor">{{ row.type }}</td>
              <td class="px-6 py-4 text-gray-500">{{ row.date }}</td>
              <td class="px-6 py-4 text-gray-700">{{ formatWon(row.amount) }}</td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="row.statusColor">
                  {{ row.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
