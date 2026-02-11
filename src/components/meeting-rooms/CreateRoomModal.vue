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
  if (!form.name || Number.isNaN(capacity) || Number.isNaN(floor)) {
    errorMessage.value = '필수 항목을 입력해 주세요.'
    return
  }
  emit('confirm', {
    name: form.name,
    capacity,
    floor,
    facilities: form.facilities,
    description: form.description,
    color: form.color
  })
  emit('close')
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 bg-black/30 flex items-center justify-center p-6 z-50">
    <div class="bg-white rounded-2xl shadow-2xl ring-1 ring-black/5 w-full max-w-xl max-h-[80vh] overflow-hidden flex flex-col">
      <div class="p-6 border-b">
        <h3 class="text-lg font-semibold text-slate-900">{{ mode === 'edit' ? '회의실 수정' : '새 회의실 등록' }}</h3>
      </div>
      <div class="p-6 space-y-4 overflow-y-auto pr-2">
        <p v-if="errorMessage" class="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
          {{ errorMessage }}
        </p>
        <div>
          <label class="text-sm font-medium text-slate-800">회의실 이름 *</label>
          <input v-model="form.name" class="w-full border rounded-lg px-3 py-2 text-slate-800 placeholder:text-slate-500" placeholder="회의실 이름" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-slate-800">수용 인원 *</label>
            <input v-model="form.capacity" type="number" class="w-full border rounded-lg px-3 py-2 text-slate-800" />
          </div>
          <div>
            <label class="text-sm font-medium text-slate-800">층수 *</label>
            <input v-model="form.floor" type="number" class="w-full border rounded-lg px-3 py-2 text-slate-800" />
          </div>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-800">설명</label>
          <textarea v-model="form.description" class="w-full border rounded-lg px-3 py-2 text-slate-800 placeholder:text-slate-500" rows="3"></textarea>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-800">제공 시설 *</label>
          <div class="grid grid-cols-2 gap-3 p-4 border rounded-lg">
            <label v-for="facility in facilityOptions" :key="facility" class="flex items-center gap-2 text-sm text-slate-800">
              <input type="checkbox" :value="facility" :checked="form.facilities.includes(facility)" @change="toggleFacility(facility)" />
              {{ facility }}
            </label>
          </div>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-800">색상 *</label>
          <div class="flex gap-2 flex-wrap">
            <button
              v-for="color in colorOptions"
              :key="color"
              type="button"
              class="w-9 h-9 rounded-lg border"
              :class="form.color === color ? 'ring-2 ring-offset-2 ring-gray-900' : ''"
              :style="{ backgroundColor: color }"
              @click="form.color = color"
            ></button>
          </div>
        </div>
      </div>
      <div class="p-6 border-t flex justify-end gap-2 flex-shrink-0 bg-white">
        <button type="button" class="px-4 py-2 border rounded-lg" @click="emit('close')">취소</button>
        <button type="button" class="px-4 py-2 bg-emerald-600 text-white rounded-lg" @click="handleSubmit">
          {{ mode === 'edit' ? '수정 저장' : '회의실 등록' }}
        </button>
      </div>
    </div>
  </div>
</template>
