<script setup>
import { ref } from 'vue'

const props = defineProps({
  rooms: { type: Array, required: true }
})

const emit = defineEmits(['editRoom', 'deleteRoom', 'createRoom'])

const deleteModalOpen = ref(false)
const deleteTarget = ref(null)

const openDeleteModal = (room) => {
  deleteTarget.value = room
  deleteModalOpen.value = true
}

const closeDeleteModal = () => {
  deleteModalOpen.value = false
  deleteTarget.value = null
}

const confirmDelete = () => {
  if (!deleteTarget.value) return
  emit('deleteRoom', deleteTarget.value.id)
  closeDeleteModal()
}
</script>

<template>
  <div class="bg-white rounded-2xl border shadow-sm p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-slate-900">회의실 관리</h2>
        <p class="text-slate-800 mt-1 leading-relaxed">회의실을 추가, 수정, 삭제할 수 있습니다</p>
      </div>
      <button class="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm" @click="emit('createRoom')">
        회의실 추가
      </button>
    </div>

      <div class="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table class="w-full">
          <thead class="bg-gray-50 border-b">
            <tr>
              <th class="px-6 py-4 text-left text-sm font-semibold text-slate-900">회의실</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-slate-900">수용 인원</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-slate-900">층수</th>
              <th class="px-6 py-4 text-left text-sm font-semibold text-slate-900">제공 시설</th>
              <th class="px-6 py-4 text-right text-sm font-semibold text-slate-900">작업</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="room in rooms" :key="room.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div class="w-4 h-4 rounded-full flex-shrink-0" :style="{ backgroundColor: room.color }"></div>
                  <div>
                    <div class="font-semibold text-slate-900">{{ room.name }}</div>
                    <div v-if="room.description" class="text-sm text-slate-800 mt-0.5 line-clamp-1">
                      {{ room.description }}
                    </div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-slate-800">{{ room.capacity }}인</td>
              <td class="px-6 py-4 text-slate-800">{{ room.floor }}층</td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  <span v-for="facility in room.facilities.slice(0, 3)" :key="facility" class="px-2 py-0.5 bg-slate-200 rounded text-xs text-slate-900">
                    {{ facility }}
                  </span>
                  <span v-if="room.facilities.length > 3" class="px-2 py-0.5 bg-slate-200 rounded text-xs text-slate-900">
                    +{{ room.facilities.length - 3 }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 text-right">
                <button class="px-3 py-1 border rounded text-sm text-slate-800" @click="emit('editRoom', room)">수정</button>
                <button class="ml-2 px-3 py-1 border rounded text-sm text-red-700" @click="openDeleteModal(room)">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="deleteModalOpen" class="fixed inset-0 bg-black/40 flex items-center justify-center p-6 z-50">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md">
          <div class="p-5 border-b">
            <h3 class="text-lg font-semibold text-slate-900">회의실 삭제</h3>
          </div>
          <div class="p-5 text-sm text-slate-700">
            <span class="text-slate-900 font-semibold">{{ deleteTarget?.name }}</span>을(를) 삭제하시겠습니까?
            삭제하면 복구할 수 없습니다.
          </div>
          <div class="p-5 border-t flex justify-end gap-2">
            <button class="px-3 py-2 border rounded-lg" @click="closeDeleteModal">취소</button>
            <button class="px-3 py-2 bg-rose-600 text-white rounded-lg" @click="confirmDelete">삭제</button>
          </div>
        </div>
      </div>
    </div>
</template>
