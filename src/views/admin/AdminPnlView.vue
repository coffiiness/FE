<script setup>
import { ref, computed } from 'vue'

// Mock data — 추후 adminApi.getPnlSummary() 로 교체
const summary = ref({
  totalRevenue: 12430000,
  revenueGrowth: 12.3,
  totalCost: 8250000,
  costGrowth: 3.1,
  operatingProfit: 4180000,
  operatingMargin: 33.6
})

const pnlData = ref({
  columns: ['2024.12', '2025.01', '2025.02'],
  revenue: {
    enterprise: [9200000, 10500000, 12430000],
    business: [0, 0, 0],
    total: [9200000, 10500000, 12430000]
  },
  cost: {
    labor: [4500000, 4500000, 4500000],
    infra: [1800000, 1950000, 2100000],
    marketing: [900000, 1100000, 1200000],
    etc: [350000, 450000, 450000],
    total: [7550000, 8000000, 8250000]
  },
  operatingProfit: [1650000, 2500000, 4180000]
})

const getGrowth = (arr) => {
  if (!arr || arr.length < 2) return null
  const curr = arr[arr.length - 1]
  const prev = arr[arr.length - 2]
  if (prev === 0) return null
  return ((curr - prev) / prev * 100).toFixed(1)
}

const formatWon = (v) => '₩' + v.toLocaleString('ko-KR')

const growthClass = (growth) => {
  if (!growth) return 'text-gray-400'
  return Number(growth) > 0 ? 'text-brand-500' : Number(growth) < 0 ? 'text-rose-500' : 'text-gray-400'
}

const formatGrowth = (growth) => {
  if (!growth) return '—'
  return (Number(growth) > 0 ? '+' : '') + growth + '%'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex items-center justify-between">
      <div />
      <div class="flex items-center gap-3">
        <span class="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600">
          <svg class="w-4 h-4 mr-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          2025년 2월
        </span>
        <button class="inline-flex items-center px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          <svg class="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Excel 다운로드
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">총 매출</p>
        <p class="text-3xl font-bold text-gray-900">{{ formatWon(summary.totalRevenue) }}</p>
        <p class="text-sm mt-1 text-brand-500">전월 대비 +{{ summary.revenueGrowth }}%</p>
      </div>
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">총 비용</p>
        <p class="text-3xl font-bold text-gray-900">{{ formatWon(summary.totalCost) }}</p>
        <p class="text-sm mt-1 text-gray-400">전월 대비 +{{ summary.costGrowth }}%</p>
      </div>
      <div class="bg-slate-900 rounded-2xl p-6 shadow-sm">
        <p class="text-sm text-slate-400 mb-1">영업이익</p>
        <p class="text-3xl font-bold text-brand-400">{{ formatWon(summary.operatingProfit) }}</p>
        <p class="text-sm mt-1 text-brand-300">영업이익률 {{ summary.operatingMargin }}%</p>
      </div>
    </div>

    <!-- P&L Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div class="p-6 border-b border-gray-100 flex items-center justify-between">
        <h3 class="text-lg font-bold text-gray-800">월별 손익계산서</h3>
        <span class="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">비용 항목은 MOCK DATA</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b border-gray-200 bg-slate-50/50">
              <th class="px-6 py-3.5 font-medium w-64">항목</th>
              <th v-for="col in pnlData.columns" :key="col" class="px-6 py-3.5 font-medium text-right">{{ col }}</th>
              <th class="px-6 py-3.5 font-medium text-right">전월 대비</th>
            </tr>
          </thead>
          <tbody>
            <!-- Revenue Section -->
            <tr class="border-b border-gray-100 bg-slate-50/30">
              <td class="px-6 py-3 font-bold text-gray-800" colspan="5">매출</td>
            </tr>
            <tr class="border-b border-gray-50">
              <td class="px-6 py-3 pl-10 text-gray-600">구독 매출 (엔터프라이즈)</td>
              <td v-for="(val, i) in pnlData.revenue.enterprise" :key="'re'+i" class="px-6 py-3 text-right text-gray-700">{{ formatWon(val) }}</td>
              <td class="px-6 py-3 text-right font-medium" :class="growthClass(getGrowth(pnlData.revenue.enterprise))">
                {{ formatGrowth(getGrowth(pnlData.revenue.enterprise)) }}
              </td>
            </tr>
            <tr class="border-b border-gray-50">
              <td class="px-6 py-3 pl-10 text-gray-600">구독 매출 (비즈니스)</td>
              <td v-for="(val, i) in pnlData.revenue.business" :key="'rb'+i" class="px-6 py-3 text-right text-gray-700">{{ formatWon(val) }}</td>
              <td class="px-6 py-3 text-right text-gray-400">—</td>
            </tr>
            <tr class="border-b border-gray-200">
              <td class="px-6 py-3 pl-10 font-semibold text-gray-800">매출 합계</td>
              <td v-for="(val, i) in pnlData.revenue.total" :key="'rt'+i" class="px-6 py-3 text-right font-semibold text-gray-800">{{ formatWon(val) }}</td>
              <td class="px-6 py-3 text-right font-semibold" :class="growthClass(getGrowth(pnlData.revenue.total))">
                {{ formatGrowth(getGrowth(pnlData.revenue.total)) }}
              </td>
            </tr>

            <!-- Cost Section -->
            <tr class="border-b border-gray-100 bg-slate-50/30">
              <td class="px-6 py-3 font-bold text-gray-800" colspan="5">비용</td>
            </tr>
            <tr class="border-b border-gray-50">
              <td class="px-6 py-3 pl-10 text-gray-600">인건비</td>
              <td v-for="(val, i) in pnlData.cost.labor" :key="'cl'+i" class="px-6 py-3 text-right text-gray-700">{{ formatWon(val) }}</td>
              <td class="px-6 py-3 text-right" :class="growthClass(getGrowth(pnlData.cost.labor))">
                {{ formatGrowth(getGrowth(pnlData.cost.labor)) }}
              </td>
            </tr>
            <tr class="border-b border-gray-50">
              <td class="px-6 py-3 pl-10 text-gray-600">서버 / 인프라</td>
              <td v-for="(val, i) in pnlData.cost.infra" :key="'ci'+i" class="px-6 py-3 text-right text-gray-700">{{ formatWon(val) }}</td>
              <td class="px-6 py-3 text-right" :class="growthClass(getGrowth(pnlData.cost.infra))">
                {{ formatGrowth(getGrowth(pnlData.cost.infra)) }}
              </td>
            </tr>
            <tr class="border-b border-gray-50">
              <td class="px-6 py-3 pl-10 text-gray-600">마케팅</td>
              <td v-for="(val, i) in pnlData.cost.marketing" :key="'cm'+i" class="px-6 py-3 text-right text-gray-700">{{ formatWon(val) }}</td>
              <td class="px-6 py-3 text-right" :class="growthClass(getGrowth(pnlData.cost.marketing))">
                {{ formatGrowth(getGrowth(pnlData.cost.marketing)) }}
              </td>
            </tr>
            <tr class="border-b border-gray-50">
              <td class="px-6 py-3 pl-10 text-gray-600">기타</td>
              <td v-for="(val, i) in pnlData.cost.etc" :key="'ce'+i" class="px-6 py-3 text-right text-gray-700">{{ formatWon(val) }}</td>
              <td class="px-6 py-3 text-right" :class="growthClass(getGrowth(pnlData.cost.etc))">
                {{ formatGrowth(getGrowth(pnlData.cost.etc)) }}
              </td>
            </tr>
            <tr class="border-b border-gray-200">
              <td class="px-6 py-3 pl-10 font-semibold text-gray-800">비용 합계</td>
              <td v-for="(val, i) in pnlData.cost.total" :key="'ctt'+i" class="px-6 py-3 text-right font-semibold text-gray-800">{{ formatWon(val) }}</td>
              <td class="px-6 py-3 text-right font-semibold" :class="growthClass(getGrowth(pnlData.cost.total))">
                {{ formatGrowth(getGrowth(pnlData.cost.total)) }}
              </td>
            </tr>

            <!-- Operating Profit -->
            <tr class="bg-slate-900">
              <td class="px-6 py-4 font-bold text-white">영업이익</td>
              <td v-for="(val, i) in pnlData.operatingProfit" :key="'op'+i" class="px-6 py-4 text-right font-bold text-brand-400">{{ formatWon(val) }}</td>
              <td class="px-6 py-4 text-right font-bold text-brand-400">
                {{ formatGrowth(getGrowth(pnlData.operatingProfit)) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
