<script setup>
import { computed } from 'vue'
import { formatNotificationDateTime } from '@/stores/notification'

const props = defineProps({
  show: Boolean,
  loading: Boolean,
  error: {
    type: String,
    default: ''
  },
  announcement: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close'])

const createdAtLabel = computed(() =>
  formatNotificationDateTime(props.announcement?.createdAt)
)
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" @click="emit('close')"></div>

      <div class="relative w-full max-w-[720px] rounded-[28px] border border-slate-200 bg-white shadow-2xl overflow-hidden">
        <div class="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-slate-50">
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882A1 1 0 0112.447 5l6.382 3.191A1 1 0 0119.382 9H20a1 1 0 110 2h-.618a1 1 0 01-.553.809L16 13.191V16a2 2 0 11-4 0v-.809l-2.829-1.382A1 1 0 018.618 13H8a1 1 0 110-2h.618a1 1 0 01.553-.809L11 8.809V5.882z" />
              </svg>
            </div>
            <div>
              <p class="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Announcement</p>
              <h2 class="text-lg font-bold text-slate-900">공지사항</h2>
            </div>
          </div>

          <button class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600" @click="emit('close')">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="max-h-[70vh] overflow-y-auto px-6 py-6">
          <div v-if="announcement" class="space-y-5">
            <div class="flex flex-wrap items-center gap-2">
              <span v-if="announcement.pinned" class="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-600 border border-rose-100">
                상단 고정
              </span>
              <span class="text-sm text-slate-400">{{ createdAtLabel }}</span>
            </div>

            <div>
              <h3 class="text-2xl font-bold text-slate-900 leading-snug">{{ announcement.title }}</h3>
            </div>

            <div class="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 min-h-[240px]">
              {{ announcement.content }}
            </div>
          </div>

          <div v-else-if="loading" class="space-y-4">
            <div class="h-4 w-28 animate-pulse rounded bg-slate-200"></div>
            <div class="h-8 w-3/4 animate-pulse rounded bg-slate-200"></div>
            <div class="min-h-[240px] rounded-2xl border border-slate-200 bg-slate-50 px-5 py-5">
              <div class="space-y-3">
                <div class="h-4 w-full animate-pulse rounded bg-slate-200"></div>
                <div class="h-4 w-5/6 animate-pulse rounded bg-slate-200"></div>
                <div class="h-4 w-4/6 animate-pulse rounded bg-slate-200"></div>
              </div>
            </div>
            <div class="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            최신 공지 내용을 불러오는 중입니다.
            </div>
          </div>

          <div v-else-if="error" class="mt-5 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {{ error }}
          </div>
        </div>

        <div class="border-t border-slate-100 bg-white px-6 py-4 flex justify-end">
          <button class="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800" @click="emit('close')">
            닫기
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
