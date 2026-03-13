<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { dashboardChatApi } from '@/api/dashboardChat'
import { useNotificationStore } from '@/stores/notification'

const MAX_MESSAGES = 50
const props = defineProps({
  showCloseButton: {
    type: Boolean,
    default: false
  }
})
const emit = defineEmits(['close'])

const notificationStore = useNotificationStore()

const loading = ref(false)
const sending = ref(false)
const errorMessage = ref('')
const messageText = ref('')
const messages = ref([])
const bodyRef = ref(null)

let removeStreamListener = () => {}

const normalizedMessages = computed(() => messages.value.slice(-MAX_MESSAGES))
const messageCountLabel = computed(() => `${normalizedMessages.value.length}/${MAX_MESSAGES}`)
const canSend = computed(() => !sending.value && messageText.value.trim().length > 0)

const normalizeMessage = (item = {}) => ({
  id: Number(item.id || 0),
  alias: String(item.alias || '익명'),
  content: String(item.content || '').trim(),
  createdAt: item.createdAt || null,
  mine: Boolean(item.mine)
})

const formatMessageTime = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 메시지 목록을 최신 50개 기준으로 유지한다.
const setMessages = (items) => {
  messages.value = items.slice(-MAX_MESSAGES)
}

// 같은 메시지는 갱신하고, 새 메시지는 뒤에 추가한다.
const mergeMessage = (item) => {
  if (!item?.id) return

  const index = messages.value.findIndex((message) => message.id === item.id)
  if (index === -1) {
    setMessages([...messages.value, item])
    return
  }

  const nextMessages = [...messages.value]
  nextMessages[index] = { ...nextMessages[index], ...item, mine: nextMessages[index].mine || item.mine }
  setMessages(nextMessages)
}

// 새 메시지가 보이도록 스크롤을 하단으로 이동한다.
const scrollToBottom = async () => {
  await nextTick()
  const element = bodyRef.value
  if (!element) return
  element.scrollTop = element.scrollHeight
}

// 최근 채팅 메시지를 초기 로딩한다.
const loadMessages = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const response = await dashboardChatApi.getMessages()
    const data = Array.isArray(response?.data?.data) ? response.data.data : []
    setMessages(data.map(normalizeMessage))
    await scrollToBottom()
  } catch (error) {
    console.error('대시보드 채팅 조회 실패:', error)
    errorMessage.value = '채팅을 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

// 입력한 채팅 메시지를 전송한다.
const sendMessage = async () => {
  const content = messageText.value.trim()
  if (!content || sending.value) return

  sending.value = true
  errorMessage.value = ''

  try {
    const response = await dashboardChatApi.createMessage({ content })
    const message = normalizeMessage(response?.data?.data || {})
    mergeMessage(message)
    messageText.value = ''
    await scrollToBottom()
  } catch (error) {
    console.error('대시보드 채팅 전송 실패:', error)
    errorMessage.value = '메시지 전송에 실패했습니다.'
  } finally {
    sending.value = false
  }
}

// 알림 SSE 스트림에서 채팅 메시지 이벤트만 반영한다.
const handleStreamEvent = async (event) => {
  if (event?.type !== 'workspace-chat-message-created') return

  const message = normalizeMessage(event?.payload?.message || {})
  if (!message.id) return

  mergeMessage(message)
  await scrollToBottom()
}

onMounted(async () => {
  await loadMessages()
  removeStreamListener = notificationStore.addStreamListener(handleStreamEvent)
})

onBeforeUnmount(() => {
  removeStreamListener()
})

watch(
  () => normalizedMessages.value.length,
  async () => {
    await scrollToBottom()
  }
)
</script>

<template>
  <section class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-[420px] max-h-[420px] flex flex-col">
    <div class="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 class="text-base font-bold text-slate-800">익명 라운지</h3>
        <p class="text-xs text-slate-400 mt-1">같은 워크스페이스 사람들과 가볍게 이야기할 수 있어요.</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
          최근 {{ messageCountLabel }}
        </span>
        <button
          v-if="props.showCloseButton"
          type="button"
          class="w-8 h-8 inline-flex items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:border-slate-300 transition"
          @click="emit('close')"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <div
      ref="bodyRef"
      class="min-h-0 flex-1 overflow-y-auto custom-scrollbar rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3 space-y-2"
    >
      <div v-if="loading" class="h-full flex flex-col items-center justify-center text-slate-300 min-h-[90px]">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-brand-600 mb-2"></div>
        <p class="text-xs font-medium text-slate-400">채팅을 불러오는 중입니다.</p>
      </div>

      <div v-else-if="normalizedMessages.length === 0" class="h-full flex flex-col items-center justify-center text-slate-300 min-h-[90px]">
        <svg class="w-9 h-9 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z" />
        </svg>
        <p class="text-xs font-medium">첫 메시지를 남겨보세요.</p>
      </div>

      <div
        v-for="message in normalizedMessages"
        :key="message.id"
        class="flex"
        :class="message.mine ? 'justify-end' : 'justify-start'"
      >
        <article
          class="max-w-[85%] rounded-2xl px-3 py-2 shadow-sm"
          :class="message.mine ? 'bg-brand-600 text-white' : 'bg-white border border-slate-200 text-slate-700'"
        >
          <div class="flex items-center gap-2 mb-1">
            <span
              class="text-[11px] font-bold"
              :class="message.mine ? 'text-brand-50/90' : 'text-brand-700'"
            >
              {{ message.alias }}
            </span>
            <span
              class="text-[10px]"
              :class="message.mine ? 'text-white/70' : 'text-slate-400'"
            >
              {{ formatMessageTime(message.createdAt) }}
            </span>
          </div>
          <p class="text-xs leading-5 whitespace-pre-wrap break-words">{{ message.content }}</p>
        </article>
      </div>
    </div>

    <div class="mt-4">
      <div class="flex items-end gap-3">
        <textarea
          v-model="messageText"
          rows="2"
          maxlength="500"
          class="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
          placeholder="익명으로 메시지를 남겨보세요."
          @keydown.enter.exact.prevent="sendMessage"
        />
        <button
          type="button"
          class="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          :disabled="!canSend"
          @click="sendMessage"
        >
          {{ sending ? '전송 중' : '보내기' }}
        </button>
      </div>
      <div class="mt-2 flex items-center justify-between gap-3">
        <p v-if="errorMessage" class="text-xs font-medium text-rose-500">{{ errorMessage }}</p>
        <p v-else class="text-xs text-slate-400">Enter로 바로 전송하고, Shift+Enter로 줄바꿈할 수 있어요.</p>
        <p class="text-[11px] font-medium text-slate-400">{{ messageText.length }}/500</p>
      </div>
    </div>
  </section>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }
</style>
