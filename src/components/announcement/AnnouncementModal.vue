<script setup>
import { ref, computed, watch } from 'vue'

/* Props */
const props = defineProps({
  show: Boolean,
  mode: String, // create | detail
  selectedId: Number,
  announcements: Array
})

const emit = defineEmits(['close'])

const isEditMode = ref(false)
const showDeleteConfirm = ref(false)

const form = ref({
  title: '',
  content: '',
  pinned: false
})

const selected = computed(() => {
  return props.announcements.find(a => a.id === props.selectedId)
})

watch(
    () => props.mode,
    () => {
      if (props.mode === 'create') {
        resetForm()
        isEditMode.value = true
      }

      if (props.mode === 'detail' && selected.value) {
        form.value = { ...selected.value }
        isEditMode.value = false
      }
    },
    { immediate: true }
)

const resetForm = () => {
  form.value = {
    title: '',
    content: '',
    pinned: false
  }
}

const save = () => {
  if (!form.value.title || !form.value.content) return

  if (props.mode === 'create') {
    props.announcements.unshift({
      id: Date.now(),
      ...form.value,
      author: '김인사',
      date: new Date().toISOString().slice(0, 10)
    })
  }

  if (props.mode === 'detail') {
    const idx = props.announcements.findIndex(
        a => a.id === props.selectedId
    )

    if (idx !== -1) {
      props.announcements[idx] = {
        ...props.announcements[idx],
        ...form.value
      }
    }

    isEditMode.value = false
  }

  emit('close')
}

const remove = () => {
  const idx = props.announcements.findIndex(
      a => a.id === props.selectedId
  )

  if (idx !== -1) {
    props.announcements.splice(idx, 1)
  }

  showDeleteConfirm.value = false
  emit('close')
}
</script>

<template>
  <div
      v-if="show"
      class="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center"
  >
    <div
        class="bg-white w-[720px] max-h-[90vh] rounded-2xl p-8 relative shadow-xl text-slate-900"
    >
      <button
          class="absolute top-5 right-5 text-2xl text-slate-400 hover:text-slate-600"
          @click="emit('close')"
      >
        ✕
      </button>

      <h2 class="text-xl font-bold mb-6 text-slate-900">공지사항</h2>

      <div v-if="mode === 'create'" class="space-y-5">

        <input
            v-model="form.title"
            placeholder="제목"
            class="w-full border rounded-lg p-4 resize-none bg-slate-50 text-slate-900 placeholder:text-slate-400"
        />

        <label class="flex items-center gap-2 text-sm font-semibold text-slate-900">
          <input type="checkbox" v-model="form.pinned" />
          상단 고정
        </label>

        <textarea
            v-model="form.content"
            rows="12"
            placeholder="내용을 입력하세요"
            class="w-full border rounded-lg p-4 resize-none bg-slate-50 text-slate-800 placeholder-slate-400"
        />

        <div class="flex justify-end gap-3">

          <button
              @click="emit('close')"
              class="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            취소
          </button>

          <button
              @click="save"
              class="px-4 py-2 rounded-lg bg-emerald-500 text-white font-semibold hover:bg-emerald-600"
          >
            등록
          </button>

        </div>
      </div>


      <div v-else-if="mode === 'detail' && selected" class="space-y-5">

        <input
            v-if="isEditMode"
            v-model="form.title"
            class="w-full border rounded-lg p-3 font-bold"
        />

        <h3 v-else class="text-2xl font-bold text-slate-800">
          {{ selected.title }}
        </h3>

        <p class="text-sm text-slate-500">
          작성자: {{ selected.author }} |
          {{ selected.date }}

          <span
              v-if="selected.pinned"
              class="text-red-500 ml-2 font-bold"
          >
            고정
          </span>
        </p>

        <textarea
            v-if="isEditMode"
            v-model="form.content"
            rows="12"
            class="w-full border rounded-lg p-4 resize-none bg-slate-50"
        />

        <div
            v-else
            class="border rounded-lg p-5 min-h-[280px] bg-slate-50 leading-7 text-slate-700"
        >
          {{ selected.content }}
        </div>

        <div class="flex justify-between items-center pt-4 border-t">

          <button
              @click="showDeleteConfirm = true"
              class="text-red-500 font-bold"
          >
            삭제
          </button>

          <div class="flex gap-3">

            <button
                v-if="!isEditMode"
                @click="isEditMode = true"
                class="px-4 py-2 rounded-lg bg-slate-100"
            >
              수정
            </button>

            <button
                v-if="isEditMode"
                @click="save"
                class="px-4 py-2 rounded-lg bg-emerald-500 text-white"
            >
              저장
            </button>

            <button
                v-if="!isEditMode"
                @click="emit('close')"
                class="px-4 py-2 rounded-lg bg-emerald-500 text-white"
            >
              확인
            </button>

          </div>
        </div>

      </div>
    </div>

    <div
        v-if="showDeleteConfirm"
        class="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center"
    >
      <div
          class="bg-white w-[360px] rounded-xl p-6 text-center space-y-4 text-slate-900"
      >
        <h3 class="text-lg font-bold">삭제 확인</h3>

        <p class="text-sm text-slate-600">
          정말 삭제하시겠습니까?
        </p>

        <div class="flex justify-center gap-3 pt-3">

          <button
              @click="showDeleteConfirm = false"
              class="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
          >
            취소
          </button>

          <button
              @click="remove"
              class="px-4 py-2 rounded-lg bg-red-500 text-white"
          >
            삭제
          </button>

        </div>
      </div>
    </div>

  </div>
</template>
