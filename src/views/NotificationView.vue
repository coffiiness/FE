<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  buildNotificationFallbackRoute,
  formatNotificationDateTime,
  NOTIFICATION_FILTERS,
  useNotificationStore
} from '@/stores/notification'
import { useAnnouncementNotificationModal } from '@/composables/useAnnouncementNotificationModal'
import AnnouncementDetailModal from '@/components/announcement/AnnouncementDetailModal.vue'
import ScheduleDetailModal from '@/components/schedule/ScheduleDetailModal.vue'
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '@/stores/schedule'

const route = useRoute()
const router = useRouter()
const store = useNotificationStore()
const scheduleStore = useScheduleStore()
const { notifications, loadingList, activeFilter, hasNext, isMarkingAllRead, isRemovingAll } = storeToRefs(store)
const pageError = ref('')
const loadingMore = ref(false)
const showScheduleModal = ref(false)
const scheduleDetail = ref(null)
const {
  showAnnouncementModal,
  isAnnouncementLoading,
  announcementError,
  announcementDetail,
  openAnnouncementModal,
  closeAnnouncementModal
} = useAnnouncementNotificationModal()

const getNotificationIconClass = (item) => {
  if (item.filterType === 'ANNOUNCEMENT') {
    return 'bg-amber-50 text-amber-600'
  }
  if (item.filterType === 'INTERVIEW') {
    return 'bg-emerald-50 text-emerald-600'
  }
  return 'bg-slate-100 text-slate-500'
}

const tabToFilterMap = {
  all: 'ALL',
  announcement: 'ANNOUNCEMENT',
  interview: 'INTERVIEW',
  system: 'SYSTEM'
}

const filterToTabMap = {
  ALL: 'all',
  ANNOUNCEMENT: 'announcement',
  INTERVIEW: 'interview',
  SYSTEM: 'system'
}

const selectedFilter = computed(() => tabToFilterMap[route.query.tab] || 'ALL')

const syncFromRoute = async () => {
  try {
    pageError.value = ''
    await store.fetchNotifications({ filter: selectedFilter.value, page: 0 })
  } catch (error) {
    console.error('알림 목록 조회 실패:', error)
    pageError.value = '알림 목록을 불러오지 못했습니다.'
  }
}

const setFilter = (filter) => {
  router.replace({ query: { ...route.query, tab: filterToTabMap[filter] } })
}

const closeScheduleModal = () => {
  showScheduleModal.value = false
  scheduleDetail.value = null
}

const isScheduleNotification = (item) => {
  const targetType = String(item?.targetType || '').toUpperCase()
  const actionUrl = String(item?.actionUrl || '')
  return Boolean(item?.targetId) && (targetType === 'SCHEDULE' || /\/schedule(?:\?|$|\/)/i.test(actionUrl))
}

const openNotification = async (item) => {
  try {
    if (!item.isRead) {
      await store.markRead(item.id)
    }

    if (item.targetType === 'ANNOUNCEMENT') {
      await openAnnouncementModal(item)
      return
    }

    if (isScheduleNotification(item)) {
      const detail = await scheduleStore.getScheduleDetail(item.targetId)
      scheduleDetail.value = detail
      showScheduleModal.value = true
      return
    }

    const target = item.actionUrl || buildNotificationFallbackRoute(item)
    const resolved = router.resolve(target)
    await router.push(resolved?.matched?.length ? target : buildNotificationFallbackRoute(item))
  } catch (error) {
    console.error('알림 열기 실패:', error)
    pageError.value = '알림을 여는 중 문제가 발생했습니다.'
  }
}

const handleReadAll = async () => {
  try {
    pageError.value = ''
    await store.markAllRead()
  } catch (error) {
    console.error('전체 읽음 실패:', error)
    pageError.value = '전체 읽음 처리에 실패했습니다.'
  }
}

const handleDelete = async (id) => {
  try {
    pageError.value = ''
    await store.removeNotification(id)
  } catch (error) {
    console.error('알림 삭제 실패:', error)
    pageError.value = '알림 삭제에 실패했습니다.'
  }
}

const handleDeleteAll = async () => {
  try {
    pageError.value = ''
    await store.removeAllNotifications()
  } catch (error) {
    console.error('전체 삭제 실패:', error)
    pageError.value = '전체 삭제에 실패했습니다.'
  }
}

const loadMore = async () => {
  try {
    loadingMore.value = true
    await store.fetchNextNotifications()
  } catch (error) {
    console.error('알림 추가 조회 실패:', error)
    pageError.value = '알림을 더 불러오지 못했습니다.'
  } finally {
    loadingMore.value = false
  }
}

watch(
  () => route.query.tab,
  async () => {
    await syncFromRoute()
  },
  { immediate: true }
)

onMounted(async () => {
  store.setNotificationPageActive(true)

  try {
    await store.fetchUnreadCount()
  } catch (error) {
    console.error('미확인 개수 조회 실패:', error)
  }
})

onBeforeUnmount(() => {
  store.setNotificationPageActive(false)
})
</script>

<template>
  <div class="max-w-5xl mx-auto p-6 bg-white min-h-screen rounded-[32px] border border-slate-200 shadow-sm">
    <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
      <div class="flex flex-wrap border-b border-gray-200">
        <button
          v-for="filter in NOTIFICATION_FILTERS"
          :key="filter.value"
          @click="setFilter(filter.value)"
          class="px-6 py-3 border-b-2 font-medium transition-colors"
          :class="activeFilter === filter.value ? 'border-slate-800 text-slate-900' : 'border-transparent text-gray-500 hover:text-gray-700'"
        >
          {{ filter.label }}
        </button>
      </div>

      <div class="flex items-center gap-2">
        <button
          class="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          :disabled="notifications.length === 0 || isMarkingAllRead"
          @click="handleReadAll"
        >
          전체 읽음
        </button>
        <button
          class="px-4 py-2 rounded-lg border border-rose-200 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
          :disabled="notifications.length === 0 || isRemovingAll"
          @click="handleDeleteAll"
        >
          전체 삭제
        </button>
      </div>
    </div>

    <div v-if="pageError" class="mb-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {{ pageError }}
    </div>

    <div v-if="loadingList && notifications.length === 0" class="py-16 text-center text-slate-400">
      알림을 불러오는 중입니다.
    </div>

    <div v-else-if="notifications.length === 0" class="py-16 text-center text-slate-400">
      <p>표시할 알림이 없습니다.</p>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="item in notifications"
        :key="item.id"
        class="relative p-5 border rounded-[24px] flex gap-4 items-start transition-all cursor-pointer hover:border-slate-300"
        :class="item.isRead ? 'bg-white border-slate-200' : 'bg-blue-50 border-blue-200 shadow-sm'"
        @click="openNotification(item)"
      >
        <button
          class="absolute top-4 right-4 text-slate-300 hover:text-slate-600"
          aria-label="알림 삭제"
          @click.stop="handleDelete(item.id)"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          :class="item.isRead ? getNotificationIconClass(item) : 'bg-blue-100 text-blue-600'">
          <svg v-if="item.filterType === 'ANNOUNCEMENT'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882A1 1 0 0112.447 5l6.382 3.191A1 1 0 0119.382 9H20a1 1 0 110 2h-.618a1 1 0 01-.553.809L16 13.191V16a2 2 0 11-4 0v-.809l-2.829-1.382A1 1 0 018.618 13H8a1 1 0 110-2h.618a1 1 0 01.553-.809L11 8.809V5.882z" />
          </svg>
          <svg v-else-if="item.filterType === 'INTERVIEW'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 pr-8">
            <span v-if="!item.isRead" class="w-2 h-2 rounded-full bg-blue-600"></span>
            <h3 class="font-bold text-gray-900">{{ item.title }}</h3>
          </div>
          <p class="text-sm text-gray-600 mt-1 whitespace-pre-wrap break-words">{{ item.content }}</p>
          <div class="flex items-center mt-3 text-xs text-gray-400">
            <span>{{ formatNotificationDateTime(item.createdAt) }}</span>
            <span v-if="item.readAt" class="mx-2">·</span>
            <span v-if="item.readAt">읽음 {{ formatNotificationDateTime(item.readAt) }}</span>
          </div>
        </div>

      </div>

      <div v-if="hasNext" class="pt-4 flex justify-center">
        <button
          class="px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          :disabled="loadingMore"
          @click="loadMore"
        >
          {{ loadingMore ? '불러오는 중...' : '더 보기' }}
        </button>
      </div>
    </div>
  </div>

  <AnnouncementDetailModal
    :show="showAnnouncementModal"
    :loading="isAnnouncementLoading"
    :error="announcementError"
    :announcement="announcementDetail"
    @close="closeAnnouncementModal"
  />

  <ScheduleDetailModal
    :isOpen="showScheduleModal"
    :event="scheduleDetail || {}"
    :showActions="false"
    @close="closeScheduleModal"
  />
</template>
