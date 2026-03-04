<script setup>
import { ref, computed, onMounted } from 'vue'
import { adminApi } from '@/api/admin'

const periodTab = ref('monthly')

const STATUS_LABEL = {
  ACTIVE: '활성',
  TRIAL: '체험 중',
  CANCELLED: '해지'
}
const STATUS_COLOR = {
  ACTIVE: 'bg-brand-400',
  TRIAL: 'bg-amber-400',
  CANCELLED: 'bg-slate-300'
}

const summary = ref({
  mrr: 0, mrrGrowth: 0, subscribers: 0, newThisMonth: 0,
  churnRate: 0, churnImprove: 0, totalCost: 0, costGrowth: 0
})
const trendData = ref([])
const planDistribution = ref([])

const totalCustomers = computed(() =>
  planDistribution.value.reduce((sum, p) => sum + p.count, 0)
)

const fetchAll = async () => {
  try {
    const [summaryRes, trendRes, planRes] = await Promise.all([
      adminApi.getDashboardSummary(),
      adminApi.getRevenueCostTrend(),
      adminApi.getPlanDistribution()
    ])
    summary.value = summaryRes.data.data
    trendData.value = (trendRes.data.data.trend || []).map(d => ({
      month: `${d.month}월`,
      revenue: d.revenue,
      cost: d.cost
    }))
    planDistribution.value = (planRes.data.data.distribution || []).map(p => ({
      name: STATUS_LABEL[p.status] || p.status,
      count: p.count,
      color: STATUS_COLOR[p.status] || 'bg-gray-300'
    }))
  } catch (e) {
    console.error('대시보드 데이터 로드 실패', e)
  }
}

onMounted(fetchAll)

const maxRevenue = computed(() =>
  Math.max(1, ...trendData.value.map(d => d.revenue))
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

    <!-- Recent Changes — 구독 목록에서 최근 변동 확인 가능 -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center text-sm text-gray-400">
      최근 구독 변동 내역은 <strong class="text-gray-600">구독 관리</strong> 메뉴에서 확인하세요.
    </div>
  </div>
</template>
