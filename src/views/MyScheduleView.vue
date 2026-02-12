<script setup>
import { ref, computed } from 'vue'
import ScheduleListModal from '@/components/schedule/ScheduleListModal.vue'
import ScheduleCreateModal from '@/components/schedule/ScheduleCreateModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const currentMonth = "February 2024"
const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const isListModalOpen = ref(false)
const isFormModalOpen = ref(false)
const isDeleteModalOpen = ref(false)

const selectedDate = ref('')
const selectedEventToEdit = ref(null)
const targetDeleteId = ref(null)

const upcomingEvents = ref([
  { id: 101, title: '기술 면접: 박지원', time: '오후 1:00 - 2:30', date: 'Feb 07', type: 'interview' },
  { id: 102, title: '최종 면접: 김인사', time: '오후 3:00 - 4:00', date: 'Feb 07', type: 'interview' },
  { id: 103, title: '팀 미팅: 채용 전략', time: '오후 5:00 - 6:00', date: 'Feb 07', type: 'meeting' }
])

const calendarDays = ref(Array.from({ length: 35 }, (_, i) => {
  const day = i - 3
  const isCurrentMonth = day > 0 && day <= 29
  const dateStr = `2024-02-${day < 10 ? '0' + day : day}`

  let initialEvents = []
  if (day === 7) {
    initialEvents = [
      { id: 1, date: dateStr, time: '13:00', title: '기술 면접: 박지원', type: 'interview' },
      { id: 2, date: dateStr, time: '15:00', title: '임원 면접 대기', type: 'interview' },
      { id: 3, date: dateStr, time: '16:00', title: '주간 회의', type: 'meeting' }
    ]
  }

  return {
    date: dateStr,
    dayDisplay: isCurrentMonth ? day : '',
    isCurrentMonth,
    events: initialEvents
  }
}))

const currentListEvents = computed(() => {
  const day = calendarDays.value.find(d => d.date === selectedDate.value)
  return day ? day.events : []
})

const getToday = () => new Date().toISOString().split('T')[0]

const handleDateClick = (date) => {
  selectedDate.value = date
  isListModalOpen.value = true
}

const openCreateForm = (date = null) => {
  selectedDate.value = date || getToday()
  selectedEventToEdit.value = null
  isFormModalOpen.value = true
}

const openEditForm = (event) => {
  selectedEventToEdit.value = event
  isFormModalOpen.value = true
}

const handleSave = (formData) => {
  const targetDay = calendarDays.value.find(d => d.date === formData.date)
  if (!targetDay) return

  if (formData.id) {
    const idx = targetDay.events.findIndex(e => e.id === formData.id)
    if (idx !== -1) {
      targetDay.events[idx] = { ...targetDay.events[idx], ...formData }
    } else {
      targetDay.events.push(formData)
    }
  } else {
    targetDay.events.push({ ...formData, id: Date.now() })
  }
  isFormModalOpen.value = false
}

const openDeleteConfirm = (id) => {
  targetDeleteId.value = id
  isDeleteModalOpen.value = true
}

const confirmDelete = () => {
  if (targetDeleteId.value) {
    const targetDay = calendarDays.value.find(d => d.date === selectedDate.value)
    if (targetDay) {
      targetDay.events = targetDay.events.filter(e => e.id !== targetDeleteId.value)
    }
  }
  isDeleteModalOpen.value = false
  isFormModalOpen.value = false
  targetDeleteId.value = null
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 p-8 font-sans text-slate-600">

    <header class="flex justify-between items-center mb-10">
      <div>
        <h1 class="text-4xl font-display font-bold text-slate-900 tracking-tight">내 일정</h1>
        <p class="text-slate-500 mt-1">오늘의 인터뷰와 회의 일정을 확인하세요.</p>
      </div>
      <div class="flex gap-3">
        <button class="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition-all shadow-sm font-medium">
          오늘로 이동
        </button>
        <button
            @click="openCreateForm(getToday())"
            class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-all flex items-center"
        >
          <svg class="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          일정 생성
        </button>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">

      <div class="lg:col-span-3 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
          <h2 class="text-xl font-display font-bold text-slate-800">{{ currentMonth }}</h2>
          <div class="flex gap-4">
            <button class="p-2 text-slate-400 hover:text-indigo-600 transition-colors">&lt;</button>
            <button class="p-2 text-slate-400 hover:text-indigo-600 transition-colors">&gt;</button>
          </div>
        </div>

        <div class="grid grid-cols-7 text-center border-b border-slate-50 bg-slate-50/50">
          <div v-for="day in days" :key="day" class="py-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            {{ day }}
          </div>
        </div>

        <div class="grid grid-cols-7 grid-rows-5 flex-1 bg-white min-h-[600px]">
          <div
              v-for="(cell, index) in calendarDays"
              :key="index"
              class="border-r border-b border-slate-100 p-3 transition-all hover:bg-slate-50/50 relative group cursor-pointer"
              :class="{'bg-slate-50/30': !cell.isCurrentMonth}"
              @click="cell.isCurrentMonth && handleDateClick(cell.date)"
          >
            <span :class="['text-sm font-semibold', cell.dayDisplay === 7 ? 'text-indigo-600' : 'text-slate-400', !cell.isCurrentMonth && 'opacity-0']">
              {{ cell.dayDisplay }}
            </span>

            <div v-if="cell.events.length" class="mt-2 space-y-1">
              <div v-if="cell.events[0]" class="truncate text-[10px] px-1.5 py-1 rounded-md font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                {{ cell.events[0].time }} {{ cell.events[0].title }}
              </div>
              <div v-if="cell.events[1]" class="truncate text-[10px] px-1.5 py-1 rounded-md font-medium bg-amber-50 text-amber-700 border border-amber-100">
                {{ cell.events[1].time }} {{ cell.events[1].title }}
              </div>
              <div v-if="cell.events.length > 2" class="text-[10px] font-bold text-slate-400 pl-1">
                + {{ cell.events.length - 2 }} more
              </div>
            </div>

            <div v-if="cell.isCurrentMonth" class="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg class="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">

        <div class="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
          <h3 class="text-lg font-display font-bold text-slate-800 mb-4">다가오는 면접</h3>
          <div class="space-y-4">
            <div v-for="event in upcomingEvents" :key="event.id"
                 class="group p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-indigo-300 hover:bg-white transition-all cursor-pointer shadow-sm hover:shadow-md">
              <div class="flex justify-between items-start mb-2">
                <span class="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-bold uppercase">
                  {{ event.type }}
                </span>
                <span class="text-[10px] text-slate-400 font-medium">{{ event.date }}</span>
              </div>
              <h4 class="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{{ event.title }}</h4>
              <p class="text-xs text-slate-500 mt-1">{{ event.time }}</p>
            </div>
          </div>
        </div>

        <div class="bg-indigo-600 border border-indigo-700 p-6 rounded-3xl relative overflow-hidden shadow-lg">
          <div class="relative z-10">
            <h3 class="text-sm font-bold text-indigo-100 uppercase tracking-tight">Today's Focus</h3>
            <p class="text-2xl font-display font-bold text-white mt-2">3건의 인터뷰</p>
            <p class="text-xs text-indigo-100/80 mt-1">모든 일정을 수락하셨습니다.</p>
          </div>
          <div class="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 blur-2xl rounded-full"></div>
        </div>

      </div>

    </div>

    <ScheduleListModal
        :isOpen="isListModalOpen"
        :date="selectedDate"
        :events="currentListEvents"
        @close="isListModalOpen = false"
        @add="() => openCreateForm(selectedDate)"
        @edit="openEditForm"
        @delete="openDeleteConfirm"
    />

    <ScheduleCreateModal
        :isOpen="isFormModalOpen"
        :initialDate="selectedDate"
        :initialData="selectedEventToEdit"
        @close="isFormModalOpen = false"
        @save="handleSave"
        @delete="openDeleteConfirm"
    />

    <ConfirmModal
        :show="isDeleteModalOpen"
        title="일정 삭제"
        message="정말로 이 일정을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다."
        confirmText="삭제하기"
        type="danger"
        @confirm="confirmDelete"
        @cancel="isDeleteModalOpen = false"
    />

  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
.font-display { font-family: 'Outfit', sans-serif; }
</style>