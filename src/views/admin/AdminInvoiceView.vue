<script setup>
import { ref, computed } from 'vue'

const activeTab = ref('전체 인보이스')
const currentPage = ref(1)
const itemsPerPage = 8

// Mock data — 추후 adminApi.getInvoiceSummary() 로 교체
const summary = ref({
  confirmedRevenue: 12430000,
  confirmedCount: 12,
  outstanding: 1780000,
  outstandingOverdue: 2,
  pendingIssue: 890000,
  nextDueDate: '2025.03.01'
})

const tabs = ['전체 인보이스', '미결제', '연체']

const invoices = ref([
  { id: 'INV-2025-0047', company: '스타트업허브', plan: '엔터프라이즈', period: '2025.02', amount: 890000, issuedDate: '2025.02.01', paidDate: '2025.02.05', status: '결제 완료', statusColor: 'bg-brand-100 text-brand-700' },
  { id: 'INV-2025-0046', company: '인피니티소프트', plan: '엔터프라이즈', period: '2025.02', amount: 1958000, issuedDate: '2025.02.01', paidDate: '2025.02.03', status: '결제 완료', statusColor: 'bg-brand-100 text-brand-700' },
  { id: 'INV-2025-0045', company: '테크밸리', plan: '엔터프라이즈', period: '2025.02', amount: 1335000, issuedDate: '2025.02.01', paidDate: '2025.02.02', status: '결제 완료', statusColor: 'bg-brand-100 text-brand-700' },
  { id: 'INV-2025-0044', company: '넥스트코드', plan: '엔터프라이즈', period: '2025.02', amount: 445000, issuedDate: '2025.02.01', paidDate: '2025.02.04', status: '결제 완료', statusColor: 'bg-brand-100 text-brand-700' },
  { id: 'INV-2025-0043', company: '클라우드나인', plan: '엔터프라이즈', period: '2025.02', amount: 1335000, issuedDate: '2025.02.01', paidDate: '—', status: '미결제', statusColor: 'bg-amber-100 text-amber-700' },
  { id: 'INV-2025-0042', company: '블루웨이브', plan: '엔터프라이즈', period: '2025.01', amount: 445000, issuedDate: '2025.01.01', paidDate: '—', status: '연체', statusColor: 'bg-rose-100 text-rose-700' },
  { id: 'INV-2025-0041', company: '스타트업허브', plan: '엔터프라이즈', period: '2025.01', amount: 890000, issuedDate: '2025.01.01', paidDate: '2025.01.05', status: '결제 완료', statusColor: 'bg-brand-100 text-brand-700' },
  { id: 'INV-2025-0040', company: '인피니티소프트', plan: '엔터프라이즈', period: '2025.01', amount: 1958000, issuedDate: '2025.01.01', paidDate: '2025.01.03', status: '결제 완료', statusColor: 'bg-brand-100 text-brand-700' }
])

const filteredInvoices = computed(() => {
  if (activeTab.value === '전체 인보이스') return invoices.value
  return invoices.value.filter(inv => inv.status === activeTab.value.replace('미결제', '미결제').replace('연체', '연체'))
})

const totalPages = computed(() =>
  Math.ceil(filteredInvoices.value.length / itemsPerPage) || 1
)

const paginatedInvoices = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredInvoices.value.slice(start, start + itemsPerPage)
})

const formatWon = (v) => '₩' + v.toLocaleString('ko-KR')
</script>

<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">이번 달 매출 (확정)</p>
        <p class="text-3xl font-bold text-gray-900">{{ formatWon(summary.confirmedRevenue) }}</p>
        <p class="text-sm text-gray-400 mt-1">인보이스 {{ summary.confirmedCount }}건 결제 완료</p>
      </div>
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">미수금 (미결제)</p>
        <p class="text-3xl font-bold text-rose-500">{{ formatWon(summary.outstanding) }}</p>
        <p class="text-sm text-gray-400 mt-1">연체 {{ summary.outstandingOverdue }}건 포함</p>
      </div>
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">발행 대기</p>
        <p class="text-3xl font-bold text-amber-500">{{ formatWon(summary.pendingIssue) }}</p>
        <p class="text-sm text-gray-400 mt-1">다음 결제일: {{ summary.nextDueDate }}</p>
      </div>
    </div>

    <!-- Tabs & Table -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <!-- Tabs -->
      <div class="border-b border-gray-100 px-6">
        <div class="flex gap-6">
          <button
            v-for="tab in tabs"
            :key="tab"
            class="py-4 text-sm font-medium border-b-2 transition-colors"
            :class="
              activeTab === tab
                ? 'border-brand-500 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            "
            @click="activeTab = tab; currentPage = 1"
          >
            {{ tab }}
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 border-b border-gray-100">
              <th class="px-6 py-3.5 font-medium">인보이스 ID</th>
              <th class="px-6 py-3.5 font-medium">고객사</th>
              <th class="px-6 py-3.5 font-medium">요금제</th>
              <th class="px-6 py-3.5 font-medium">청구 기간</th>
              <th class="px-6 py-3.5 font-medium">금액</th>
              <th class="px-6 py-3.5 font-medium">발행일</th>
              <th class="px-6 py-3.5 font-medium">결제일</th>
              <th class="px-6 py-3.5 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="inv in paginatedInvoices"
              :key="inv.id"
              class="border-b border-gray-50 hover:bg-slate-50/50 transition-colors"
            >
              <td class="px-6 py-4 text-gray-600 font-mono">{{ inv.id }}</td>
              <td class="px-6 py-4 font-semibold text-gray-900">{{ inv.company }}</td>
              <td class="px-6 py-4 text-gray-600">{{ inv.plan }}</td>
              <td class="px-6 py-4 text-gray-500">{{ inv.period }}</td>
              <td class="px-6 py-4 font-semibold text-gray-800">{{ formatWon(inv.amount) }}</td>
              <td class="px-6 py-4 text-gray-500">{{ inv.issuedDate }}</td>
              <td class="px-6 py-4 text-gray-500">{{ inv.paidDate }}</td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="inv.statusColor">
                  {{ inv.status }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 flex items-center justify-between border-t border-gray-100">
        <p class="text-sm text-gray-500">총 {{ filteredInvoices.length }}건 중 {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, filteredInvoices.length) }}</p>
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
