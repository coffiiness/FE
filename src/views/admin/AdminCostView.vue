<script setup>
import { ref, computed } from 'vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const CATEGORY_CONFIG = [
  { id: '인건비',    cardName: '인건비',           color: 'bg-blue-500',   barColor: 'bg-blue-500',   tagColor: 'bg-blue-100 text-blue-700' },
  { id: '서버/인프라', cardName: '서버 / 인프라',   color: 'bg-amber-500',  barColor: 'bg-amber-500',  tagColor: 'bg-amber-100 text-amber-700' },
  { id: '마케팅',    cardName: '마케팅',           color: 'bg-violet-500', barColor: 'bg-violet-500', tagColor: 'bg-violet-100 text-violet-700' },
  { id: '기타',      cardName: '기타 (외주, 사무)', color: 'bg-rose-500',   barColor: 'bg-rose-500',   tagColor: 'bg-rose-100 text-rose-700' },
]

const costItems = ref([
  { id: 'CST-001', category: '인건비',    categoryColor: 'bg-blue-100 text-blue-700',   name: '개발자 급여 (본인)',    amount: 4500000, month: '2025.02', note: '월 고정비' },
  { id: 'CST-002', category: '서버/인프라', categoryColor: 'bg-amber-100 text-amber-700', name: 'AWS EC2 + RDS',       amount: 1200000, month: '2025.02', note: '운영 서버' },
  { id: 'CST-003', category: '서버/인프라', categoryColor: 'bg-amber-100 text-amber-700', name: 'CloudFront + S3',     amount: 350000,  month: '2025.02', note: 'CDN/스토리지' },
  { id: 'CST-004', category: '서버/인프라', categoryColor: 'bg-amber-100 text-amber-700', name: '도메인 / SSL',         amount: 50000,   month: '2025.02', note: '연간 비용 월할' },
  { id: 'CST-005', category: '서버/인프라', categoryColor: 'bg-amber-100 text-amber-700', name: '모니터링 (Datadog)',   amount: 500000,  month: '2025.02', note: 'Pro 플랜' },
  { id: 'CST-006', category: '마케팅',    categoryColor: 'bg-violet-100 text-violet-700', name: 'Google Ads',          amount: 800000,  month: '2025.02', note: '키워드 광고' },
  { id: 'CST-007', category: '마케팅',    categoryColor: 'bg-violet-100 text-violet-700', name: '콘텐츠 마케팅',        amount: 400000,  month: '2025.02', note: '블로그/SNS' },
  { id: 'CST-008', category: '기타',      categoryColor: 'bg-rose-100 text-rose-700',    name: '사무용품 / 비품',      amount: 150000,  month: '2025.02', note: '' },
  { id: 'CST-009', category: '기타',      categoryColor: 'bg-rose-100 text-rose-700',    name: '외주 디자인',          amount: 300000,  month: '2025.02', note: '랜딩 페이지' },
])

const monthlyTrend = ref([
  { month: '9월',  monthKey: '2024.09', amount: 7200000 },
  { month: '10월', monthKey: '2024.10', amount: 7550000 },
  { month: '11월', monthKey: '2024.11', amount: 7800000 },
  { month: '12월', monthKey: '2024.12', amount: 8000000 },
  { month: '1월',  monthKey: '2025.01', amount: 8100000 },
  { month: '2월',  monthKey: '2025.02', amount: 8250000, current: true },
])

// costItems 기반으로 카테고리 요약 자동 계산
const categories = computed(() => {
  const totals = Object.fromEntries(CATEGORY_CONFIG.map(c => [c.id, 0]))

  costItems.value.forEach(item => {
    if (totals[item.category] !== undefined) totals[item.category] += item.amount
  })

  const total = Object.values(totals).reduce((s, v) => s + v, 0)

  return CATEGORY_CONFIG.map(c => ({
    name: c.cardName,
    amount: totals[c.id],
    percent: total > 0 ? Math.round((totals[c.id] / total) * 1000) / 10 : 0,
    color: c.color,
    barColor: c.barColor,
  }))
})

const maxTrend = computed(() => Math.max(...monthlyTrend.value.map(d => d.amount)))
const maxCategory = computed(() => Math.max(...categories.value.map(c => c.amount)))

const formatWon = (v) => '₩' + v.toLocaleString('ko-KR')
const formatShort = (v) => {
  if (v >= 1000000) return '₩' + (v / 1000000).toFixed(1) + 'M'
  if (v >= 1000) return '₩' + (v / 1000).toFixed(0) + 'K'
  return '₩' + v
}

// 비용 등록 모달
const showAddModal = ref(false)
const addForm = ref({ category: '인건비', name: '', amount: '', month: '2025.02', note: '' })
const amountError = ref('')

const validateAmount = () => {
  const v = Number(addForm.value.amount)
  amountError.value = (!addForm.value.amount || isNaN(v) || v <= 0) ? '올바른 금액을 입력해 주세요.' : ''
}

const handleAddCost = () => {
  validateAmount()
  if (!addForm.value.name.trim() || amountError.value) return

  const catConfig = CATEGORY_CONFIG.find(c => c.id === addForm.value.category)
  const newId = `CST-${String(costItems.value.length + 1).padStart(3, '0')}`

  costItems.value.push({
    id: newId,
    category: addForm.value.category,
    categoryColor: catConfig.tagColor,
    name: addForm.value.name.trim(),
    amount: Number(addForm.value.amount),
    month: addForm.value.month,
    note: addForm.value.note.trim(),
  })

  // 월별 추이 반영
  const trendEntry = monthlyTrend.value.find(t => t.monthKey === addForm.value.month)
  if (trendEntry) {
    trendEntry.amount += Number(addForm.value.amount)
  }

  const registeredName = addForm.value.name.trim()
  const registeredAmount = Number(addForm.value.amount)

  showAddModal.value = false
  addForm.value = { category: '인건비', name: '', amount: '', month: '2025.02', note: '' }
  amountError.value = ''

  modal.value = {
    show: true,
    title: '비용 등록 완료',
    message: `'${registeredName}' 항목 ${formatWon(registeredAmount)}이 등록되었습니다.`,
    type: 'success',
  }
}

const closeAddModal = () => {
  showAddModal.value = false
  addForm.value = { category: '인건비', name: '', amount: '', month: '2025.02', note: '' }
  amountError.value = ''
}

// ── 공통 알림 모달 ─────────────────────────────────────────────────────────
const modal = ref({ show: false, title: '', message: '', type: 'success' })
const closeModal = () => { modal.value.show = false }
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
                :style="{ width: maxCategory > 0 ? (cat.amount / maxCategory * 100) + '%' : '0%' }"
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
                :style="{ height: maxTrend > 0 ? (d.amount / maxTrend * 100) + '%' : '0%' }"
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
        <h3 class="text-lg font-bold text-gray-800">비용 상세 내역</h3>
        <button
          class="inline-flex items-center px-4 py-2 bg-brand-500 text-white rounded-xl text-sm font-medium hover:bg-brand-600 transition-colors"
          @click="showAddModal = true"
        >
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

  <!-- 비용 등록 모달 -->
  <teleport to="body">
    <div v-if="showAddModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="closeAddModal">
      <div class="bg-white rounded-2xl shadow-2xl w-[480px] max-w-[90vw] animate-modal-in">
        <div class="flex items-center justify-between px-8 pt-8 pb-4">
          <h2 class="text-xl font-bold text-gray-900">비용 등록</h2>
          <button class="text-gray-400 hover:text-gray-600 transition-colors" @click="closeAddModal">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="px-8 space-y-5 pb-2">
          <!-- 카테고리 -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">카테고리</label>
            <select
              v-model="addForm.category"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-white"
            >
              <option v-for="cat in CATEGORY_CONFIG" :key="cat.id" :value="cat.id">{{ cat.id }}</option>
            </select>
          </div>

          <!-- 항목명 -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">항목명 <span class="text-rose-500">*</span></label>
            <input
              v-model="addForm.name"
              type="text"
              placeholder="항목명을 입력해 주세요."
              class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
            >
          </div>

          <!-- 금액 -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">금액 (원) <span class="text-rose-500">*</span></label>
            <input
              v-model="addForm.amount"
              type="number"
              min="1"
              placeholder="금액을 입력해 주세요."
              class="w-full px-4 py-3 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              :class="amountError ? 'border-rose-400' : 'border-gray-200'"
              @blur="validateAmount"
            >
            <p v-if="amountError" class="mt-1 text-xs text-rose-500">{{ amountError }}</p>
            <p v-else-if="addForm.amount && Number(addForm.amount) > 0" class="mt-1 text-xs text-gray-400">
              {{ formatWon(Number(addForm.amount)) }}
            </p>
          </div>

          <!-- 발생월 -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">발생월</label>
            <select
              v-model="addForm.month"
              class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors bg-white"
            >
              <option v-for="t in monthlyTrend" :key="t.monthKey" :value="t.monthKey">{{ t.monthKey }} ({{ t.month }})</option>
            </select>
          </div>

          <!-- 비고 -->
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">비고 <span class="text-gray-400 font-normal">(선택)</span></label>
            <input
              v-model="addForm.note"
              type="text"
              placeholder="비고를 입력해 주세요."
              class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
            >
          </div>
        </div>

        <div class="flex justify-end gap-3 px-8 py-6">
          <button
            class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            @click="closeAddModal"
          >
            취소
          </button>
          <button
            class="px-5 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 transition-colors"
            @click="handleAddCost"
          >
            등록하기
          </button>
        </div>
      </div>
    </div>
  </teleport>

  <ConfirmModal
    :show="modal.show"
    :title="modal.title"
    :message="modal.message"
    :type="modal.type"
    :show-cancel="false"
    confirm-text="확인"
    @confirm="closeModal"
    @cancel="closeModal"
  />
</template>

<style scoped>
@keyframes modal-in {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-modal-in { animation: modal-in 0.25s ease-out; }
</style>
