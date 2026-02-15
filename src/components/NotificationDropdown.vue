<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore } from '@/Stores/notification'
import { storeToRefs } from 'pinia'

const router = useRouter()
const store = useNotificationStore()
const { dropdownNotifications } = storeToRefs(store)
const emit = defineEmits(['close'])

const rootRef = ref(null)
const isModalOpen = ref(false)
const selectedNotification = ref(null)
const actionMessage = ref('')

const openNotificationModal = (notificationData) => {
  selectedNotification.value = notificationData
  memoContent.value = ''
  isModalOpen.value = true
  store.markRead(notificationData.id)
}

const closeModal = () => {
  isModalOpen.value = false
  selectedNotification.value = null
  memoContent.value = ''
}

const goToAllNotifications = (tab = 'all') => {
  router.push({ path: '/notifications', query: { tab } })
  emit('close')
}

const handleDecision = (id, decision) => {
  const result = store.respondToRequest(id, decision)
  if (!result) return

  actionMessage.value =
    decision === 'accept' ? '요청을 수락했습니다.' : '요청을 거절했습니다.'

  setTimeout(() => {
    actionMessage.value = ''
  }, 2200)

  closeModal()
}

const goToScheduleDetail = (scheduleId) => {
  if (!scheduleId) return
  emit('close')
  closeModal()
  router.push({ path: '/schedule', query: { scheduleId } })
}

const onDocumentClick = (event) => {
  if (!rootRef.value) return
  if (!rootRef.value.contains(event.target)) {
    emit('close')
  }
}

onMounted(() => {
  setTimeout(() => {
    document.addEventListener('click', onDocumentClick)
  }, 0)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})
</script>

<template>
  <div
    ref="rootRef"
    class="absolute right-0 top-full mt-3 w-[440px] bg-white rounded-2xl z-50 overflow-hidden flex flex-col max-h-[80vh] shadow-[0_10px_40px_rgba(0,0,0,0.1)] border border-slate-200 animate-fade-in-down"
  >
    <div class="px-6 py-5 flex justify-between items-center border-b border-slate-100 bg-white flex-shrink-0">
      <div class="flex items-center gap-3">
        <h2 class="font-bold text-xl text-slate-800 font-display">알림</h2>
        <span
          v-if="dropdownNotifications.length > 0"
          class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100"
        >
          {{ dropdownNotifications.length }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="text-xs font-bold text-slate-500 hover:text-slate-700 px-2 py-1 rounded-md hover:bg-slate-100"
          @click="store.clearDropdownDismissed()"
        >
          전체 삭제
        </button>
        <button @click="emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      </div>
    </div>

    <div v-if="actionMessage" class="px-6 py-3 bg-emerald-50 text-emerald-700 text-sm font-medium border-b border-emerald-100">
      {{ actionMessage }}
    </div>

    <div class="overflow-y-auto flex-1 p-4 bg-slate-50/50 custom-scrollbar space-y-3">
      <div v-if="dropdownNotifications.length === 0" class="text-center py-10 text-slate-400 text-sm space-y-3">
        <p>새로운 알림이 없습니다.</p>
        <button
          class="text-blue-600 hover:underline text-sm font-medium"
          @click="goToAllNotifications('all')"
        >
          전체 알림 보기
        </button>
      </div>

      <div
        v-for="item in dropdownNotifications"
        :key="item.id"
        class="group relative bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
        :class="item.read ? '' : 'border-blue-300 shadow-sm'"
        @click="item.type === 'request' && openNotificationModal(item)"
      >
        <button
          class="absolute top-3 right-3 text-slate-300 hover:text-slate-600"
          @click.stop="store.dismissFromDropdown(item.id)"
          aria-label="알림 삭제"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
        <div class="flex gap-4">
          <div v-if="item.type === 'request'" class="flex-shrink-0 w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex flex-col items-center justify-center group-hover:bg-blue-600 transition-colors">
            <span class="text-[10px] font-bold text-blue-600 group-hover:text-blue-100 uppercase leading-none">{{ item.displayDate.month }}</span>
            <span class="text-lg font-bold text-blue-700 group-hover:text-white leading-none mt-1">{{ item.displayDate.day }}</span>
          </div>
          <div v-else class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
               :class="item.status === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'">
            <svg v-if="item.status === 'success'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>

          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span v-if="!item.read" class="w-2 h-2 rounded-full bg-blue-600"></span>
              <h3 class="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">{{ item.title }}</h3>
            </div>

            <p v-if="item.type === 'request'" class="text-[13px] text-slate-600 mb-1 leading-relaxed">
              <span class="text-slate-900 font-bold">{{ item.dateRaw }}</span> {{ item.timeRange }} · {{ item.applicant }}
            </p>
            <p v-else class="text-[13px] text-slate-600 mb-1 leading-relaxed">{{ item.content }}</p>

            <p v-if="item.type === 'request'" class="text-xs text-slate-500 mb-3">장소: {{ item.location }}</p>
            <div class="flex justify-between items-center text-[11px]">
              <span class="text-slate-400" v-if="item.type === 'request'">요청자 {{ item.requester }}</span>
              <span class="text-slate-400" v-else>알림</span>
              <span class="text-slate-400">{{ item.timeAgo }}</span>
            </div>

            <div v-if="item.type === 'request'" class="mt-3 flex gap-2">
              <button
                class="px-3 py-1.5 text-xs font-bold border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50"
                @click.stop="handleDecision(item.id, 'reject')"
              >
                거절
              </button>
              <button
                class="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                @click.stop="handleDecision(item.id, 'accept')"
              >
                수락
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="p-3 border-t border-slate-100 bg-white flex-shrink-0">
      <button
        @click="goToAllNotifications('all')"
        class="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-all group"
      >
        전체 알림 보기
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>
    </div>
  </div>

  <Teleport to="body">
    <div v-if="isModalOpen" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" @click="closeModal"></div>

      <div class="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden animate-fade-in-down">
        <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 class="font-bold text-slate-800 text-lg">{{ selectedNotification?.title }}</h3>
          <button @click="closeModal" class="text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="p-6 space-y-6">
          <div class="bg-blue-50 border border-blue-100 p-4 rounded-xl">
            <p class="text-blue-700 font-bold text-base mb-1">
              {{ selectedNotification?.dateRaw }} · {{ selectedNotification?.timeRange }}
            </p>
            <p class="text-slate-600 text-sm">면접 일정 요청이 도착했습니다.</p>
          </div>

          <div class="space-y-4 pt-2">
            <div v-if="selectedNotification?.recruitmentTitle" class="flex justify-between items-center text-sm">
              <span class="text-slate-500">공고</span>
              <span class="font-medium text-slate-800 text-right">{{ selectedNotification?.recruitmentTitle }}</span>
            </div>
            <div v-if="selectedNotification?.recruitmentStage" class="flex justify-between items-center text-sm">
              <span class="text-slate-500">단계</span>
              <span class="font-medium text-slate-800">{{ selectedNotification?.recruitmentStage }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-500">지원자</span>
              <span class="font-medium text-slate-800">{{ selectedNotification?.applicant }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-500">장소</span>
              <span class="font-medium text-slate-800">{{ selectedNotification?.location }}</span>
            </div>
            <div class="flex justify-between items-center text-sm">
              <span class="text-slate-500">요청자</span>
              <span class="font-medium text-slate-800">{{ selectedNotification?.requester }}</span>
            </div>
            <div v-if="selectedNotification?.memo" class="flex justify-between items-center text-sm">
              <span class="text-slate-500">메모</span>
              <span class="font-medium text-slate-800 text-right">{{ selectedNotification?.memo }}</span>
            </div>
          </div>

          <div class="mt-6 pt-5 border-t border-slate-100">
            <label class="block text-xs font-bold text-slate-500 mb-2">메모 (선택사항)</label>
            <textarea
                v-model="memoContent"
                class="w-full text-sm font-medium text-slate-800 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none placeholder-slate-400"
                rows="3"
                placeholder="전달할 내용이나 특이사항을 입력해주세요."
            ></textarea>
          </div>
        </div>

        <div class="p-4 px-6 bg-slate-50 border-t border-slate-100 flex gap-3 flex-shrink-0">
          <button
            @click="handleDecision(selectedNotification?.id, 'reject')"
            class="flex-1 py-2.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl font-bold transition-all"
          >
            거절하기
          </button>
          <button
            @click="handleDecision(selectedNotification?.id, 'accept')"
            class="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md transition-all"
          >
            수락하기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes fade-in-down {
  from { opacity: 0; transform: translateY(-10px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.animate-fade-in-down {
  animation: fade-in-down 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #cbd5e1;
}
</style>
