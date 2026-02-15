<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotificationStore } from '@/Stores/notification'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const store = useNotificationStore()
const { sortedNotifications, sortedRequestNotifications, requestCount } = storeToRefs(store)

const activeTab = computed(() =>
  route.query.tab === 'request' ? 'request' : 'all'
)

const setTab = (tab) => {
  router.replace({ query: { ...route.query, tab } })
}

const listForTab = computed(() => {
  return activeTab.value === 'request'
    ? sortedRequestNotifications.value
    : sortedNotifications.value
})

const handleDecision = (item, decision) => {
  store.respondToRequest(item.id, decision)
  setTab('all')
}

const isExpanded = (item) => {
  return item.type === 'request' && expandedRequestId.value === item.id
}

const toggleExpand = (item) => {
  if (item.type !== 'request') return
  expandedRequestId.value = expandedRequestId.value === item.id ? null : item.id
}

const expandedRequestId = ref(null)

onBeforeUnmount(() => {
  store.markAllRead()
})
</script>

<template>
  <div class="max-w-4xl mx-auto p-6 bg-white min-h-screen">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-slate-900">알림</h1>
    </div>

    <div class="flex border-b border-gray-200 mb-6">
      <button
        @click="setTab('all')"
        class="px-6 py-3 border-b-2 font-medium transition-colors"
        :class="activeTab === 'all' ? 'border-slate-800 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-700'"
      >
        전체 알림
      </button>

      <button
        @click="setTab('request')"
        class="px-6 py-3 border-b-2 font-medium transition-colors"
        :class="activeTab === 'request' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'"
      >
        일정 요청
        <span
          class="ml-1 px-2 py-0.5 rounded-full text-xs"
          :class="activeTab === 'request' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'"
        >
          {{ requestCount }}
        </span>
      </button>
    </div>


    <div v-if="listForTab.length === 0" class="py-16 text-center text-slate-400">
      <p class="mb-3">표시할 알림이 없습니다.</p>
      <button class="text-blue-600 hover:underline text-sm font-medium" @click="setTab('all')">
        전체 알림 보기
      </button>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="item in listForTab"
        :key="item.id"
        class="p-5 border border-gray-100 rounded-xl flex gap-4 items-start transition-all cursor-pointer"
        :class="[
          item.type === 'request' ? 'bg-blue-50 border-blue-100' : 'bg-white',
          item.read ? 'opacity-90' : 'border-blue-300 shadow-sm'
        ]"
        @click="toggleExpand(item)"
      >
        <div v-if="item.type === 'alert'" class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          :class="item.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'">
          <svg v-if="item.status === 'success'" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </div>

        <div v-else class="p-2 bg-white rounded-lg shadow-sm w-12 h-12 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100 leading-tight text-center shrink-0">
          {{ item.displayDate.month.toUpperCase() }}<br><span class="text-lg">{{ item.displayDate.day }}</span>
        </div>

        <div class="flex-1">
          <div class="flex items-center gap-2">
            <span v-if="!item.read" class="w-2 h-2 rounded-full bg-blue-600"></span>
            <h3 class="font-bold text-gray-900">{{ item.title }}</h3>
          </div>
          <p v-if="item.type === 'request'" class="text-sm text-gray-600 mt-1">
            {{ item.dateRaw }} · {{ item.timeRange }} · {{ item.applicant }}
          </p>
          <p v-else class="text-sm text-gray-600 mt-1">
            {{ item.content }}
            <button
              v-if="item.scheduleId && item.status === 'success' && item.title.includes('확정')"
              class="ml-2 text-blue-600 hover:underline text-sm font-medium"
              @click="router.push({ path: '/schedule', query: { scheduleId: item.scheduleId } })"
            >
              일정 보러가기
            </button>
          </p>
          <div class="flex items-center mt-2 text-xs text-gray-400">
            <span v-if="item.type === 'request'">요청자 {{ item.requester }}</span>
            <span v-else>알림</span>
            <span class="mx-2">·</span>
            <span>{{ item.timeAgo }}</span>
          </div>
          <div v-if="isExpanded(item)" class="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-4 text-sm text-slate-600 space-y-3">
            <div v-if="item.recruitmentTitle" class="flex gap-4">
              <span class="text-xs text-slate-500 w-16 shrink-0 pt-0.5">공고</span>
              <span class="font-medium text-slate-800">{{ item.recruitmentTitle }}</span>
            </div>
            <div v-if="item.recruitmentStage" class="flex gap-4">
              <span class="text-xs text-slate-500 w-16 shrink-0 pt-0.5">단계</span>
              <span class="font-medium text-slate-800">{{ item.recruitmentStage }}</span>
            </div>

            <div class="h-px bg-slate-200"></div>

            <div class="space-y-3">
              <div class="flex gap-4">
                <span class="text-xs text-slate-500 w-16 shrink-0 pt-0.5">장소</span>
                <span class="font-medium text-slate-800">{{ item.location }}</span>
              </div>
              <div class="flex gap-4">
                <span class="text-xs text-slate-500 w-16 shrink-0 pt-0.5">요청자</span>
                <span class="font-medium text-slate-800">{{ item.requester }}</span>
              </div>
            </div>

            <div v-if="item.memo" class="flex gap-4">
              <span class="text-xs text-slate-500 w-16 shrink-0 pt-0.5">메모</span>
              <span class="font-medium text-slate-800 whitespace-pre-wrap">{{ item.memo }}</span>
            </div>
          </div>
        </div>

        <div v-if="item.type === 'request'" class="flex gap-2">
          <button
            class="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            @click.stop="handleDecision(item, 'reject')"
          >
            거절
          </button>
          <button
            class="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            @click.stop="handleDecision(item, 'accept')"
          >
            수락
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
