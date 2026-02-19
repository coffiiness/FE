<script setup>
import { ref } from 'vue'

const showSubscriptionModal = ref(false)
const showCardModal = ref(false)
const showEmailModal = ref(false)

const currentPlan = ref({
  name: '비즈니스',
  billing: '예정된 결제 없음',
  period: '구독기간 없음'
})

const cardType = ref('corporate')
const cardForm = ref({
  cardNumber: '',
  expiry: '',
  bizNumber: '',
  password: ''
})

const emailForm = ref({
  email: ''
})

const subscriptionHistory = ref([])

const handleCardRegister = () => {
  // 실제 등록 로직이 들어갈 곳
  showCardModal.value = false
  cardForm.value = { cardNumber: '', expiry: '', bizNumber: '', password: '' }
}

const handleEmailRegister = () => {
  // 실제 등록 로직이 들어갈 곳
  showEmailModal.value = false
  emailForm.value = { email: '' }
}
</script>

<template>
  <div class="max-w-7xl mx-auto px-4">
    <h1 class="text-2xl font-bold text-gray-900 mb-8">구독 및 결제</h1>

    <section class="mb-10">
      <h2 class="text-lg font-bold text-gray-900 mb-4">사용 중인 요금제</h2>

      <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div class="mb-4">
          <h3 class="text-xl font-bold text-gray-900 mb-4">{{ currentPlan.name }}</h3>
          <div class="flex gap-12">
            <div>
              <p class="text-sm text-gray-500 mb-1">요금제</p>
              <p class="text-sm font-semibold text-gray-900">{{ currentPlan.name }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 mb-1">결제 방식</p>
              <p class="text-sm font-semibold text-gray-900">{{ currentPlan.billing }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500 mb-1">구독 기간</p>
              <p class="text-sm font-semibold text-gray-900">{{ currentPlan.period }}</p>
            </div>
          </div>
        </div>

        <div class="border-t border-gray-100 pt-4 flex items-center justify-between">
          <div class="flex items-center text-sm text-gray-500">
            <svg class="w-4 h-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            구독 및 결제에 대해 궁금하신 점이 있으신가요?
          </div>
          <div class="flex items-center gap-3">
            <button class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              상세 기능 비교
            </button>
            <button
                class="px-4 py-2 text-sm font-medium text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
                @click="showSubscriptionModal = true"
            >
              구독 변경
            </button>
          </div>
        </div>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-lg font-bold text-gray-900 mb-4">청구 및 결제 정보</h2>

      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        <div class="flex items-center justify-between px-6 py-5">
          <div class="flex items-center gap-4">
            <span class="text-sm font-semibold text-gray-900 w-28">결제 카드</span>
            <span class="text-sm text-gray-500">등록된 카드가 없습니다.</span>
          </div>
          <button
              class="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors flex items-center gap-1"
              @click="showCardModal = true"
          >
            등록하기
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div class="flex items-center justify-between px-6 py-5">
          <div class="flex items-center gap-4">
            <span class="text-sm font-semibold text-gray-900 w-28">결제 확인 이메일</span>
            <span class="text-sm text-gray-500">등록된 이메일이 없습니다.</span>
          </div>
          <button
              class="text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors flex items-center gap-1"
              @click="showEmailModal = true"
          >
            등록하기
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-lg font-bold text-gray-900 mb-4">구독 내역</h2>

      <div class="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead>
          <tr class="border-b border-gray-200 bg-gray-50/50">
            <th class="text-left px-6 py-3 font-semibold text-gray-600">구독 ID</th>
            <th class="text-left px-6 py-3 font-semibold text-gray-600">요금제</th>
            <th class="text-left px-6 py-3 font-semibold text-gray-600">구독 시작일</th>
            <th class="text-left px-6 py-3 font-semibold text-gray-600">구독 종료일</th>
            <th class="text-left px-6 py-3 font-semibold text-gray-600">상태</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="item in subscriptionHistory" :key="item.id">
            <td class="px-6 py-4 text-gray-900">{{ item.id }}</td>
            <td class="px-6 py-4 text-gray-900">{{ item.plan }}</td>
            <td class="px-6 py-4 text-gray-500">{{ item.startDate }}</td>
            <td class="px-6 py-4 text-gray-500">{{ item.endDate }}</td>
            <td class="px-6 py-4">
                <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full"
                      :class="item.status === '활성' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'"
                >
                  {{ item.status }}
                </span>
            </td>
          </tr>
          </tbody>
        </table>

        <div v-if="subscriptionHistory.length === 0" class="flex flex-col items-center justify-center py-16 text-gray-400">
          <svg class="w-12 h-12 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="text-sm">내역 없음</p>
        </div>
      </div>
    </section>

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
            <div class="border-2 border-brand-500 rounded-2xl p-6 relative bg-brand-50/30">
              <div class="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mb-4">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900">비즈니스</h3>
              <p class="text-2xl font-bold text-gray-900 mb-1">무료</p>
              <p class="text-xs text-brand-600 mb-4 flex items-center gap-1">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                7일간 무료 이용
              </p>
              <ul class="space-y-2 mb-6">
                <li class="flex items-center text-sm text-gray-700">
                  <svg class="w-4 h-4 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  최대 50명 사용자
                </li>
                <li class="flex items-center text-sm text-gray-700">
                  <svg class="w-4 h-4 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  채용 관리 전체 기능
                </li>
                <li class="flex items-center text-sm text-gray-700">
                  <svg class="w-4 h-4 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  회의실 예약 관리
                </li>
                <li class="flex items-center text-sm text-gray-700">
                  <svg class="w-4 h-4 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  이메일 지원
                </li>
              </ul>
              <div class="text-center">
                <span class="inline-flex px-4 py-2 text-sm font-semibold text-brand-700 bg-brand-100 rounded-lg">현재 사용 중</span>
              </div>
            </div>

            <div class="border border-gray-200 rounded-2xl p-6 hover:border-gray-300 transition-colors">
              <div class="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center mb-4">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900">엔터프라이즈</h3>
              <p class="text-2xl font-bold text-gray-900 mb-0">
                ₩89,000
                <span class="text-sm font-normal text-gray-500">월 (사용자당)</span>
              </p>
              <p class="text-xs text-brand-600 mb-4">모든 기능 무제한</p>
              <ul class="space-y-2 mb-6">
                <li class="flex items-center text-sm text-gray-700">
                  <svg class="w-4 h-4 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  무제한 사용자
                </li>
                <li class="flex items-center text-sm text-gray-700">
                  <svg class="w-4 h-4 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  비즈니스 기능 전체 포함
                </li>
                <li class="flex items-center text-sm text-gray-700">
                  <svg class="w-4 h-4 mr-2 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                  고급 분석 리포트
                </li>
              </ul>
              <div class="text-center">
                <button class="w-full px-4 py-2.5 text-sm font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors">
                  엔터프라이즈로 업그레이드
                </button>
              </div>
            </div>
          </div>

          <div class="px-8 pb-8">
            <p class="text-xs text-gray-400">※ 요금제 변경 시 차이액은 다음 결제일에 정산됩니다. 자세한 내용은 요금제 가이드를 참고해주세요.</p>
          </div>
        </div>
      </div>
    </teleport>

    <teleport to="body">
      <div v-if="showCardModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="showCardModal = false">
        <div class="bg-white rounded-2xl shadow-2xl w-[480px] max-w-[90vw] animate-modal-in">
          <div class="flex items-center justify-between px-8 pt-8 pb-4">
            <h2 class="text-xl font-bold text-gray-900">결제 카드 등록</h2>
            <button class="text-gray-400 hover:text-gray-600 transition-colors" @click="showCardModal = false">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="px-8">
            <div class="flex border border-gray-200 rounded-lg overflow-hidden mb-6">
              <button
                  class="flex-1 py-2.5 text-sm font-medium transition-colors"
                  :class="cardType === 'corporate' ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
                  @click="cardType = 'corporate'"
              >
                법인카드
              </button>
              <button
                  class="flex-1 py-2.5 text-sm font-medium transition-colors"
                  :class="cardType === 'personal' ? 'bg-slate-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'"
                  @click="cardType = 'personal'"
              >
                개인카드
              </button>
            </div>

            <div class="space-y-5">
              <div>
                <label class="block text-sm font-semibold text-gray-900 mb-2">
                  {{ cardType === 'corporate' ? '법인 카드 번호' : '카드 번호' }}
                </label>
                <input
                    v-model="cardForm.cardNumber"
                    type="text"
                    :placeholder="cardType === 'corporate' ? '결제할 법인 카드 번호를 입력해 주세요.' : '결제할 카드 번호를 입력해 주세요.'"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                >
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-900 mb-2">
                  {{ cardType === 'corporate' ? '법인 카드 유효 기간' : '카드 유효 기간' }}
                </label>
                <input
                    v-model="cardForm.expiry"
                    type="text"
                    placeholder="유효기간(MMYY)"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                >
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-900 mb-2">사업자 등록 번호</label>
                <input
                    v-model="cardForm.bizNumber"
                    type="text"
                    placeholder="사업자 등록번호를 입력해 주세요."
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                >
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-900 mb-2">카드 비밀번호 앞 두자리</label>
                <input
                    v-model="cardForm.password"
                    type="password"
                    placeholder="비밀번호 앞 두자리를 입력해 주세요."
                    maxlength="2"
                    class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
                >
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-3 px-8 py-6">
            <button
                class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                @click="showCardModal = false"
            >
              취소
            </button>
            <button
                class="px-5 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-500 transition-colors"
                @click="handleCardRegister"
            >
              등록하기
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <teleport to="body">
      <div v-if="showEmailModal" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="showEmailModal = false">
        <div class="bg-white rounded-2xl shadow-2xl w-[480px] max-w-[90vw] animate-modal-in">
          <div class="flex items-center justify-between px-8 pt-8 pb-4">
            <h2 class="text-xl font-bold text-gray-900">결제 확인 이메일 등록</h2>
            <button class="text-gray-400 hover:text-gray-600 transition-colors" @click="showEmailModal = false">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="px-8">
            <div>
              <label class="block text-sm font-semibold text-gray-900 mb-2">이메일</label>
              <input
                  v-model="emailForm.email"
                  type="email"
                  placeholder="결제 확인 정보를 받을 이메일을 입력해 주세요."
                  class="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-colors"
              >
            </div>
          </div>

          <div class="flex justify-end gap-3 px-8 py-6">
            <button
                class="px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                @click="showEmailModal = false"
            >
              취소
            </button>
            <button
                class="px-5 py-2.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-500 transition-colors"
                @click="handleEmailRegister"
            >
              등록하기
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
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