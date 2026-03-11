<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotificationStore, formatNotificationTimeAgo, buildNotificationFallbackRoute, getNotificationVisualType } from '@/stores/notification'
import { useAnnouncementNotificationModal } from '@/composables/useAnnouncementNotificationModal'
import AnnouncementDetailModal from '@/components/announcement/AnnouncementDetailModal.vue'
import { storeToRefs } from 'pinia'

const router = useRouter()
const store = useNotificationStore()
const { dropdownNotifications, loadingDropdown, isMarkingAllRead } = storeToRefs(store)
const emit = defineEmits(['close'])

const rootRef = ref(null)
const actionError = ref('')
const {
  showAnnouncementModal,
  isAnnouncementLoading,
  announcementError,
  announcementDetail,
  openAnnouncementModal,
  closeAnnouncementModal
} = useAnnouncementNotificationModal()

const visibleCount = computed(() => dropdownNotifications.value.length)

const getNotificationIconClass = (item) => {
  const visualType = getNotificationVisualType(item)

  if (visualType === 'announcement') {
    return 'bg-amber-50 text-amber-600 border border-amber-100'
  }
  if (visualType === 'interview') {
    return 'bg-emerald-50 text-emerald-600 border border-emerald-100'
  }
  if (visualType === 'kanban') {
    return 'bg-indigo-50 text-indigo-600 border border-indigo-100'
  }
  return 'bg-slate-100 text-slate-500 border border-slate-200'
}

const navigateToNotificationTarget = async (item) => {
  const target = item?.actionUrl || buildNotificationFallbackRoute(item)
  const resolved = router.resolve(target)

  emit('close')

  if (resolved?.matched?.length) {
    await router.push(target)
    return
  }

  await router.push(buildNotificationFallbackRoute(item))
}

const handleNotificationClick = async (item) => {
  try {
    await store.markRead(item.id)

    if (item.targetType === 'ANNOUNCEMENT') {
      await openAnnouncementModal(item)
      return
    }

    await navigateToNotificationTarget(item)
  } catch (error) {
    console.error('알림 읽음 처리 실패:', error)
    actionError.value = '알림을 열지 못했습니다. 잠시 후 다시 시도해 주세요.'
  }
}

const handleDelete = async (id) => {
  try {
    await store.removeNotification(id)
  } catch (error) {
    console.error('알림 삭제 실패:', error)
    actionError.value = '알림 삭제에 실패했습니다.'
  }
}

const handleReadAll = async () => {
  try {
    await store.markAllRead()
  } catch (error) {
    console.error('전체 읽음 처리 실패:', error)
    actionError.value = '전체 읽음 처리에 실패했습니다.'
  }
}

const goToAllNotifications = async (tab = 'all') => {
  emit('close')
  await router.push({ path: '/notifications', query: { tab } })
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
          v-if="visibleCount > 0"
          class="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100"
        >
          {{ visibleCount }}
        </span>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="text-xs font-bold text-slate-500 hover:text-slate-700 px-2 py-1 rounded-md hover:bg-slate-100 disabled:opacity-50"
          :disabled="visibleCount === 0 || isMarkingAllRead"
          @click="handleReadAll"
        >
          모두 읽음
        </button>
        <button @click="emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>

    <div v-if="actionError" class="px-6 py-3 bg-rose-50 text-rose-700 text-sm font-medium border-b border-rose-100">
      {{ actionError }}
    </div>

    <div class="overflow-y-auto flex-1 p-4 bg-slate-50/50 custom-scrollbar space-y-3">
      <div v-if="loadingDropdown" class="text-center py-10 text-slate-400 text-sm">
        알림을 불러오는 중입니다.
      </div>

      <div v-else-if="dropdownNotifications.length === 0" class="text-center py-10 text-slate-400 text-sm">
        <p>새로운 알림이 없습니다.</p>
      </div>

      <div
        v-for="item in dropdownNotifications"
        :key="item.id"
        class="group relative bg-white p-4 rounded-xl border border-blue-300 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer"
        @click="handleNotificationClick(item)"
      >
        <button
          class="absolute top-3 right-3 text-slate-300 hover:text-slate-600"
          @click.stop="handleDelete(item.id)"
          aria-label="알림 삭제"
        >
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>

        <div class="flex gap-4">
          <div class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" :class="getNotificationIconClass(item)">
            <svg v-if="getNotificationVisualType(item) === 'announcement'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882A1 1 0 0112.447 5l6.382 3.191A1 1 0 0119.382 9H20a1 1 0 110 2h-.618a1 1 0 01-.553.809L16 13.191V16a2 2 0 11-4 0v-.809l-2.829-1.382A1 1 0 018.618 13H8a1 1 0 110-2h.618a1 1 0 01.553-.809L11 8.809V5.882z" />
            </svg>
            <svg v-else-if="getNotificationVisualType(item) === 'interview'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <svg v-else-if="getNotificationVisualType(item) === 'kanban'" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h7v12H4V6zm9 0h7v5h-7V6zm0 7h7v5h-7v-5z" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>

          <div class="flex-1">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full bg-blue-600"></span>
              <h3 class="font-bold text-sm text-slate-800 group-hover:text-blue-600 transition-colors">{{ item.title }}</h3>
            </div>

            <p class="text-[13px] text-slate-600 mt-1 leading-relaxed line-clamp-2">{{ item.content }}</p>

            <div class="flex justify-end items-center text-[11px] mt-3">
              <span class="text-slate-400">{{ formatNotificationTimeAgo(item.createdAt) }}</span>
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

  <AnnouncementDetailModal
    :show="showAnnouncementModal"
    :loading="isAnnouncementLoading"
    :error="announcementError"
    :announcement="announcementDetail"
    @close="closeAnnouncementModal"
  />
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
