<script setup>
const props = defineProps({
  rooms: { type: Array, required: true }
})

const emit = defineEmits(['editRoom', 'deleteRoom', 'createRoom'])
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
                <button class="ml-2 px-3 py-1 border rounded text-sm text-red-700" @click="emit('deleteRoom', room.id)">삭제</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
  </div>
</template>
