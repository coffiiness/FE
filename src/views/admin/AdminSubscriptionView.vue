<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { adminApi } from '@/api/admin'

const PLAN_LABEL = { ENTERPRISE: '엔터프라이즈', BUSINESS: '비즈니스', STARTER: '스타터' }
const PLAN_COLOR = { ENTERPRISE: 'bg-brand-100 text-brand-700', BUSINESS: 'bg-blue-100 text-blue-700', STARTER: 'bg-gray-100 text-gray-700' }
const STATUS_LABEL = { ACTIVE: '활성', TRIAL: '체험 중', CANCELLED: '해지' }
const STATUS_COLOR = { ACTIVE: 'text-brand-600', TRIAL: 'text-amber-600', CANCELLED: 'text-rose-500' }
const TAB_STATUS = { '전체': null, '활성': 'ACTIVE', '체험 중': 'TRIAL', '해지': 'CANCELLED' }

const searchQuery = ref('')
const activeTab = ref('전체')
const currentPage = ref(1)
const itemsPerPage = 8

const subscriptions = ref([])
const totalCount = ref(0)
const loading = ref(false)

const tabs = computed(() => [
  { name: '전체', count: totalCount.value },
  { name: '활성', count: 0 },
  { name: '체험 중', count: 0 },
  { name: '해지', count: 0 }
])

const fetchSubscriptions = async () => {
  loading.value = true
  try {
    const params = {
      page: currentPage.value - 1,
      size: itemsPerPage,
      search: searchQuery.value || undefined,
      status: TAB_STATUS[activeTab.value] || undefined
    }
    const res = await adminApi.getSubscriptions(params)
    const list = res.data.data || []
    subscriptions.value = list.map(sub => ({
      ...sub,
      plan: PLAN_LABEL[sub.planType] || sub.planType,
      planColor: PLAN_COLOR[sub.planType] || 'bg-gray-100 text-gray-700',
      statusLabel: STATUS_LABEL[sub.subscriptionStatus] || sub.subscriptionStatus,
      statusColor: STATUS_COLOR[sub.subscriptionStatus] || 'text-gray-500',
      initial: (sub.workspaceId || '?')[0].toUpperCase(),
      initialColor: 'bg-slate-500',
      startDate: sub.startDate,
      monthlyCharge: sub.monthlyAmount || 0
    }))
    totalCount.value = list.length
  } catch (e) {
    console.error('구독 목록 로드 실패', e)
  } finally {
    loading.value = false
  }
}

onMounted(fetchSubscriptions)
watch([activeTab, searchQuery], () => { currentPage.value = 1; fetchSubscriptions() })
watch(currentPage, fetchSubscriptions)

const totalPages = computed(() => Math.ceil(totalCount.value / itemsPerPage) || 1)

const formatWon = (v) => {
  if (v === 0) return '무료'
  return '₩' + v.toLocaleString('ko-KR')
}

const selectedSub = ref(null)
const showDetailModal = ref(false)

const openDetail = async (sub) => {
  try {
    const res = await adminApi.getSubscriptionDetail(sub.id)
    const d = res.data.data
    selectedSub.value = {
      ...sub,
      ...d,
      plan: PLAN_LABEL[d.planType] || d.planType,
      planColor: PLAN_COLOR[d.planType] || 'bg-gray-100 text-gray-700',
      statusLabel: STATUS_LABEL[d.subscriptionStatus] || d.subscriptionStatus,
      statusColor: STATUS_COLOR[d.subscriptionStatus] || 'text-gray-500',
      monthlyCharge: d.monthlyAmount || 0
    }
  } catch {
    selectedSub.value = sub
  }
  showDetailModal.value = true
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
          @click="activeTab = tab.name"
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
              <th class="px-6 py-3.5 font-medium">워크스페이스 ID</th>
              <th class="px-6 py-3.5 font-medium">요금제</th>
              <th class="px-6 py-3.5 font-medium">구독 시작일</th>
              <th class="px-6 py-3.5 font-medium">월 청구액</th>
              <th class="px-6 py-3.5 font-medium">상태</th>
              <th class="px-6 py-3.5 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" class="px-6 py-8 text-center text-gray-400">로딩 중...</td>
            </tr>
            <tr v-else-if="!subscriptions.length">
              <td colspan="6" class="px-6 py-8 text-center text-gray-400">구독 데이터가 없습니다.</td>
            </tr>
            <tr
              v-else
              v-for="sub in subscriptions"
              :key="sub.id"
              class="border-b border-gray-50 hover:bg-slate-50/50 transition-colors"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" :class="sub.initialColor">
                    {{ sub.initial }}
                  </div>
                  <p class="font-mono text-xs text-gray-600 max-w-[160px] truncate">{{ sub.workspaceId }}</p>
                </div>
              </td>
              <td class="px-6 py-4">
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="sub.planColor">
                  {{ sub.plan }}
                </span>
              </td>
              <td class="px-6 py-4 text-gray-500">{{ sub.startDate }}</td>
              <td class="px-6 py-4 text-gray-700 font-medium">{{ formatWon(sub.monthlyCharge) }}</td>
              <td class="px-6 py-4">
                <span class="font-semibold" :class="sub.statusColor">{{ sub.statusLabel }}</span>
              </td>
              <td class="px-6 py-4">
                <button class="text-brand-500 hover:text-brand-700 text-sm font-medium" @click="openDetail(sub)">상세 →</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="px-6 py-4 flex items-center justify-between border-t border-gray-100">
        <p class="text-sm text-gray-500">총 {{ totalCount }}개</p>
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

  <!-- 구독 상세 모달 -->
  <teleport to="body">
    <div v-if="showDetailModal && selectedSub" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="showDetailModal = false">
      <div class="bg-white rounded-2xl shadow-2xl w-[520px] max-w-[90vw] animate-modal-in">
        <div class="flex items-center justify-between px-8 pt-8 pb-4">
          <h2 class="text-xl font-bold text-gray-900">구독 상세</h2>
          <button class="text-gray-400 hover:text-gray-600 transition-colors" @click="showDetailModal = false">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="px-8 pb-8 space-y-0 divide-y divide-gray-100">
          <div class="flex items-center justify-between py-4">
            <span class="text-sm text-gray-500">워크스페이스 ID</span>
            <span class="text-xs font-mono text-gray-600 max-w-[240px] truncate">{{ selectedSub.workspaceId }}</span>
          </div>
          <div class="flex items-center justify-between py-4">
            <span class="text-sm text-gray-500">요금제</span>
            <span class="px-2.5 py-1 rounded-full text-xs font-semibold" :class="selectedSub.planColor">{{ selectedSub.plan }}</span>
          </div>
          <div class="flex items-center justify-between py-4">
            <span class="text-sm text-gray-500">상태</span>
            <span class="text-sm font-semibold" :class="selectedSub.statusColor">{{ selectedSub.statusLabel }}</span>
          </div>
          <div class="flex items-center justify-between py-4">
            <span class="text-sm text-gray-500">구독 시작일</span>
            <span class="text-sm font-semibold text-gray-900">{{ selectedSub.startDate }}</span>
          </div>
          <div class="flex items-center justify-between py-4">
            <span class="text-sm text-gray-500">월 청구액</span>
            <span class="text-sm font-semibold text-gray-900">{{ formatWon(selectedSub.monthlyCharge) }}</span>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<style scoped>
@keyframes modal-in {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-modal-in { animation: modal-in 0.25s ease-out; }
</style>
