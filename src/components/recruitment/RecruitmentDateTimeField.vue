<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  defaultTime: {
    type: String,
    default: '09:00'
  },
  minDate: {
    type: String,
    default: ''
  },
  datePresets: {
    type: Array,
    default: () => ([
      { label: '오늘', offsetDays: 0 },
      { label: '내일', offsetDays: 1 },
      { label: '+7일', offsetDays: 7 }
    ])
  },
  timePresets: {
    type: Array,
    default: () => ['09:00', '10:00', '14:00', '18:00']
  }
})

const emit = defineEmits(['update:modelValue'])

const pad = (value) => String(value).padStart(2, '0')

const formatDateInput = (date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

const splitDateTime = (value) => {
  const normalized = String(value || '').trim().replace(' ', 'T')
  if (!normalized) return { date: '', time: '' }

  const [date = '', time = ''] = normalized.split('T')
  return {
    date,
    time: time.slice(0, 5)
  }
}

const datePart = computed(() => splitDateTime(props.modelValue).date)
const timePart = computed(() => splitDateTime(props.modelValue).time || props.defaultTime)

const clampDate = (date) => {
  if (!props.minDate) return date
  return date < props.minDate ? props.minDate : date
}

const emitDateTime = (date, time = props.defaultTime) => {
  if (!date) {
    emit('update:modelValue', '')
    return
  }

  emit('update:modelValue', `${clampDate(date)}T${time || props.defaultTime}`)
}

const getTodayDate = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return formatDateInput(today)
}

const handleDateInput = (event) => {
  emitDateTime(event.target.value, timePart.value)
}

const handleTimeInput = (event) => {
  emitDateTime(datePart.value || clampDate(getTodayDate()), event.target.value)
}

const applyDatePreset = (offsetDays) => {
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  base.setDate(base.getDate() + offsetDays)
  emitDateTime(formatDateInput(base), timePart.value)
}

const applyTimePreset = (time) => {
  emitDateTime(datePart.value || clampDate(getTodayDate()), time)
}

const clearValue = () => {
  emit('update:modelValue', '')
}

const previewText = computed(() => {
  if (!props.modelValue) return '날짜와 시간을 선택하면 여기에서 한 번 더 확인할 수 있습니다.'

  const date = new Date(props.modelValue)
  if (Number.isNaN(date.getTime())) return props.modelValue

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date)
})
</script>

<template>
  <div class="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-brand-50/40 p-5 shadow-sm">
    <div class="flex items-start justify-between gap-4 mb-4">
      <div>
        <label class="block text-sm font-bold text-slate-800 mb-1">
          {{ label }}
          <span v-if="required" class="text-rose-500">*</span>
        </label>
        <p v-if="description" class="text-xs text-slate-500 leading-relaxed">
          {{ description }}
        </p>
      </div>
      <button
        v-if="modelValue"
        type="button"
        class="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
        @click="clearValue"
      >
        초기화
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-[1.35fr_0.85fr] gap-3">
      <label class="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span class="block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Date</span>
        <input
          :value="datePart"
          type="date"
          :min="minDate || undefined"
          class="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
          @input="handleDateInput"
        >
      </label>

      <label class="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span class="block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Time</span>
        <input
          :value="timePart"
          type="time"
          step="900"
          class="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
          @input="handleTimeInput"
        >
      </label>
    </div>

    <div class="mt-4 space-y-3">
      <div class="flex flex-wrap gap-2">
        <button
          v-for="preset in datePresets"
          :key="preset.label"
          type="button"
          class="rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-50"
          @click="applyDatePreset(preset.offsetDays)"
        >
          {{ preset.label }}
        </button>
      </div>

      <div class="flex flex-wrap gap-2">
        <button
          v-for="preset in timePresets"
          :key="preset"
          type="button"
          class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
          @click="applyTimePreset(preset)"
        >
          {{ preset }}
        </button>
      </div>
    </div>

    <div class="mt-4 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-slate-100 shadow-sm">
      {{ previewText }}
    </div>
  </div>
</template>
