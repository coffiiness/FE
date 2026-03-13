<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import ScheduleDetailModal from '@/components/schedule/ScheduleDetailModal.vue'
import InterviewDetailModal from '@/components/recruitment/InterviewDetailModal.vue'
import AnnouncementModal from '@/components/announcement/AnnouncementModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import DashboardChatPanel from '@/components/dashboard/DashboardChatPanel.vue'
import { announcementBoardApi } from '@/api/announcementBoard'
import { memberApi } from '@/api/member'
import { recruitmentApi } from '@/api/recruitment'
import { useAuth } from '@/composables/useAuth'
import { useScheduleStore } from '@/stores/schedule'

const router = useRouter()
const { user } = useAuth()
const scheduleStore = useScheduleStore()
const { schedules: allSchedules, loading: schedulesLoading } = storeToRefs(scheduleStore)

const memberType = ref('')
const recruitments = ref([])
const weeklyInterviewSchedules = ref([])

const showAnnouncementModal = ref(false)
const announcementMode = ref('list')
const selectedAnnouncementId = ref(null)
const feedbackModal = ref({
  show: false,
  type: 'info',
  title: '',
  message: ''
})

const currentDate = ref(new Date())
const selectedDate = ref(scheduleStore.getToday())

const currentPage = ref(1)
const pageSize = 3
const announcements = ref([])

const isDetailModalOpen = ref(false)
const modalEvent = ref(null)
const showInterviewDetailModal = ref(false)
const selectedInterview = ref(null)
const showDashboardChat = ref(false)

const userName = computed(() => user.value?.name || '사용자')
const currentUserId = computed(() => toPositiveNumber(user.value?.id))
const currentUserName = computed(() => String(user.value?.name || '').trim())
const isHrMember = computed(() => memberType.value === 'HR')
const isInterviewer = computed(() => memberType.value === 'INTERVIEWER')
const userRole = computed(() => {
  if (isHrMember.value) return '인사담당자'
  if (isInterviewer.value) return '면접관'
  return '멤버'
})

const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토']

const formatDateKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateLabel = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}.${mm}.${dd}`
}

const formatMonthDayLabel = (dateText) => {
  const date = new Date(`${dateText}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${daysOfWeek[date.getDay()]}요일`
}

const startOfWeek = (date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  next.setDate(next.getDate() - next.getDay())
  return next
}

const endOfWeek = (date) => {
  const next = startOfWeek(date)
  next.setDate(next.getDate() + 6)
  return next
}

const getDashboardRange = (baseDate) => {
  const start = startOfWeek(baseDate)
  const end = new Date(baseDate)
  end.setHours(0, 0, 0, 0)
  end.setDate(end.getDate() + 21)
  return {
    startDate: formatDateKey(start),
    endDate: formatDateKey(end)
  }
}

const toPositiveNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

const normalizeDisplayName = (value) => {
  const text = String(value || '').trim()
  if (!text || text === '?' || text === '알 수 없음') return ''
  return text
}

const splitNames = (value) => {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const getUniqueNames = (values) => {
  return values
    .map((value) => normalizeDisplayName(value))
    .filter((name, index, names) => name && names.indexOf(name) === index)
}

const isCurrentUserInterviewer = (item, interviewerNames) => {
  const interviewerUserId = toPositiveNumber(item?.interviewerUserId)
  if (currentUserId.value && interviewerUserId && currentUserId.value === interviewerUserId) {
    return true
  }

  if (!currentUserName.value) return false
  return interviewerNames.includes(currentUserName.value)
}

const getDisplayStatus = (status, endDate) => {
  const normalizedStatus = String(status || '').toUpperCase()
  if (normalizedStatus === 'CLOSED') return 'closed'
  if (normalizedStatus === 'DRAFT') return 'draft'

  if (normalizedStatus === 'OPEN' && endDate) {
    const now = new Date()
    const end = new Date(endDate)
    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    if (diffDays <= 3) return 'urgent'
    return 'open'
  }

  return normalizedStatus.toLowerCase() || 'draft'
}

const formatScheduleSummary = (schedule) => {
  const attendees = Array.isArray(schedule?.attendees) ? schedule.attendees.filter(Boolean) : []
  if (schedule?.applicantName && attendees.length > 0) {
    return `${attendees[0]} · ${schedule.applicantName}`
  }
  if (schedule?.applicantName) return schedule.applicantName
  if (attendees.length > 0) return attendees.join(', ')
  return schedule?.description || '세부 정보 없음'
}

const normalizeWeeklySchedule = (item) => {
  const start = item?.startAt ? new Date(item.startAt) : null
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) return null

  const end = item?.endAt ? new Date(item.endAt) : new Date(start.getTime())
  const interviewerNames = getUniqueNames(splitNames(item?.interviewerName))
  const applicantNames = getUniqueNames(splitNames(item?.applicantName))
  const showSelf = isCurrentUserInterviewer(item, interviewerNames)
  const attendees = getUniqueNames([
    ...interviewerNames.filter((name) => !showSelf || name !== currentUserName.value),
    ...applicantNames
  ])
  const locationParts = [String(item?.location || '').trim(), String(item?.description || '').trim()]
    .filter(Boolean)
  const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
  const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`

  return {
    id: Number(item.id),
    recruitmentId: toPositiveNumber(item?.recruitmentId),
    title: String(item?.title || '').trim() || '면접 일정',
    applicantName: String(item?.applicantName || '').trim(),
    interviewerName: String(item?.interviewerName || '').trim(),
    date: formatDateKey(start),
    startTime,
    endTime,
    time: `${startTime} - ${endTime}`,
    location: locationParts.join(' · '),
    description: String(item?.description || '').trim(),
    showSelf,
    attendees
  }
}

const currentYearMonth = computed(() => {
  const y = currentDate.value.getFullYear()
  const m = currentDate.value.getMonth() + 1
  return `${y}년 ${m}월`
})

const currentWeek = computed(() => {
  const base = startOfWeek(currentDate.value)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base)
    date.setDate(base.getDate() + index)
    const fullDate = formatDateKey(date)

    return {
      dateObj: date,
      dateNum: date.getDate(),
      dayName: daysOfWeek[index],
      fullDate,
      isToday: fullDate === scheduleStore.getToday(),
      isSelected: fullDate === selectedDate.value
    }
  })
})

const selectedDateDisplay = computed(() => formatMonthDayLabel(selectedDate.value))

const sortedSchedules = computed(() => {
  return [...allSchedules.value].sort((a, b) => {
    return `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`)
  })
})

const todaySchedules = computed(() => {
  const today = scheduleStore.getToday()
  return sortedSchedules.value.filter((schedule) => schedule.date === today)
})

const selectedSchedules = computed(() => {
  return sortedSchedules.value.filter((schedule) => schedule.date === selectedDate.value)
})

const upcomingSchedules = computed(() => {
  const today = scheduleStore.getToday()
  const now = new Date()
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  return sortedSchedules.value
    .filter((schedule) => {
      if (schedule.date > today) return true
      if (schedule.date < today) return false
      return schedule.endTime >= currentTime
    })
    .slice(0, 4)
})

const weeklyInterviewItems = computed(() => weeklyInterviewSchedules.value.slice(0, 4))

const activeRecruitmentsCount = computed(() => {
  return recruitments.value.filter((job) => String(job.status || '').toUpperCase() === 'OPEN').length
})

const urgentRecruitmentsCount = computed(() => {
  return recruitments.value.filter((job) => getDisplayStatus(job.status, job.endDate) === 'urgent').length
})

const stats = computed(() => {
  if (isHrMember.value) {
    return [
      { label: '오늘의 일정', value: todaySchedules.value.length, unit: '개', icon: 'calendar', color: 'text-orange-500 bg-orange-50' },
      { label: '진행 중 공고', value: activeRecruitmentsCount.value, unit: '개', icon: 'briefcase', color: 'text-brand-600 bg-brand-50' },
      { label: '이번 주 면접', value: weeklyInterviewSchedules.value.length, unit: '건', icon: 'users', color: 'text-emerald-600 bg-emerald-50' }
    ]
  }

  return [
    { label: '오늘의 일정', value: todaySchedules.value.length, unit: '개', icon: 'calendar', color: 'text-orange-500 bg-orange-50' },
    { label: '다가오는 일정', value: upcomingSchedules.value.length, unit: '개', icon: 'calendar-stack', color: 'text-brand-600 bg-brand-50' },
    { label: '이번 주 면접', value: weeklyInterviewSchedules.value.length, unit: '건', icon: 'users', color: 'text-emerald-600 bg-emerald-50' }
  ]
})

const totalPages = computed(() => Math.max(1, Math.ceil(sortedAnnouncements.value.length / pageSize)))

const sortedAnnouncements = computed(() => {
  return [...announcements.value].sort((a, b) => {
    if (a.pinned === b.pinned) return b.id - a.id
    return a.pinned ? -1 : 1
  })
})

const pagedAnnouncements = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return sortedAnnouncements.value.slice(start, start + pageSize)
})

const showAnnouncementForbiddenModal = () => {
  feedbackModal.value = {
    show: true,
    type: 'warning',
    title: '권한 없음',
    message: '공지사항 수정 및 삭제는 인사담당자만 가능합니다.'
  }
}

const openFeedbackModal = ({ type = 'info', title = '안내', message = '' }) => {
  feedbackModal.value = { show: true, type, title, message }
}

const ensureHrAnnouncementAccess = (message) => {
  if (isHrMember.value) return true
  openFeedbackModal({
    type: 'warning',
    title: '권한 없음',
    message
  })
  return false
}

const openCreateAnnouncement = () => {
  if (!ensureHrAnnouncementAccess('공지사항 생성은 인사담당자만 가능합니다.')) return
  announcementMode.value = 'create'
  selectedAnnouncementId.value = null
  showAnnouncementModal.value = true
}

const openAnnouncementDetail = (id) => {
  announcementMode.value = 'detail'
  selectedAnnouncementId.value = id
  showAnnouncementModal.value = true
}

const closeAnnouncement = () => {
  showAnnouncementModal.value = false
  announcementMode.value = 'list'
  selectedAnnouncementId.value = null
}

const toViewAnnouncement = (item) => ({
  id: item.id,
  title: item.title,
  content: item.content,
  pinned: item.pinned,
  author: '관리자',
  tag: item.pinned ? '고정' : '',
  date: formatDateLabel(item.createdAt || new Date())
})

const loadAnnouncements = async () => {
  try {
    const response = await announcementBoardApi.list()
    const data = response?.data?.data
    announcements.value = Array.isArray(data) ? data.map(toViewAnnouncement) : []
    currentPage.value = 1
  } catch (error) {
    console.error('공지사항 조회 실패:', error)
    announcements.value = []
  }
}

const loadMemberType = async () => {
  try {
    const response = await memberApi.getMyMember()
    memberType.value = response?.data?.data?.memberType || ''
  } catch (_) {
    memberType.value = ''
  }
}

const loadRecruitments = async () => {
  try {
    const response = await recruitmentApi.getRecruitments({ page: 0, size: 100 })
    recruitments.value = Array.isArray(response?.data?.data) ? response.data.data : []
  } catch (error) {
    console.error('대시보드 채용 공고 조회 실패:', error)
    recruitments.value = []
  }
}

const loadWeeklyInterviewSchedules = async () => {
  try {
    const response = await recruitmentApi.getWeeklyInterviewSchedules(scheduleStore.getToday())
    const data = response?.data?.data || []
    weeklyInterviewSchedules.value = Array.isArray(data)
      ? data.map(normalizeWeeklySchedule).filter(Boolean)
      : []
  } catch (error) {
    console.error('대시보드 주간 면접 일정 조회 실패:', error)
    weeklyInterviewSchedules.value = []
  }
}

const loadSchedules = async () => {
  const { startDate, endDate } = getDashboardRange(currentDate.value)
  await scheduleStore.fetchSchedules(startDate, endDate)
}

const prevPage = () => {
  if (currentPage.value > 1) currentPage.value -= 1
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) currentPage.value += 1
}

const prevWeek = () => {
  const next = new Date(currentDate.value)
  next.setDate(next.getDate() - 7)
  currentDate.value = next
  selectedDate.value = formatDateKey(next)
}

const nextWeek = () => {
  const next = new Date(currentDate.value)
  next.setDate(next.getDate() + 7)
  currentDate.value = next
  selectedDate.value = formatDateKey(next)
}

const goToday = () => {
  const now = new Date()
  currentDate.value = now
  selectedDate.value = formatDateKey(now)
}

const selectDate = (dateObj) => {
  const next = new Date(dateObj)
  currentDate.value = next
  selectedDate.value = formatDateKey(next)
}

const openScheduleDetail = async (schedule) => {
  try {
    const detail = await scheduleStore.getScheduleDetail(schedule.id)
    modalEvent.value = detail || schedule
  } catch (error) {
    console.error('일정 상세 조회 실패:', error)
    modalEvent.value = schedule
  }
  isDetailModalOpen.value = true
}

const openInterviewDetail = (schedule) => {
  selectedInterview.value = schedule
  showInterviewDetailModal.value = true
}

const goToRecruitmentHome = () => {
  router.push('/recruitment/home')
}

const toggleDashboardChat = () => {
  showDashboardChat.value = !showDashboardChat.value
}

const closeDashboardChat = () => {
  showDashboardChat.value = false
}

const handleSaveAnnouncement = async (data) => {
  if (!ensureHrAnnouncementAccess('공지사항 생성은 인사담당자만 가능합니다.')) return

  try {
    const response = await announcementBoardApi.create({
      title: data.title,
      content: data.content,
      pinned: data.pinned
    })
    const created = response?.data?.data
    if (!created?.id) return

    announcements.value.unshift(toViewAnnouncement(created))
    currentPage.value = 1
    closeAnnouncement()
    openFeedbackModal({
      type: 'success',
      title: '공지사항 등록 완료',
      message: '공지사항이 성공적으로 등록되었습니다.'
    })
  } catch (error) {
    console.error('공지사항 생성 실패:', error)
    openFeedbackModal({
      type: 'warning',
      title: '공지사항 등록 실패',
      message: '공지사항 생성 중 문제가 발생했습니다.'
    })
  }
}

const handleUpdateAnnouncement = async (data) => {
  if (!ensureHrAnnouncementAccess('공지사항 수정은 인사담당자만 가능합니다.')) return

  try {
    await announcementBoardApi.update(data.id, {
      title: data.title,
      content: data.content,
      pinned: data.pinned
    })

    const index = announcements.value.findIndex((item) => item.id === data.id)
    if (index !== -1) {
      announcements.value[index] = {
        ...announcements.value[index],
        title: data.title,
        content: data.content,
        pinned: data.pinned,
        tag: data.pinned ? '고정' : ''
      }
    }

    closeAnnouncement()
    openFeedbackModal({
      type: 'success',
      title: '공지사항 수정 완료',
      message: '공지사항이 성공적으로 수정되었습니다.'
    })
  } catch (error) {
    console.error('공지사항 수정 실패:', error)
    openFeedbackModal({
      type: 'warning',
      title: '공지사항 수정 실패',
      message: '공지사항 수정 중 문제가 발생했습니다.'
    })
  }
}

const handleRemoveAnnouncement = async (id) => {
  if (!ensureHrAnnouncementAccess('공지사항 삭제는 인사담당자만 가능합니다.')) return

  try {
    await announcementBoardApi.remove(id)
    announcements.value = announcements.value.filter((item) => item.id !== id)
    if (currentPage.value > totalPages.value) {
      currentPage.value = Math.max(totalPages.value, 1)
    }
    closeAnnouncement()
    openFeedbackModal({
      type: 'success',
      title: '공지사항 삭제 완료',
      message: '공지사항이 성공적으로 삭제되었습니다.'
    })
  } catch (error) {
    console.error('공지사항 삭제 실패:', error)
    openFeedbackModal({
      type: 'warning',
      title: '공지사항 삭제 실패',
      message: '공지사항 삭제 중 문제가 발생했습니다.'
    })
  }
}

watch(currentDate, async () => {
  await loadSchedules()
})

onMounted(async () => {
  await Promise.all([
    loadMemberType(),
    loadAnnouncements(),
    loadRecruitments(),
    loadWeeklyInterviewSchedules(),
    loadSchedules()
  ])
})
</script>

<template>
  <div class="min-h-full space-y-6">
    <header class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 flex items-center gap-2">
          안녕하세요, {{ userName }}님
          <span class="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200">{{ userRole }}</span>
        </h1>
        <p class="text-slate-400 text-xs mt-1.5 font-medium flex items-center">
          <svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          실시간 대시보드
        </p>
      </div>

      <div class="flex gap-3 overflow-x-auto pb-1">
        <div v-for="(stat, idx) in stats" :key="idx" class="flex items-center gap-3 bg-white px-5 py-3 rounded-xl shadow-sm border border-slate-100 min-w-[160px]">
          <div class="w-10 h-10 rounded-full flex items-center justify-center text-lg" :class="stat.color">
            <svg v-if="stat.icon === 'calendar'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <svg v-else-if="stat.icon === 'briefcase'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            <svg v-else-if="stat.icon === 'users'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-1a4 4 0 00-5.356-3.773M9 20H4v-1a4 4 0 015.356-3.773M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 12h14M5 16h10" /></svg>
          </div>
          <div>
            <p class="text-xs text-slate-400 font-bold mb-0.5">{{ stat.label }}</p>
            <p class="text-xl font-bold text-slate-800">{{ stat.value }}<span class="text-sm font-normal text-slate-400 ml-1">{{ stat.unit }}</span></p>
          </div>
        </div>
      </div>
    </header>

    <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)] gap-6 items-start">
      <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-[544px]">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-lg font-bold text-slate-800">오늘 일정</h2>
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

        <div class="flex-1 flex flex-col min-h-0">
          <div class="flex justify-between items-center mb-4">
            <span class="text-sm font-bold text-slate-500">{{ selectedDateDisplay }}</span>
            <span class="text-xs font-medium text-slate-400">{{ selectedSchedules.length }}개의 일정</span>
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
            <div v-if="schedulesLoading" class="h-full flex flex-col items-center justify-center text-slate-300 min-h-[200px]">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mb-3"></div>
              <p class="text-sm font-medium text-slate-400">일정을 불러오는 중입니다.</p>
            </div>

            <div v-else-if="selectedSchedules.length === 0" class="h-full flex flex-col items-center justify-center text-slate-300 min-h-[200px]">
              <svg class="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <p class="text-sm font-medium">선택한 날짜에 일정이 없습니다.</p>
            </div>

            <div v-for="schedule in selectedSchedules" :key="schedule.id"
                 @click="openScheduleDetail(schedule)"
                 class="group bg-white border border-slate-200 rounded-xl p-4 hover:border-brand-300 hover:shadow-md transition-all cursor-pointer flex items-center gap-4">
              <div class="w-1.5 h-10 rounded-full bg-brand-200 group-hover:bg-brand-500 transition-colors"></div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start gap-3">
                  <h4 class="text-sm font-bold text-slate-800 group-hover:text-brand-700 truncate">{{ schedule.title }}</h4>
                  <span class="text-xs font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">{{ schedule.time }}</span>
                </div>
                <p class="text-xs text-slate-500 mt-1 truncate">{{ formatScheduleSummary(schedule) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-[220px] flex flex-col">
          <div class="flex justify-between items-center mb-5">
            <h2 class="text-lg font-bold text-slate-800 flex items-center gap-2">
              공지사항
              <div class="flex items-center gap-2 text-sm text-slate-400 font-medium">
                <button @click="prevPage" :disabled="currentPage === 1" class="px-1 hover:text-slate-600 disabled:opacity-30">&lt;</button>
                <span>{{ currentPage }} / {{ totalPages }}</span>
                <button @click="nextPage" :disabled="currentPage === totalPages" class="px-1 hover:text-slate-600 disabled:opacity-30">&gt;</button>
              </div>
            </h2>
            <button
              v-if="isHrMember"
              @click="openCreateAnnouncement"
              class="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg"
            >
              공지사항 만들기
            </button>
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar">
            <ul v-if="pagedAnnouncements.length" class="space-y-1">
              <li
                v-for="item in pagedAnnouncements"
                :key="item.id"
                @click="openAnnouncementDetail(item.id)"
                class="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl cursor-pointer"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <span class="text-sm font-bold text-slate-700 truncate">{{ item.title }}</span>
                  <span v-if="item.tag" class="px-2 py-0.5 rounded bg-brand-100 text-brand-600 text-[10px] font-bold">{{ item.tag }}</span>
                </div>
                <span class="text-xs text-slate-400 font-mono shrink-0">{{ item.date }}</span>
              </li>
            </ul>

            <div v-else class="h-full flex items-center justify-center text-sm text-slate-400">
              등록된 공지사항이 없습니다.
            </div>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-[300px] flex flex-col">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h2 class="text-lg font-bold text-slate-800">{{ isHrMember ? '이번 주 면접 예정' : '다가오는 일정' }}</h2>
              <p class="text-xs text-slate-400 mt-1">
                {{ isHrMember ? '이번 주에 예정된 면접을 빠르게 확인할 수 있어요.' : '오늘 이후 예정된 일정을 빠르게 확인할 수 있어요.' }}
              </p>
            </div>
            <button
              v-if="isHrMember"
              @click="goToRecruitmentHome"
              class="px-3 py-1.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-lg text-xs font-bold hover:bg-brand-100 transition-colors"
            >
              채용 홈 이동
            </button>
          </div>

          <div class="flex-1 overflow-y-auto custom-scrollbar pr-1">
            <div v-if="isHrMember">
              <div v-if="weeklyInterviewItems.length" class="space-y-3">
                <article
                  v-for="item in weeklyInterviewItems"
                  :key="item.id"
                  @click="openInterviewDetail(item)"
                  class="rounded-xl border border-slate-200 px-4 py-3 bg-white cursor-pointer hover:border-brand-300 hover:shadow-sm transition-all"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-sm font-bold text-slate-800 truncate">{{ item.title }}</p>
                      <p class="text-xs text-slate-500 mt-1">{{ formatMonthDayLabel(item.date) }} · {{ item.time }}</p>
                      <p class="text-xs text-slate-500 mt-1 truncate">{{ item.applicantName || item.interviewerName || '면접 정보 없음' }}</p>
                    </div>
                    <span class="px-2 py-1 rounded-md bg-brand-50 text-brand-700 text-[11px] font-bold shrink-0">면접</span>
                  </div>
                </article>
              </div>

              <div v-else class="h-full flex flex-col items-center justify-center text-slate-300 min-h-[120px]">
                <svg class="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p class="text-sm font-medium">이번 주 예정된 면접이 없습니다.</p>
              </div>
            </div>

            <div v-else>
              <div v-if="upcomingSchedules.length" class="space-y-3">
                <article
                  v-for="schedule in upcomingSchedules"
                  :key="schedule.id"
                  @click="openScheduleDetail(schedule)"
                  class="rounded-xl border border-slate-200 px-4 py-3 bg-white cursor-pointer hover:border-brand-300 hover:shadow-sm transition-all"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-sm font-bold text-slate-800 truncate">{{ schedule.title }}</p>
                      <p class="text-xs text-slate-500 mt-1">{{ formatMonthDayLabel(schedule.date) }} · {{ schedule.time }}</p>
                      <p class="text-xs text-slate-500 mt-1 truncate">{{ formatScheduleSummary(schedule) }}</p>
                    </div>
                    <span class="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[11px] font-bold shrink-0">{{ schedule.type || '일정' }}</span>
                  </div>
                </article>
              </div>

              <div v-else class="h-full flex flex-col items-center justify-center text-slate-300 min-h-[120px]">
                <svg class="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p class="text-sm font-medium">다가오는 일정이 없습니다.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-4 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-4 opacity-0"
    >
      <div
        v-if="showDashboardChat"
        class="fixed bottom-24 right-6 z-40 w-[420px] max-w-[calc(100vw-32px)]"
      >
        <DashboardChatPanel
          :show-close-button="true"
          @close="closeDashboardChat"
        />
      </div>
    </transition>

    <button
      type="button"
      class="fixed bottom-6 right-6 z-40 inline-flex items-center gap-3 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-slate-900/20 transition hover:bg-slate-800"
      @click="toggleDashboardChat"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4v-4z" />
      </svg>
      <span>{{ showDashboardChat ? '익명 라운지 닫기' : '익명 라운지' }}</span>
    </button>

    <ScheduleDetailModal
      :isOpen="isDetailModalOpen"
      :event="modalEvent || {}"
      @close="isDetailModalOpen = false"
    />

    <InterviewDetailModal
      :show="showInterviewDetailModal"
      :event="selectedInterview || {}"
      @close="showInterviewDetailModal = false"
    />

    <AnnouncementModal
      :show="showAnnouncementModal"
      :mode="announcementMode"
      :selected-id="selectedAnnouncementId"
      :announcements="announcements"
      :can-manage="isHrMember"
      @close="closeAnnouncement"
      @forbidden="showAnnouncementForbiddenModal"
      @create="handleSaveAnnouncement"
      @update="handleUpdateAnnouncement"
      @remove="handleRemoveAnnouncement"
    />

    <ConfirmModal
      :show="feedbackModal.show"
      :type="feedbackModal.type"
      :title="feedbackModal.title"
      :message="feedbackModal.message"
      confirmText="확인"
      :showCancel="false"
      @confirm="feedbackModal.show = false"
      @cancel="feedbackModal.show = false"
    />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }
</style>
