<script setup>
import { ref } from 'vue'

/* 임시 더미 데이터 */
const interviews = ref([
  {
    id: 1,
    title: '기술 면접 - 박지원',
    date: '2026-02-17',
    time: '13:00 ~ 14:30',
    room: '회의실 A',
    interviewers: [
      { name: '김기술', status: 'ACCEPT' },
      { name: '박상수', status: 'PENDING' },
      { name: '이인사', status: 'REJECT' }
    ]
  },

  {
    id: 2,
    title: '임원 면접',
    date: '2026-02-18',
    time: '15:00 ~ 16:00',
    room: '회의실 B',
    interviewers: [
      { name: '최대표', status: 'ACCEPT' },
      { name: '정임원', status: 'ACCEPT' },
      { name: '김이사', status: 'PENDING' }
    ]
  }
])

const getStatusClass = (status) => {
  if (status === 'ACCEPT') return 'text-blue-600'
  if (status === 'REJECT') return 'text-red-500'
  return 'text-slate-400'
}

const getStatusText = (status) => {
  if (status === 'ACCEPT') return '수락'
  if (status === 'REJECT') return '거절'
  return '미응답'
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-10 text-slate-900">

    <div class="max-w-5xl mx-auto bg-white rounded-3xl shadow border p-8">

      <h1 class="text-2xl font-extrabold mb-8 text-slate-900">
        면접관 응답 현황
      </h1>

      <div class="space-y-6">

        <div
            v-for="item in interviews"
            :key="item.id"
            class="border rounded-2xl p-6 hover:shadow-md transition"
        >

          <!-- 상단 -->
          <div class="flex justify-between mb-4">

            <div>
              <h3 class="font-bold text-lg text-slate-900">
                {{ item.title }}
              </h3>

              <p class="text-sm text-slate-600 mt-1 font-medium">
                {{ item.date }} · {{ item.time }} · {{ item.room }}
              </p>
            </div>

          </div>

          <!-- 면접관 응답 -->
          <div class="flex flex-wrap gap-4">

            <div
                v-for="person in item.interviewers"
                :key="person.name"
                class="px-4 py-2 rounded-lg border text-sm font-bold flex items-center gap-2"
            >
              <span>{{ person.name }}</span>

              <span
                  :class="getStatusClass(person.status)"
              >
                {{ getStatusText(person.status) }}
              </span>
            </div>

          </div>

        </div>

      </div>

    </div>

  </div>
</template>
