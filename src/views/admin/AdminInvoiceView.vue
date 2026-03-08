<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { adminApi } from '@/api/admin'

const STATUS_LABEL = { PAID: '결제 완료', UNPAID: '미결제', OVERDUE: '연체' }
const STATUS_COLOR = { PAID: 'bg-brand-100 text-brand-700', UNPAID: 'bg-amber-100 text-amber-700', OVERDUE: 'bg-rose-100 text-rose-700' }
const TAB_STATUS = { '전체 인보이스': null, '미결제': 'UNPAID', '연체': 'OVERDUE' }

const activeTab = ref('전체 인보이스')
const currentPage = ref(1)
const itemsPerPage = 8

const tabs = ['전체 인보이스', '미결제', '연체']

const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth() + 1

const summary = ref({ confirmedRevenue: 0, confirmedCount: 0, outstanding: 0, outstandingOverdue: 0 })
const invoices = ref([])
const loading = ref(false)

const fetchAll = async () => {
  loading.value = true
  try {
    const monthParam = `${currentYear}-${String(currentMonth).padStart(2, '0')}`
    const [summaryRes, invoicesRes] = await Promise.all([
      adminApi.getInvoiceSummary(monthParam),
      adminApi.getInvoices({ status: TAB_STATUS[activeTab.value], page: currentPage.value - 1, size: itemsPerPage })
    ])
    summary.value = summaryRes.data.data
    invoices.value = (invoicesRes.data.data || []).map(inv => ({
      id: inv.id,
      workspaceId: inv.workspaceId,
      plan: inv.planType,
      period: inv.billingPeriod,
      amount: inv.amount,
      issuedDate: inv.issuedAt,
      paidDate: inv.paidAt || '—',
      statusKey: inv.invoiceStatus,
      status: STATUS_LABEL[inv.invoiceStatus] || inv.invoiceStatus,
      statusColor: STATUS_COLOR[inv.invoiceStatus] || 'bg-gray-100 text-gray-700'
    }))
  } catch (e) {
    console.error('인보이스 데이터 로드 실패', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)
watch([activeTab, currentPage], fetchAll)

const totalPages = computed(() => Math.ceil(invoices.value.length / itemsPerPage) || 1)

const formatWon = (v) => '₩' + v.toLocaleString('ko-KR')
</script>

<template>
  <div class="space-y-6">
    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">이번 달 매출 (확정)</p>
        <p class="text-3xl font-bold text-gray-900">{{ formatWon(summary.confirmedRevenue) }}</p>
        <p class="text-sm text-gray-400 mt-1">인보이스 {{ summary.confirmedCount }}건 결제 완료</p>
      </div>
      <div class="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <p class="text-sm text-gray-500 mb-1">미수금 (미결제 + 연체)</p>
        <p class="text-3xl font-bold text-rose-500">{{ formatWon(summary.outstanding) }}</p>
        <p class="text-sm text-gray-400 mt-1">연체 {{ summary.outstandingOverdue }}건 포함</p>
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
            @click="activeTab = tab; currentPage = 1; fetchAll()"
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
              <th class="px-6 py-3.5 font-medium">워크스페이스</th>
              <th class="px-6 py-3.5 font-medium">요금제</th>
              <th class="px-6 py-3.5 font-medium">청구 기간</th>
              <th class="px-6 py-3.5 font-medium">금액</th>
              <th class="px-6 py-3.5 font-medium">발행일</th>
              <th class="px-6 py-3.5 font-medium">결제일</th>
              <th class="px-6 py-3.5 font-medium">상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="px-6 py-8 text-center text-gray-400">로딩 중...</td>
            </tr>
            <tr v-else-if="!invoices.length">
              <td colspan="8" class="px-6 py-8 text-center text-gray-400">인보이스 데이터가 없습니다.</td>
            </tr>
            <tr
              v-else
              v-for="inv in invoices"
              :key="inv.id"
              class="border-b border-gray-50 hover:bg-slate-50/50 transition-colors"
            >
              <td class="px-6 py-4 text-gray-600 font-mono">{{ inv.id }}</td>
              <td class="px-6 py-4 text-xs font-mono text-gray-600 max-w-[120px] truncate">{{ inv.workspaceId }}</td>
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
        <p class="text-sm text-gray-500">총 {{ invoices.length }}건</p>
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
