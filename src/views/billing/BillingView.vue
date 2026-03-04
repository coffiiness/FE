<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import {
  getTossConfig,
  registerBillingKey,
  upgradeToEnterprise,
  downgradeToFree,
  getRegisteredCard,
  getSubscription,
  getPaymentHistory
} from '@/api/payment'

const route = useRoute()

const modal = ref({
  show: false, title: '', message: '', type: 'success', showCancel: false, confirmText: '확인',
})
const openModal = (opts) => {
  modal.value = { show: true, showCancel: false, confirmText: '확인', ...opts }
}
const closeModal = () => { modal.value.show = false }

const loading = ref(false)
const showSubscriptionModal = ref(false)

const plans = [
  {
    id: 'business',
    name: '비즈니스',
    price: '무료',
    priceUnit: '',
    billingLabel: '예정된 결제 없음',
    badge: '기본 요금제',
    iconBg: 'bg-slate-800',
    features: ['최대 50명 사용자', '채용 관리 전체 기능', '회의실 예약 관리', '이메일 지원'],
  },
  {
    id: 'enterprise',
    name: '엔터프라이즈',
    price: '₩19,900',
    priceUnit: '월',
    billingLabel: '월간 청구',
    badge: '모든 기능 무제한',
    iconBg: 'bg-amber-500',
    features: ['무제한 사용자', '비즈니스 기능 전체 포함', '고급 분석 리포트'],
  }
]

const subscription = ref(null)
const registeredCard = ref(null)
const paymentHistory = ref([])

const currentPlanId = computed(() => {
  if (!subscription.value) return 'business'
  const plan = subscription.value.planType
  if (plan === 'ENTERPRISE' && ['ACTIVE', 'TRIAL'].includes(subscription.value.subscriptionStatus)) {
    return 'enterprise'
  }
  return 'business'
})
const currentPlanData = computed(() => plans.find(p => p.id === currentPlanId.value))

const subscriptionStatusLabel = computed(() => {
  if (!subscription.value) return '없음'
  const map = { ACTIVE: '활성', TRIAL: '트라이얼', CANCELLED: '취소됨', SUSPENDED: '중단됨' }
  return map[subscription.value.subscriptionStatus] || subscription.value.subscriptionStatus
})

const currentPeriod = computed(() => {
  if (!subscription.value) return '구독기간 없음'
  const start = subscription.value.startDate || '-'
  const end = subscription.value.endDate || '진행 중'
  return `${start} ~ ${end}`
})

const paymentStatusLabel = (status) => {
  const map = { SUCCESS: '성공', FAILED: '실패', RETRY: '재시도', CANCELLED: '취소' }
  return map[status] || status
}

const paymentStatusClass = (status) => {
  const map = {
    SUCCESS: 'bg-green-100 text-green-700',
    FAILED: 'bg-red-100 text-red-700',
    RETRY: 'bg-yellow-100 text-yellow-700',
    CANCELLED: 'bg-gray-100 text-gray-600',
  }
  return map[status] || 'bg-gray-100 text-gray-600'
}

const formatDateTime = (dt) => {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

const formatAmount = (amount) => {
  if (!amount) return '-'
  return `₩${amount.toLocaleString()}`
}

const fetchData = async () => {
  try {
    const [subRes, cardRes, historyRes] = await Promise.all([
      getSubscription(),
      getRegisteredCard(),
      getPaymentHistory()
    ])
    subscription.value = subRes.data.data
    registeredCard.value = cardRes.data.data
    paymentHistory.value = historyRes.data.data || []
  } catch (e) {
    console.error('결제 정보 조회 실패:', e)
  }
}

const handleTossCallback = async () => {
  const authKey = Array.isArray(route.query.authKey) ? route.query.authKey[0] : route.query.authKey
  const customerKey = Array.isArray(route.query.customerKey) ? route.query.customerKey[0] : route.query.customerKey

  // 카드 등록 취소/실패로 돌아온 경우
  if (route.query.error) {
    openModal({
      title: '카드 등록 취소',
      message: route.query.message || '카드 등록이 취소되었습니다.',
      type: 'warning'
    })
    window.history.replaceState({}, '', '/billing')
    return
  }

  if (authKey && customerKey) {
    try {
      loading.value = true
      await registerBillingKey({ customerKey, authKey })
      openModal({ title: '카드 등록 완료', message: '카드가 성공적으로 등록되었습니다.', type: 'success' })

      const pendingUpgrade = localStorage.getItem('pendingUpgrade')
      if (pendingUpgrade === 'true') {
        localStorage.removeItem('pendingUpgrade')
        await doUpgrade()
      }

      await fetchData()
    } catch (e) {
      openModal({
        title: '카드 등록 실패',
        message: e.response?.data?.error?.message || '카드 등록에 실패했습니다.',
        type: 'danger'
      })
    } finally {
      loading.value = false
      window.history.replaceState({}, '', '/billing')
    }
  }
}

onMounted(async () => {
  await fetchData()
  await handleTossCallback()
})

const openTossBillingAuth = async () => {
  try {
    loading.value = true
    const res = await getTossConfig()
    const { clientKey, customerKey } = res.data.data

    const tossPayments = await loadTossPayments(clientKey)
    const payment = tossPayments.payment({ customerKey })

    await payment.requestBillingAuth({
      method: 'CARD',
      successUrl: window.location.origin + '/billing',
      failUrl: window.location.origin + '/billing?error=true',
    })
  } catch (e) {
    console.error('Toss SDK 오류:', e)
    openModal({ title: '오류', message: '카드 등록을 시작할 수 없습니다.', type: 'danger' })
  } finally {
    loading.value = false
  }
}

const handlePlanChange = async (planId) => {
  if (planId === currentPlanId.value) return
  showSubscriptionModal.value = false

  if (planId === 'enterprise') {
    if (!registeredCard.value) {
      localStorage.setItem('pendingUpgrade', 'true')
      openModal({
        title: '카드 등록 필요',
        message: 'Enterprise 업그레이드를 위해 결제 카드를 먼저 등록해주세요. 카드 등록 화면으로 이동합니다.',
        type: 'success',
      })
      setTimeout(() => {
        closeModal()
        openTossBillingAuth()
      }, 1500)
      return
    }
    await doUpgrade()
  } else {
    await doDowngrade()
  }
}

const doUpgrade = async () => {
  try {
    loading.value = true
    const res = await upgradeToEnterprise()
    const result = res.data.data
    if (!result) {
      // 이번 달 이미 결제 완료 → 구독만 활성화됨
      openModal({ title: '업그레이드 완료', message: '이번 달 이미 결제된 내역이 있어 추가 결제 없이 업그레이드되었습니다.', type: 'success' })
    } else if (result.status === 'SUCCESS') {
      openModal({ title: '업그레이드 완료', message: 'Enterprise 요금제로 업그레이드되었습니다.', type: 'success' })
    } else {
      openModal({
        title: '결제 실패',
        message: result.failReason || '결제에 실패했습니다. 3일 후 재시도됩니다.',
        type: 'danger'
      })
    }
    await fetchData()
  } catch (e) {
    openModal({
      title: '업그레이드 실패',
      message: e.response?.data?.error?.message || '업그레이드에 실패했습니다.',
      type: 'danger'
    })
  } finally {
    loading.value = false
  }
}

const doDowngrade = async () => {
  try {
    loading.value = true
    await downgradeToFree()
    openModal({ title: '다운그레이드 완료', message: 'Business(무료) 요금제로 변경되었습니다.', type: 'success' })
    await fetchData()
  } catch (e) {
    openModal({
      title: '다운그레이드 실패',
      message: e.response?.data?.error?.message || '다운그레이드에 실패했습니다.',
      type: 'danger'
    })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4">
    <h1 class="text-2xl font-bold text-gray-900 mb-8">구독 및 결제</h1>

    <!-- 로딩 오버레이 -->
    <div v-if="loading" class="fixed inset-0 z-[10000] flex items-center justify-center bg-black/20">
      <div class="bg-white rounded-xl px-8 py-6 shadow-lg flex items-center gap-3">
        <svg class="animate-spin w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span class="text-sm font-medium text-gray-700">처리 중...</span>
      </div>
    </div>

    <!-- 사용 중인 요금제 -->
    <section class="mb-10">
      <h2 class="text-lg font-bold text-gray-900 mb-4">사용 중인 요금제</h2>

      <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-xl font-bold text-gray-900 mb-4">{{ currentPlanData.name }}</h3>
            <div class="flex gap-12">
              <div>
                <p class="text-sm text-gray-500 mb-1">요금제</p>
                <p class="text-sm font-semibold text-gray-900">{{ currentPlanData.name }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500 mb-1">결제 방식</p>
                <p class="text-sm font-semibold text-gray-900">{{ currentPlanData.billingLabel }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500 mb-1">구독 기간</p>
                <p class="text-sm font-semibold text-gray-900">{{ currentPeriod }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500 mb-1">상태</p>
                <p class="text-sm font-semibold text-gray-900">{{ subscriptionStatusLabel }}</p>
              </div>
            </div>
          </div>
          <button
            class="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors shrink-0"
            @click="showSubscriptionModal = true"
          >
            구독 변경
          </button>
        </div>
      </div>
    </section>

    <!-- 청구 및 결제 정보 -->
    <section class="mb-10">
      <h2 class="text-lg font-bold text-gray-900 mb-4">청구 및 결제 정보</h2>

      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        <div class="flex items-center justify-between px-6 py-5">
          <div class="flex items-center gap-4">
            <span class="text-sm font-semibold text-gray-900 w-28">결제 카드</span>
            <span v-if="registeredCard" class="text-sm text-gray-700">
              {{ registeredCard.cardCompany }} {{ registeredCard.cardNumber }}
              <span class="ml-2 text-xs text-gray-400">({{ registeredCard.ownerType === 'PERSONAL' ? '개인' : '법인' }})</span>
            </span>
            <span v-else class="text-sm text-gray-500">등록된 카드가 없습니다.</span>
          </div>
          <button
            class="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors flex items-center gap-1"
            @click="openTossBillingAuth"
          >
            {{ registeredCard ? '변경하기' : '등록하기' }}
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- 결제 내역 -->
    <section>
      <h2 class="text-lg font-bold text-gray-900 mb-4">결제 내역</h2>

      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 bg-gray-50/50">
              <th class="text-left px-6 py-3 font-semibold text-gray-600">주문번호</th>
              <th class="text-left px-6 py-3 font-semibold text-gray-600">금액</th>
              <th class="text-left px-6 py-3 font-semibold text-gray-600">결제일시</th>
              <th class="text-left px-6 py-3 font-semibold text-gray-600">상태</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in paymentHistory" :key="item.id" class="border-b border-gray-50">
              <td class="px-6 py-4 text-gray-900 font-mono text-xs">{{ item.orderId }}</td>
              <td class="px-6 py-4 text-gray-900">{{ formatAmount(item.amount) }}</td>
              <td class="px-6 py-4 text-gray-500">{{ formatDateTime(item.paidAt) }}</td>
              <td class="px-6 py-4">
                <span
                  class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                  :class="paymentStatusClass(item.status)"
                >
                  {{ paymentStatusLabel(item.status) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>

        <div v-if="paymentHistory.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg class="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-sm">결제 내역 없음</p>
        </div>
      </div>
    </section>

    <!-- 구독 변경 모달 -->
    <teleport to="body">
      <div v-if="showSubscriptionModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="showSubscriptionModal = false">
        <div class="bg-white rounded-2xl shadow-2xl w-[680px] max-w-[90vw] max-h-[85vh] overflow-y-auto animate-modal-in">
          <div class="flex items-center justify-between px-8 pt-8 pb-4">
            <h2 class="text-xl font-bold text-gray-900">구독 변경</h2>
            <button class="text-gray-400 hover:text-gray-600 transition-colors" @click="showSubscriptionModal = false">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p class="px-8 text-sm text-gray-500 mb-6">사용 중인 요금제를 변경할 수 있습니다. 변경 즉시 적용됩니다.</p>

          <div class="px-8 mb-4">
            <span class="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-brand-100 text-brand-700">현재 요금제</span>
          </div>

          <div class="px-8 pb-6 grid grid-cols-2 gap-4">
            <!-- 비즈니스 플랜 -->
            <div
              class="border-2 rounded-2xl p-6 relative transition-colors"
              :class="currentPlanId === 'business' ? 'border-brand-500 bg-brand-50/30' : 'border-gray-200 hover:border-gray-300'"
            >
              <div class="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mb-4">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900">비즈니스</h3>
              <p class="text-2xl font-bold text-gray-900 mb-1">무료</p>
              <p class="text-xs text-brand-600 mb-4 flex items-center gap-1">기본 요금제</p>
              <ul class="space-y-2 mb-6">
                <li v-for="f in plans[0].features" :key="f" class="flex items-center text-sm text-gray-700">
                  <svg class="w-4 h-4 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  {{ f }}
                </li>
              </ul>
              <div class="text-center">
                <span v-if="currentPlanId === 'business'" class="inline-flex px-4 py-2 text-sm font-semibold text-brand-700 bg-brand-100 rounded-lg">현재 사용 중</span>
                <button
                  v-else
                  class="w-full px-4 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  @click="handlePlanChange('business')"
                >
                  비즈니스로 변경
                </button>
              </div>
            </div>

            <!-- 엔터프라이즈 플랜 -->
            <div
              class="border-2 rounded-2xl p-6 relative transition-colors"
              :class="currentPlanId === 'enterprise' ? 'border-brand-500 bg-brand-50/30' : 'border-gray-200 hover:border-gray-300'"
            >
              <div class="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center mb-4">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900">엔터프라이즈</h3>
              <p class="text-2xl font-bold text-gray-900 mb-0">
                ₩19,900
                <span class="text-sm font-normal text-gray-500">월</span>
              </p>
              <p class="text-xs text-brand-600 mb-4">모든 기능 무제한</p>
              <ul class="space-y-2 mb-6">
                <li v-for="f in plans[1].features" :key="f" class="flex items-center text-sm text-gray-700">
                  <svg class="w-4 h-4 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  {{ f }}
                </li>
              </ul>
              <div class="text-center">
                <span v-if="currentPlanId === 'enterprise'" class="inline-flex px-4 py-2 text-sm font-semibold text-brand-700 bg-brand-100 rounded-lg">현재 사용 중</span>
                <button
                  v-else
                  class="w-full px-4 py-2.5 text-sm font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                  @click="handlePlanChange('enterprise')"
                >
                  엔터프라이즈로 업그레이드
                </button>
              </div>
            </div>
          </div>

          <div class="px-8 pb-8">
            <p class="text-xs text-gray-400">※ Enterprise 업그레이드 시 즉시 ₩19,900이 결제됩니다. 이후 매월 1일에 자동 결제됩니다.</p>
          </div>
        </div>
      </div>
    </teleport>
  </div>

  <ConfirmModal
    :show="modal.show"
    :title="modal.title"
    :message="modal.message"
    :type="modal.type"
    :show-cancel="modal.showCancel"
    :confirm-text="modal.confirmText"
    @confirm="closeModal"
    @cancel="closeModal"
  />
</template>

<style scoped>
@keyframes modal-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-modal-in {
  animation: modal-in 0.25s ease-out;
}
</style>
