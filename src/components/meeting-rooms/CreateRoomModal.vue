<script setup>
import { onBeforeUnmount, reactive, ref, watch } from 'vue'

const props = defineProps({
  open: { type: Boolean, required: true },
  room: { type: Object, default: null },
  mode: { type: String, default: 'create' }
})

const emit = defineEmits(['close', 'confirm'])
const errorMessage = ref('')

const facilityOptions = [
  '프로젝터',
  '화이트보드',
  '화상회의',
  '모니터',
  'WiFi',
  '스피커',
  '마이크'
]

const colorOptions = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444', '#84cc16']

const form = reactive({
  name: '',
  capacity: '',
  floor: '',
  description: '',
  facilities: ['WiFi'],
  color: colorOptions[0]
})

watch(
  () => props.open,
  (open) => {
    document.body.style.overflow = open ? 'hidden' : ''
    if (!open) return
    if (props.room) {
      form.name = props.room.name
      form.capacity = `${props.room.capacity}`
      form.floor = `${props.room.floor}`
      form.description = props.room.description || ''
      form.facilities = [...props.room.facilities]
      form.color = props.room.color
    } else {
      form.name = ''
      form.capacity = ''
      form.floor = ''
      form.description = ''
      form.facilities = ['WiFi']
      form.color = colorOptions[0]
    }
  }
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
})

const toggleFacility = (facility) => {
  if (form.facilities.includes(facility)) {
    form.facilities = form.facilities.filter((f) => f !== facility)
  } else {
    form.facilities = [...form.facilities, facility]
  }
}

const handleSubmit = () => {
  errorMessage.value = ''
  const capacity = parseInt(form.capacity, 10)
  const floor = parseInt(form.floor, 10)
  const trimmedName = form.name.trim()

  if (!trimmedName || Number.isNaN(capacity) || Number.isNaN(floor)) {
    errorMessage.value = '필수 항목을 입력해 주세요.'
    return
  }
  if (trimmedName.length < 2 || trimmedName.length > 20) {
    errorMessage.value = '회의실 이름은 2자 이상 20자 이하여야 합니다.'
    return
  }
  if (capacity < 2) {
    errorMessage.value = '수용 인원은 2명 이상이어야 합니다.'
    return
  }
  if (floor < 1 || floor > 100) {
    errorMessage.value = '층수는 1층 이상 100층 이하여야 합니다.'
    return
  }

  emit('confirm', {
    name: trimmedName,
    capacity,
    floor,
    facilities: form.facilities,
    description: form.description,
    color: form.color
  })
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/34 p-4 backdrop-blur-[2px] sm:p-6"
  >
    <div class="flex max-h-[84vh] w-full max-w-[780px] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
      <div class="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:px-7">
        <div class="space-y-2">
          <h3 class="text-[1.45rem] font-black tracking-[-0.03em] text-slate-950">
            {{ mode === 'edit' ? '회의실 수정' : '회의실 등록' }}
          </h3>
        </div>
        <button
          type="button"
          class="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
          @click="emit('close')"
          aria-label="닫기"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div class="space-y-5 overflow-y-auto px-6 py-5 text-slate-900 sm:px-7">
        <p v-if="errorMessage" class="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600">
          {{ errorMessage }}
        </p>

        <div class="space-y-2">
          <label class="text-sm font-black text-slate-900">회의실 이름 *</label>
          <input
            v-model="form.name"
            minlength="2"
            maxlength="20"
            class="room-field"
            placeholder="회의실 이름"
          />
        </div>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <label class="text-sm font-black text-slate-900">수용 인원 *</label>
            <input v-model="form.capacity" type="number" min="2" step="1" class="room-field" />
          </div>
          <div class="space-y-2">
            <label class="text-sm font-black text-slate-900">층수 *</label>
            <input v-model="form.floor" type="number" min="1" max="100" step="1" class="room-field" />
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-black text-slate-900">설명</label>
          <textarea
            v-model="form.description"
            class="room-field min-h-[120px] resize-none py-3"
            rows="4"
            placeholder="필요한 메모가 있으면 입력하세요"
          ></textarea>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-black text-slate-900">제공 시설 *</label>
          <div class="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
            <label
              v-for="facility in facilityOptions"
              :key="facility"
              class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-brand-200"
            >
              <input
                type="checkbox"
                :value="facility"
                :checked="form.facilities.includes(facility)"
                @change="toggleFacility(facility)"
              />
              {{ facility }}
            </label>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-black text-slate-900">색상 *</label>
          <div class="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <button
              v-for="color in colorOptions"
              :key="color"
              type="button"
              class="h-10 w-10 rounded-xl border border-white/70 transition"
              :class="form.color === color ? 'ring-2 ring-offset-2 ring-slate-900' : 'hover:scale-105'"
              :style="{ backgroundColor: color }"
              @click="form.color = color"
            ></button>
          </div>
        </div>
      </div>
      <div class="flex justify-end gap-2 border-t border-slate-200 bg-white px-6 py-4 sm:px-7">
        <button type="button" class="inline-flex items-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-extrabold text-slate-700 transition-colors hover:bg-slate-50" @click="emit('close')">취소</button>
        <button type="button" class="inline-flex items-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm shadow-brand-200 transition-colors hover:bg-brand-700" @click="handleSubmit">
          {{ mode === 'edit' ? '수정 저장' : '회의실 등록' }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.room-field {
  width: 100%;
  border-radius: 0.95rem;
  border: 1px solid rgb(226, 232, 240);
  background: rgb(248, 250, 252);
  padding: 0.72rem 0.9rem;
  color: rgb(15, 23, 42);
  transition: border-color 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
}

.room-field::placeholder {
  color: rgb(148, 163, 184);
}

.room-field:focus {
  outline: none;
  border-color: rgb(20, 184, 166);
  box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.12);
  background: rgb(255, 255, 255);
}
</style>
