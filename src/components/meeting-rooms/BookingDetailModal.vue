<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  booking: { type: Object, default: null },
  room: { type: Object, default: null }
})

const emit = defineEmits(['close', 'delete'])

const showDeleteConfirm = ref(false)

watch(
    () => props.open,
    (v) => {
      if (!v) showDeleteConfirm.value = false
    }
)

const labels = {
  confirmed: '\uD655\uC815',
  pending: '\uB300\uAE30',
  cancelled: '\uCDE8\uC18C',
  datetime: '\uC77C\uC2DC',
  room: '\uD68C\uC758\uC2E4',
  organizer: '\uC8FC\uCD5C\uC790',
  attendees: '\uCC38\uC11D\uC790',
  description: '\uC124\uBA85',
  delete: '\uC0AD\uC81C',
  close: '\uB2EB\uAE30',
  cancel: '\uCDE8\uC18C',
  deleteConfirm:
    '\uC608\uC57D\uC744 \uC0AD\uC81C\uD558\uC2DC\uACA0\uC2B5\uB2C8\uAE4C? \uC0AD\uC81C \uD6C4\uC5D0\uB294 \uBCF5\uAD6C\uD560 \uC218 \uC5C6\uC2B5\uB2C8\uB2E4.',
  dot: '\u00B7',
  year: '\uB144',
  month: '\uC6D4',
  day: '\uC77C',
  people: '\uC778',
  floor: '\uCE35'
}

const formatTime = (date) => {
  if (!date) return ''
  const h = `${date.getHours()}`.padStart(2, '0')
  const m = `${date.getMinutes()}`.padStart(2, '0')
  return `${h}:${m}`
}

const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}${labels.year} ${d.getMonth() + 1}${labels.month} ${d.getDate()}${labels.day}`
}

const handleDelete = () => {
  if (!props.booking) return
  showDeleteConfirm.value = true
}

const confirmDelete = () => {
  if (!props.booking) return
  emit('delete', props.booking.id)
  showDeleteConfirm.value = false
}

const cancelDelete = () => {
  showDeleteConfirm.value = false
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="emit('close')"></div>

    <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 border border-slate-100">
      <div class="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-start">
        <div>
          <span
            class="inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest mb-2"
            :class="booking?.status === 'confirmed'
              ? 'bg-emerald-100 text-emerald-600'
              : booking?.status === 'pending'
              ? 'bg-amber-100 text-amber-600'
              : 'bg-rose-100 text-rose-600'"
          >
            {{
              booking?.status === 'confirmed'
                ? labels.confirmed
                : booking?.status === 'pending'
                ? labels.pending
                : labels.cancelled
            }}
          </span>
          <h3 class="text-xl font-bold text-slate-800 leading-tight">{{ booking?.title }}</h3>
        </div>
        <button @click="emit('close')" class="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-200/50">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="p-6 space-y-6">
        <div class="flex items-start gap-4">
          <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-700">{{ labels.datetime }}</p>
            <p class="text-sm text-slate-600 mt-0.5">{{ formatDate(booking?.startTime) }} {{ labels.dot }} {{ formatTime(booking?.startTime) }} - {{ formatTime(booking?.endTime) }}</p>
          </div>
        </div>

        <div class="flex items-start gap-4">
          <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-700">{{ labels.room }}</p>
            <p class="text-sm text-slate-600 mt-0.5">
              <span class="inline-flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: room?.color || '#94a3b8' }"></span>
                {{ room?.name }} {{ labels.dot }} {{ room?.capacity }}{{ labels.people }} {{ labels.dot }} {{ room?.floor }}{{ labels.floor }}
              </span>
            </p>
          </div>
        </div>

        <div class="flex items-start gap-4">
          <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-700">{{ labels.organizer }}</p>
            <p class="text-sm text-slate-600 mt-0.5">{{ booking?.organizer || '-' }}</p>
          </div>
        </div>

        <div class="flex items-start gap-4" v-if="booking?.attendees?.length">
          <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-700">{{ labels.attendees }}</p>
            <div class="flex flex-wrap gap-2 mt-1.5">
              <span v-for="(att, idx) in booking.attendees" :key="idx" class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                {{ att }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="booking?.description" class="flex items-start gap-4">
          <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-slate-500">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h10M7 16h6" />
            </svg>
          </div>
          <div>
            <p class="text-sm font-bold text-slate-700">{{ labels.description }}</p>
            <p class="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap">{{ booking.description }}</p>
          </div>
        </div>
      </div>

      <!-- 하단 버튼 영역 -->
      <div class="px-6 py-4 bg-slate-50 border-t border-slate-100">

        <!-- 기본 상태 -->
        <div v-if="!showDeleteConfirm" class="flex justify-end gap-3">

          <button
              @click="handleDelete"
              class="px-4 py-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            {{ labels.delete }}
          </button>

          <button
              @click="emit('close')"
              class="px-5 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-all"
          >
            {{ labels.close }}
          </button>

        </div>


        <!-- 삭제 확인 상태 -->
        <div v-else class="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-sm">
      <div class="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
        <button
          @click="handleDelete"
          class="px-4 py-2 text-sm font-bold text-rose-600 border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors"
        >
          {{ labels.delete }}
        </button>
        <button
          @click="emit('close')"
          class="px-5 py-2 text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-all"
        >
          {{ labels.close }}
        </button>
      </div>

          {{ labels.deleteConfirm }}

          <div class="mt-3 flex justify-end gap-2">

            <button
                class="px-3 py-1.5 border border-rose-200 rounded-lg text-rose-700 bg-white"
                @click="cancelDelete"
            >
              {{ labels.cancel }}
            </button>

            <button
                class="px-3 py-1.5 rounded-lg text-white bg-rose-600 hover:bg-rose-700"
                @click="confirmDelete"
            >
              {{ labels.delete }}
            </button>

          </div>
        </div>

      </div>

    </div>
  </div>
</template>
