<script setup>
import { ref, computed, watch } from 'vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

/* Props */
const props = defineProps({
  show: Boolean,
  mode: String, // create | detail
  selectedId: Number,
  announcements: Array,
  canManage: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'create', 'update', 'remove', 'forbidden'])

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
  if (!props.canManage) {
    emit('forbidden')
    return
  }
  if (!form.value.title || !form.value.content) return

  if (props.mode === 'create') {
    emit('create', {
      title: form.value.title,
      content: form.value.content,
      pinned: form.value.pinned
    })
    return
  }

  if (props.mode === 'detail') {
    emit('update', {
      id: props.selectedId,
      title: form.value.title,
      content: form.value.content,
      pinned: form.value.pinned
    })
    isEditMode.value = false
  }

}

const remove = () => {
  if (!props.canManage) {
    emit('forbidden')
    return
  }
  emit('remove', props.selectedId)
  showDeleteConfirm.value = false
}
const enableEdit = () => {
  if (!props.canManage) {
    emit('forbidden')
    return
  }
  isEditMode.value = true
}
</script>

<template>
  <Teleport to="body">
    <div
        v-if="show"
        class="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center"
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
                  @click="enableEdit"
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
    </div>

    <ConfirmModal
        :show="showDeleteConfirm"
        type="danger"
        title="공지사항 삭제"
        message="정말 삭제하시겠습니까? 삭제된 공지사항은 복구할 수 없습니다."
        confirmText="삭제하기"
        cancelText="취소"
        :showCancel="true"
        @confirm="remove"
        @cancel="showDeleteConfirm = false"
    />
  </Teleport>
</template>
