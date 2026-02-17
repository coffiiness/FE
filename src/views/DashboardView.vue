<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import ScheduleDetailModal from '@/components/schedule/ScheduleDetailModal.vue'
import AnnouncementModal from '@/components/announcement/AnnouncementModal.vue'

const router = useRouter()

const showAnnouncementModal = ref(false)
const announcementMode = ref('list') // list | create | detail
const selectedAnnouncementId = ref(null)

// 만들기
const openCreateAnnouncement = () => {
  announcementMode.value = 'create'
  selectedAnnouncementId.value = null
  showAnnouncementModal.value = true
}

// 상세보기
const openAnnouncementDetail = (id) => {
  announcementMode.value = 'detail'
  selectedAnnouncementId.value = id
  showAnnouncementModal.value = true
}

// 닫기
const closeAnnouncement = () => {
  showAnnouncementModal.value = false
  announcementMode.value = 'list'
  selectedAnnouncementId.value = null
}

// --- Data: User & Stats ---
const userName = '김철수'
const userRole = '관리자'
const stats = [
  { label: '오늘의 일정', value: 3, icon: 'calendar', color: 'text-orange-500 bg-orange-50' },
  { label: '진행 중 공고', value: 5, icon: 'briefcase', color: 'text-brand-600 bg-brand-50' },
  { label: '신규 지원자', value: 12, icon: 'user-add', color: 'text-emerald-600 bg-emerald-50' },
]

// --- Data: Schedule ---
const currentDate = ref(new Date())
const selectedDate = ref(new Date())

// Dummy Schedule Data
const schedules = ref([
  {
    id: 1,
    title: '직무 화상 인터뷰',
    position: '퍼포먼스 마케터',
    candidate: '최나루',
    time: '09:00 - 10:00',
    date: new Date().toISOString().split('T')[0], // Today
    type: 'interview',
    status: 'scheduled'
  },
  {
    id: 2,
    title: '컬쳐핏 인터뷰',
    position: 'FE 주니어',
    candidate: '김유리',
    time: '13:00 - 14:00',
    date: new Date().toISOString().split('T')[0],
    type: 'interview',
    status: 'scheduled'
  },
  {
    id: 3,
    title: '팀 회식',
    position: '전체',
    candidate: '-',
    time: '18:00 - 20:00',
    date: new Date().toISOString().split('T')[0],
    type: 'meeting',
    status: 'scheduled'
  }
])

// --- Announcement Pagination ---
const currentPage = ref(1)
const pageSize = 3 // 한 페이지에 3개씩

const totalPages = computed(() => {
  return Math.ceil(announcements.value.length / pageSize)
})

const pagedAnnouncements = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return announcements.value.slice(start, end)
})

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}


// --- Data: Announcements ---
const announcements = ref([
  {
    id: 1,
    title: '탕비실 비품 도난 사건',
    content: '최근 탕비실 비품 분실 사례가 발생했습니다.',
    pinned: true,
    author: '김인사',
    tag: '새 공지',
    date: '2026.01.26'
  },
  {
    id: 2,
    title: '설 연휴 대체 휴무 안내',
    content: '2/10~2/12 대체 휴무입니다.',
    pinned: false,
    author: '김인사',
    tag: '필독',
    date: '2026.01.20'
  },
  {
    id: 3,
    title: '2026년 상반기 채용 계획 취합',
    content: '상반기 채용 계획을 취합합니다.',
    pinned: false,
    author: '김인사',
    tag: '',
    date: '2026.01.15'
  }
])

const handleSaveAnnouncement = (data) => {
  announcements.value.unshift({
    id: Date.now(),
    title: data.title,
    content: data.content,
    pinned: data.pinned,
    author: '김인사',
    tag: data.pinned ? '고정' : '',
    date: new Date().toISOString().slice(0,10)
  })

  currentPage.value = 1
}

const handleRemoveAnnouncement = (id) => {
  announcements.value =
      announcements.value.filter(a => a.id !== id)
}


// --- Data: Meeting Rooms (Replacement for Work Status) ---
const meetingRooms = ref([
  { id: 1, name: '1층 미팅룸 A', status: 'available', info: '오후 2시까지 예약 없음' },
  { id: 2, name: '1층 미팅룸 B', status: 'occupied', info: '주간 회의 진행 중 (~12:00)' },
  { id: 3, name: '2층 대회의실', status: 'available', info: '종일 예약 가능' },
  { id: 4, name: '화상 면접실 1', status: 'occupied', info: 'FE 개발자 면접 (~13:30)' },
  { id: 5, name: '화상 면접실 2', status: 'available', info: '다음 일정: 15:00 임원 면접' },
])

// --- Calendar Logic ---
const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토']

const currentYearMonth = computed(() => {
  const y = currentDate.value.getFullYear()
  const m = currentDate.value.getMonth() + 1
  return `${y}년 ${m}월`
})

const currentWeek = computed(() => {
  const curr = new Date(currentDate.value)
  const day = curr.getDay()
  const diff = curr.getDate() - day
  const startOfWeek = new Date(curr.setDate(diff))

  const week = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek)
    d.setDate(startOfWeek.getDate() + i)
    week.push({
      dateObj: d,
      dateNum: d.getDate(),
      dayName: daysOfWeek[i],
      fullDate: d.toISOString().split('T')[0],
      isToday: d.toDateString() === new Date().toDateString(),
      isSelected: d.toDateString() === selectedDate.value.toDateString()
    })
  }
  return week
})

const selectedDateDisplay = computed(() => {
  const d = selectedDate.value
  const m = d.getMonth() + 1
  const date = d.getDate()
  const day = daysOfWeek[d.getDay()]
  return `${m}월 ${date}일 ${day}요일`
})

const selectedSchedules = computed(() => {
  const target = selectedDate.value.toISOString().split('T')[0]
  return schedules.value.filter(s => s.date === target)
})

const prevWeek = () => { currentDate.value = new Date(currentDate.value.setDate(currentDate.value.getDate() - 7)) }
const nextWeek = () => { currentDate.value = new Date(currentDate.value.setDate(currentDate.value.getDate() + 7)) }
const goToday = () => {
  const now = new Date()
  currentDate.value = now
  selectedDate.value = now
}
const selectDate = (dateObj) => { selectedDate.value = dateObj }

// --- Modal Logic ---
const isDetailModalOpen = ref(false)
const modalEvent = ref(null)

const openScheduleDetail = (schedule) => {
  modalEvent.value = { ...schedule, description: `${schedule.position} / ${schedule.candidate}` }
  isDetailModalOpen.value = true


}
</script>

<template>
  <div class="min-h-full space-y-6">

    <!-- Header Section -->
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
          안녕하세요, {{ userName }}님
          <span class="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200">{{ userRole }}</span>
        </h1>
        <p class="text-slate-400 text-xs mt-1.5 font-medium flex items-center">
          <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          방금 전 업데이트
        </p>
      </div>

      <div class="flex gap-3 overflow-x-auto pb-1">
        <div v-for="(stat, idx) in stats" :key="idx" class="flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-sm border border-slate-100 min-w-[160px]">
          <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg" :class="stat.color">
             <svg v-if="stat.icon === 'calendar'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
             <svg v-if="stat.icon === 'briefcase'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
             <svg v-if="stat.icon === 'user-add'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          </div>
          <div>
            <p class="text-xs text-slate-400 font-bold mb-0.5">{{ stat.label }}</p>
            <p class="text-xl font-bold text-slate-800">{{ stat.value }}<span class="text-sm font-normal text-slate-400 ml-1">개</span></p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

      <!-- Left Column: My Schedule -->
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-[600px]">
        <!-- Calendar Header -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-lg font-bold text-slate-800">내 일정</h2>
            <p class="text-2xl font-bold text-slate-900 mt-1">{{ currentYearMonth }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button @click="goToday" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-all">오늘</button>
            <div class="flex bg-slate-100 rounded-lg p-0.5">
              <button @click="prevWeek" class="p-1.5 hover:bg-white rounded-md text-slate-500 transition-all shadow-sm hover:shadow">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button @click="nextWeek" class="p-1.5 hover:bg-white rounded-md text-slate-500 transition-all shadow-sm hover:shadow">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Weekly Calendar Strip -->
        <div class="grid grid-cols-7 text-center mb-6 border-b border-slate-100 pb-6">
          <div v-for="(day, idx) in currentWeek" :key="idx" class="flex flex-col items-center gap-2 cursor-pointer group" @click="selectDate(day.dateObj)">
            <span class="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">{{ day.dayName }}</span>
            <span class="w-9 h-9 flex items-center justify-center rounded-full text-sm font-bold transition-all"
                  :class="{
                    'bg-brand-600 text-white shadow-md': day.isSelected,
                    'bg-slate-50 text-slate-700 group-hover:bg-slate-100': !day.isSelected && !day.isToday,
                    'ring-1 ring-brand-600 text-brand-600 bg-white': day.isToday && !day.isSelected
                  }">
              {{ day.dateNum }}
            </span>
            <span v-if="day.isToday && !day.isSelected" class="w-1 h-1 rounded-full bg-brand-500 mt-1"></span>
          </div>
        </div>

        <!-- Schedule List for Selected Date -->
        <div class="flex-1 flex flex-col">
          <div class="flex justify-between items-center mb-4">
            <span class="text-sm font-bold text-slate-500">{{ selectedDateDisplay }}</span>
            <span class="text-xs font-medium text-slate-400">{{ selectedSchedules.length }}개의 일정</span>
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
            <div v-if="selectedSchedules.length === 0" class="h-full flex flex-col items-center justify-center text-slate-300 min-h-[200px]">
               <svg class="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
               <p class="text-sm font-medium">등록된 일정이 없습니다.</p>
            </div>

            <div v-for="schedule in selectedSchedules" :key="schedule.id"
                 @click="openScheduleDetail(schedule)"
                 class="group bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer flex items-center gap-4">
              <div class="w-1.5 h-10 rounded-full bg-brand-200 group-hover:bg-brand-500 transition-colors"></div>
              <div class="flex-1">
                <div class="flex justify-between items-start">
                   <h4 class="text-sm font-bold text-slate-800 group-hover:text-brand-700">{{ schedule.title }}</h4>
                   <span class="text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{{ schedule.time }}</span>
                </div>
                <p class="text-xs text-slate-500 mt-1">{{ schedule.position }} <span v-if="schedule.candidate" class="text-slate-300 mx-1">|</span> {{ schedule.candidate }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="space-y-6 flex flex-col h-[600px]">

        <!-- Announcements -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex-1 flex flex-col">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              사내 공지사항
              <div class="flex items-center gap-2 text-sm text-slate-400 font-medium">

                <button
                    @click="prevPage"
                    :disabled="currentPage === 1"
                    class="px-1 hover:text-slate-600 disabled:opacity-30"
                >
                  &lt;
                </button>

                <span>
    {{ currentPage }} / {{ totalPages }}
  </span>

                <button
                    @click="nextPage"
                    :disabled="currentPage === totalPages"
                    class="px-1 hover:text-slate-600 disabled:opacity-30"
                >
                  &gt;
                </button>

              </div>
            </h2>
            <div class="flex items-center gap-2">
              <button
                  @click="openCreateAnnouncement"
                  class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg"
              >
                공지사항 만들기
              </button>

            </div>
          </div>

          <div class="flex-1 overflow-y-auto">
             <ul class="space-y-1">
               <li
                   v-for="item in pagedAnnouncements"
                   :key="item.id"
                   @click="openAnnouncementDetail(item.id)"
                   class="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl cursor-pointer"
               >                  <div class="flex items-center gap-3">
                    <span class="text-sm font-bold text-slate-700 group-hover:text-brand-700 transition-colors">{{ item.title }}</span>
                    <span v-if="item.tag" class="px-2 py-0.5 rounded bg-brand-100 text-brand-600 text-[10px] font-bold">{{ item.tag }}</span>
                  </div>
                  <span class="text-xs text-slate-400 font-mono">{{ item.date }}</span>
               </li>
             </ul>
          </div>
        </div>

        <!-- Meeting Room Status (Replacement) -->
        <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex-1 flex flex-col">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span class="w-1.5 h-5 bg-orange-500 rounded-full"></span>
              실시간 회의실 현황
            </h2>
            <button @click="router.push('/meeting-rooms')" class="text-xs font-bold text-slate-400 hover:text-orange-600 transition-colors">예약하기</button>
          </div>
          
          <div class="flex-1 overflow-hidden">
             <div class="overflow-y-auto h-full custom-scrollbar pr-2 space-y-3">
                <div v-for="room in meetingRooms" :key="room.id" 
                     class="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer">
                   <div class="flex items-center gap-3">
                     <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-white border border-slate-100 shadow-sm"
                          :class="room.status === 'available' ? 'text-emerald-500' : 'text-slate-400'">
                       <!-- Room Icon -->
                       <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                     </div>
                     <div>
                       <p class="text-sm font-bold text-slate-800">{{ room.name }}</p>
                       <p class="text-xs text-slate-500 truncate max-w-[150px]">{{ room.info }}</p>
                     </div>
                   </div>
                   <span class="px-2.5 py-1 rounded-lg text-xs font-bold border"
                         :class="room.status === 'available' 
                           ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                           : 'bg-rose-50 text-rose-600 border-rose-100'">
                     {{ room.status === 'available' ? '예약 가능' : '사용 중' }}
                   </span>
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>

    <ScheduleDetailModal
      :isOpen="isDetailModalOpen"
      :event="modalEvent || {}"
      @close="isDetailModalOpen = false"
    />
  </div>

  <AnnouncementModal
      :show="showAnnouncementModal"
      :mode="announcementMode"
      :selected-id="selectedAnnouncementId"
      :announcements="announcements"
      @close="closeAnnouncement"
      @save="handleSaveAnnouncement"
      @remove="handleRemoveAnnouncement"
  />

</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }
</style>