<script setup>
const props = defineProps({
  rooms: { type: Array, required: true }
})

const emit = defineEmits(['editRoom', 'deleteRoom', 'createRoom'])

const formatCapacity = (capacity) => {
  const parsed = Number(String(capacity).replace(/[^0-9]/g, ''))
  if (!Number.isFinite(parsed) || parsed <= 0) return '-'
  return `${parsed}인실`
}

const formatFloor = (floor) => {
  const parsed = Number(String(floor).replace(/[^0-9-]/g, ''))
  if (!Number.isFinite(parsed)) return '-'
  return `${parsed}층`
}
</script>

<template>
  <div class="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
    <div class="border-b border-slate-200 px-5 py-5 md:px-7 md:py-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-700">
            전체 {{ rooms.length }}개
          </span>
          <span class="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-extrabold text-slate-600">
            현재 {{ rooms.length }}개 표시
          </span>
        </div>

        <button
          class="inline-flex items-center gap-2 rounded-xl border border-brand-500 bg-brand-600 px-4 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-brand-700"
          @click="emit('createRoom')"
        >
          회의실 추가
        </button>
      </div>
    </div>

    <div class="px-5 py-5 md:px-7 md:py-6">
      <div class="overflow-hidden rounded-[24px] border border-slate-200">
        <table class="min-w-full table-fixed">
          <thead class="border-b border-slate-200 bg-slate-50/80">
            <tr>
              <th class="px-6 py-4 text-left text-sm font-black text-slate-800">회의실</th>
              <th class="px-6 py-4 text-left text-sm font-black text-slate-800">수용 인원</th>
              <th class="px-6 py-4 text-left text-sm font-black text-slate-800">층수</th>
              <th class="px-6 py-4 text-left text-sm font-black text-slate-800">제공 시설</th>
              <th class="px-6 py-4 text-right text-sm font-black text-slate-800">작업</th>
            </tr>
          </thead>
          <tbody v-if="rooms.length" class="divide-y divide-slate-200">
            <tr
              v-for="room in rooms"
              :key="room.id"
              class="transition-colors hover:bg-slate-50/80"
            >
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <span
                    class="h-3 w-3 flex-shrink-0 rounded-full"
                    :style="{ backgroundColor: room.color }"
                  ></span>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-black text-slate-950">{{ room.name }}</p>
                    <p
                      v-if="room.description"
                      class="mt-0.5 line-clamp-1 text-sm font-medium text-slate-500"
                    >
                      {{ room.description }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm font-semibold text-slate-700">
                {{ formatCapacity(room.capacity) }}
              </td>
              <td class="px-6 py-4 text-sm font-semibold text-slate-700">
                {{ formatFloor(room.floor) }}
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1.5">
                  <span
                    v-for="facility in room.facilities.slice(0, 3)"
                    :key="facility"
                    class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-600"
                  >
                    {{ facility }}
                  </span>
                  <span
                    v-if="room.facilities.length > 3"
                    class="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500"
                  >
                    +{{ room.facilities.length - 3 }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex justify-end gap-2">
                  <button
                    class="inline-flex items-center rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-extrabold text-slate-700 transition-colors hover:border-slate-400 hover:bg-slate-50"
                    @click="emit('editRoom', room)"
                  >
                    수정
                  </button>
                  <button
                    class="inline-flex items-center rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-sm font-extrabold text-rose-600 transition-colors hover:bg-rose-50"
                    @click="emit('deleteRoom', room.id)"
                  >
                    삭제
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td colspan="5" class="px-6 py-16 text-center text-sm font-semibold text-slate-500">
                등록된 회의실이 없습니다.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
