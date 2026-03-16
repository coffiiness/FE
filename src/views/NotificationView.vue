<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  buildNotificationFallbackRoute,
  formatNotificationDateTime,
  formatNotificationTimeAgo,
  getNotificationVisualType,
  NOTIFICATION_FILTERS,
  useNotificationStore
} from '@/stores/notification'
import { useAnnouncementNotificationModal } from '@/composables/useAnnouncementNotificationModal'
import AnnouncementDetailModal from '@/components/announcement/AnnouncementDetailModal.vue'
import ScheduleDetailModal from '@/components/schedule/ScheduleDetailModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { storeToRefs } from 'pinia'
import { useScheduleStore } from '@/stores/schedule'

const route = useRoute()
const router = useRouter()
const store = useNotificationStore()
const scheduleStore = useScheduleStore()
const { notifications, loadingList, activeFilter, hasNext, isMarkingAllRead, isRemovingAll, unreadCount } = storeToRefs(store)
const pageError = ref('')
const loadingMore = ref(false)
const showScheduleModal = ref(false)
const scheduleDetail = ref(null)
const showCancelledScheduleModal = ref(false)
const cancelledScheduleNotification = ref(null)
const {
  showAnnouncementModal,
  isAnnouncementLoading,
  announcementError,
  announcementDetail,
  openAnnouncementModal,
  closeAnnouncementModal
} = useAnnouncementNotificationModal()

const getNotificationIconClass = (item) => {
  const visualType = getNotificationVisualType(item)

  if (visualType === 'announcement') {
    return 'bg-amber-50 text-amber-600'
  }
  if (visualType === 'interview') {
    return 'bg-emerald-50 text-emerald-600'
  }
  if (visualType === 'kanban') {
    return 'bg-indigo-50 text-indigo-600'
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
const cancelledScheduleModalTitle = computed(() => '일정이 취소되었습니다.')
const cancelledScheduleModalMessage = computed(() => '')

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

const closeCancelledScheduleModal = () => {
  showCancelledScheduleModal.value = false
  cancelledScheduleNotification.value = null
}

const isScheduleNotification = (item) => {
  const targetType = String(item?.targetType || '').toUpperCase()
  const type = String(item?.type || '').toUpperCase()
  const actionUrl = String(item?.actionUrl || '')
  return Boolean(item?.targetId) && (
    targetType === 'SCHEDULE' ||
    targetType.startsWith('INTERVIEW') ||
    type.startsWith('INTERVIEW') ||
    /\/schedule(?:\?|$|\/)/i.test(actionUrl)
  )
}

const getNotificationCardClass = (item) => {
  if (item.isRead) {
    return 'border-slate-200 bg-white hover:border-slate-300'
  }

  const visualType = getNotificationVisualType(item)
  if (visualType === 'announcement') {
    return 'border-amber-200 bg-amber-50/70 hover:border-amber-300'
  }
  if (visualType === 'interview') {
    return 'border-emerald-200 bg-emerald-50/70 hover:border-emerald-300'
  }
  if (visualType === 'kanban') {
    return 'border-indigo-200 bg-indigo-50/70 hover:border-indigo-300'
  }
  return 'border-sky-200 bg-sky-50/70 hover:border-sky-300'
}

const getNotificationTypeLabel = (item) => {
  const visualType = getNotificationVisualType(item)
  if (visualType === 'announcement') return '공지'
  if (visualType === 'interview') return '면접'
  if (visualType === 'kanban') return '지원자'
  return '시스템'
}

const getNotificationTypePillClass = (item) => {
  const visualType = getNotificationVisualType(item)
  if (visualType === 'announcement') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }
  if (visualType === 'interview') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (visualType === 'kanban') {
    return 'border-indigo-200 bg-indigo-50 text-indigo-700'
  }
  return 'border-slate-200 bg-slate-50 text-slate-600'
}

const isCancelledScheduleNotification = (item) => {
  return String(item?.type || '').toUpperCase() === 'SCHEDULE_CANCELLED'
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

    if (isCancelledScheduleNotification(item)) {
      cancelledScheduleNotification.value = item
      showCancelledScheduleModal.value = true
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
  <div class="mx-auto max-w-[110rem] px-4 py-4 md:px-6 md:py-5">
    <section class="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div class="border-b border-slate-200 px-5 py-5 md:px-7 md:py-6">
        <div class="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div class="space-y-3">
            <div class="flex flex-wrap items-center gap-2">
              <h1 class="text-3xl font-extrabold tracking-[-0.04em] text-slate-900">알림</h1>
              <span class="inline-flex items-center rounded-full border border-brand-100 bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">
                읽지 않음 {{ unreadCount }}건
              </span>
              <span class="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-bold text-slate-500">
                목록 {{ notifications.length }}건
              </span>
            </div>

            <div class="flex flex-wrap gap-2">
              <button
                v-for="filter in NOTIFICATION_FILTERS"
                :key="filter.value"
                @click="setFilter(filter.value)"
                class="rounded-full border px-4 py-2 text-sm font-semibold transition-colors"
                :class="
                  activeFilter === filter.value
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                "
              >
                {{ filter.label }}
              </button>
            </div>
          </div>

          <div class="flex flex-wrap gap-2 xl:justify-end">
            <button
              class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
              :disabled="notifications.length === 0 || isMarkingAllRead"
              @click="handleReadAll"
            >
              전체 읽음
            </button>
            <button
              class="rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
              :disabled="notifications.length === 0 || isRemovingAll"
              @click="handleDeleteAll"
            >
              전체 삭제
            </button>
          </div>
        </div>
      </div>

      <div class="px-5 py-5 md:px-7 md:py-6">
        <div v-if="pageError" class="mb-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {{ pageError }}
        </div>

        <div v-if="loadingList && notifications.length === 0" class="py-20 text-center text-sm font-medium text-slate-400">
          알림을 불러오는 중입니다.
        </div>

        <div v-else-if="notifications.length === 0" class="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/70 px-6 py-20 text-center">
          <p class="text-sm font-medium text-slate-400">표시할 알림이 없습니다.</p>
          <p class="mt-2 text-xs text-slate-400">새로운 공지나 일정 변경이 생기면 여기서 바로 확인할 수 있습니다.</p>
        </div>

        <div v-else class="space-y-3">
          <article
            v-for="item in notifications"
            :key="item.id"
            class="group relative flex cursor-pointer gap-4 rounded-[24px] border p-4 transition-all md:p-5"
            :class="getNotificationCardClass(item)"
            @click="openNotification(item)"
          >
            <span
              v-if="!item.isRead"
              class="absolute bottom-5 left-0 top-5 w-1 rounded-r-full bg-brand-500"
            ></span>

            <button
              class="absolute right-4 top-4 rounded-full p-1.5 text-slate-300 transition-colors hover:bg-white hover:text-slate-600"
              aria-label="알림 삭제"
              @click.stop="handleDelete(item.id)"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
              :class="item.isRead ? getNotificationIconClass(item) : 'bg-white text-brand-600 ring-1 ring-brand-100'"
            >
              <svg v-if="getNotificationVisualType(item) === 'announcement'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882A1 1 0 0112.447 5l6.382 3.191A1 1 0 0119.382 9H20a1 1 0 110 2h-.618a1 1 0 01-.553.809L16 13.191V16a2 2 0 11-4 0v-.809l-2.829-1.382A1 1 0 018.618 13H8a1 1 0 110-2h.618a1 1 0 01.553-.809L11 8.809V5.882z" />
              </svg>
              <svg v-else-if="getNotificationVisualType(item) === 'interview'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <svg v-else-if="getNotificationVisualType(item) === 'kanban'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h7v12H4V6zm9 0h7v5h-7V6zm0 7h7v5h-7v-5z" />
              </svg>
              <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex min-w-0 items-start gap-3 pr-8">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h3 class="truncate text-base font-extrabold tracking-[-0.02em] text-slate-900">
                      {{ item.title }}
                    </h3>
                    <span
                      class="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold"
                      :class="getNotificationTypePillClass(item)"
                    >
                      {{ getNotificationTypeLabel(item) }}
                    </span>
                    <span
                      v-if="!item.isRead"
                      class="inline-flex items-center rounded-full bg-brand-50 px-2 py-1 text-[11px] font-bold text-brand-700"
                    >
                      새 알림
                    </span>
                  </div>
                  <p class="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-600">
                    {{ item.content }}
                  </p>
                </div>
              </div>

              <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-400">
                <span>{{ formatNotificationTimeAgo(item.createdAt) }}</span>
                <span>·</span>
                <span>{{ formatNotificationDateTime(item.createdAt) }}</span>
                <template v-if="item.readAt">
                  <span>·</span>
                  <span>읽음 {{ formatNotificationDateTime(item.readAt) }}</span>
                </template>
              </div>
            </div>
          </article>

          <div v-if="hasNext" class="pt-3 flex justify-center">
            <button
              class="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
              :disabled="loadingMore"
              @click="loadMore"
            >
              {{ loadingMore ? '불러오는 중...' : '더 보기' }}
            </button>
          </div>
        </div>
      </div>
    </section>
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

  <ConfirmModal
    :show="showCancelledScheduleModal"
    :title="cancelledScheduleModalTitle"
    :message="cancelledScheduleModalMessage"
    type="warning"
    confirmText="확인"
    :showCancel="false"
    @confirm="closeCancelledScheduleModal"
    @cancel="closeCancelledScheduleModal"
  />
</template>
