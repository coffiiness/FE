<script setup>
import { computed } from 'vue'
import {
  buildNotificationFallbackRoute,
  formatNotificationTimeAgo,
  getNotificationVisualType
} from '@/stores/notification'

const props = defineProps({
  item: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['open', 'close'])

const visualType = computed(() => getNotificationVisualType(props.item))
const routeTarget = computed(() => props.item?.actionUrl || buildNotificationFallbackRoute(props.item))

const iconClass = computed(() => {
  if (visualType.value === 'announcement') {
    return 'bg-amber-50 text-amber-600 border border-amber-100'
  }
  if (visualType.value === 'interview') {
    return 'bg-emerald-50 text-emerald-600 border border-emerald-100'
  }
  if (visualType.value === 'kanban') {
    return 'bg-indigo-50 text-indigo-600 border border-indigo-100'
  }
  return 'bg-slate-100 text-slate-500 border border-slate-200'
})
</script>

<template>
  <div class="pointer-events-auto w-[360px] rounded-2xl border border-slate-200 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.16)] overflow-hidden">
    <div class="flex items-start gap-4 p-4">
      <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" :class="iconClass">
        <svg v-if="visualType === 'announcement'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882A1 1 0 0112.447 5l6.382 3.191A1 1 0 0119.382 9H20a1 1 0 110 2h-.618a1 1 0 01-.553.809L16 13.191V16a2 2 0 11-4 0v-.809l-2.829-1.382A1 1 0 018.618 13H8a1 1 0 110-2h.618a1 1 0 01.553-.809L11 8.809V5.882z" />
        </svg>
        <svg v-else-if="visualType === 'interview'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <svg v-else-if="visualType === 'kanban'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h7v12H4V6zm9 0h7v5h-7V6zm0 7h7v5h-7v-5z" />
        </svg>
        <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between gap-3">
          <p class="text-xs font-bold tracking-[0.18em] text-brand-500 uppercase">New Notification</p>
          <button
            type="button"
            class="rounded-lg p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors"
            @click="emit('close')"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p class="mt-1 text-sm font-bold text-slate-800 line-clamp-1">{{ item.title }}</p>
        <p class="mt-1 text-[13px] leading-5 text-slate-600 line-clamp-2">{{ item.content }}</p>

        <div class="mt-4 flex items-center justify-between gap-3">
          <span class="text-[11px] font-medium text-slate-400">{{ formatNotificationTimeAgo(item.createdAt) }}</span>
          <button
            type="button"
            class="rounded-lg bg-brand-50 px-3 py-2 text-xs font-bold text-brand-600 border border-brand-100 hover:bg-brand-100 transition-colors"
            @click="emit('open', routeTarget)"
          >
            알림 보기
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
