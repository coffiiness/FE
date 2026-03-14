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

const nextUpcomingSchedule = computed(() => upcomingSchedules.value[0] || null)

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
  <div class="dashboard-shell min-h-full space-y-3">
    <header class="grid grid-cols-1 xl:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] gap-3">
      <section class="hero-panel h-full min-h-[120px] rounded-2xl border px-4 py-3.5">
        <div class="flex items-center justify-between gap-4">
          <div class="flex-1 space-y-2 pr-3">
            <div class="flex flex-wrap items-center gap-3">
              <h1 class="text-[1.4rem] leading-tight font-display font-black text-slate-950">
                안녕하세요, {{ userName }}님
              </h1>
              <span class="rounded-lg border border-teal-200 bg-teal-50 px-2.5 py-1 text-[11px] font-extrabold tracking-[0.04em] text-teal-700">{{ userRole }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-2.5 text-xs text-slate-500">
              <span class="hero-status-chip">
                <span class="h-2.5 w-2.5 rounded-full bg-teal-500"></span>
                실시간 상태 반영
              </span>
              <span class="inline-flex items-center gap-2 font-medium text-slate-500/90">
                <svg class="h-4 w-4 text-teal-700/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                마지막 업데이트 기준으로 새로 고침됩니다
              </span>
            </div>
            <p class="hero-next-line truncate">
              <span class="font-extrabold text-teal-700">다음 일정</span>
              <template v-if="nextUpcomingSchedule">
                <span class="text-slate-300">·</span>
                <span class="font-semibold text-slate-700">{{ nextUpcomingSchedule.title }}</span>
                <span class="text-slate-300">·</span>
                <span>{{ formatMonthDayLabel(nextUpcomingSchedule.date) }}</span>
                <span class="text-slate-300">·</span>
                <span>{{ nextUpcomingSchedule.time }}</span>
              </template>
              <template v-else>
                <span class="text-slate-300">·</span>
                <span>예정된 일정이 없습니다.</span>
              </template>
            </p>
          </div>
          <div class="hidden xl:flex min-w-[98px] items-center justify-end self-stretch">
            <div class="hero-date-badge">
              {{ formatDateLabel(new Date()) }}
            </div>
          </div>
        </div>
      </section>

      <section class="grid h-full grid-cols-1 gap-3 sm:grid-cols-3">
        <article
          v-for="(stat, idx) in stats"
          :key="idx"
          class="metric-panel h-full rounded-xl border px-4 py-3"
        >
          <div class="flex h-full flex-col justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="metric-icon" :class="stat.color">
                <svg v-if="stat.icon === 'calendar'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <svg v-else-if="stat.icon === 'briefcase'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <svg v-else-if="stat.icon === 'users'" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-1a4 4 0 00-5.356-3.773M9 20H4v-1a4 4 0 015.356-3.773M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 12h14M5 16h10" /></svg>
              </div>
              <span class="text-sm font-bold text-slate-500">{{ stat.label }}</span>
            </div>
            <div class="flex items-end">
              <strong class="text-[1.8rem] leading-none font-black tracking-tight text-slate-950">{{ stat.value }}</strong>
              <span class="ml-0.5 pb-0.5 text-sm font-semibold text-slate-400">{{ stat.unit }}</span>
            </div>
          </div>
        </article>
      </section>
    </header>

    <div class="grid grid-cols-1 xl:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] gap-6 items-start">
      <div class="feature-panel today-panel rounded-xl px-5 py-5 flex flex-col h-[560px]">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h2 class="text-[1.6rem] leading-tight font-display font-black text-slate-950">오늘 일정</h2>
            <p class="text-sm font-medium text-slate-500 mt-1">{{ currentYearMonth }}</p>
          </div>
          <div class="flex items-center gap-2">
            <button @click="goToday" class="pill-button pill-button-subtle">오늘</button>
            <div class="inline-flex rounded-lg border border-slate-200 bg-white p-1">
              <button @click="prevWeek" class="pill-icon-button">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <button @click="nextWeek" class="pill-icon-button">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div class="week-strip mb-6 grid grid-cols-7 gap-2 border-b border-slate-200/80 pb-6 text-center">
          <div v-for="(day, idx) in currentWeek" :key="idx" class="flex flex-col items-center gap-2 cursor-pointer group" @click="selectDate(day.dateObj)">
            <span class="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 group-hover:text-slate-600 transition-colors">{{ day.dayName }}</span>
            <span class="week-strip__day"
                  :class="{
                    'week-strip__day--selected': day.isSelected,
                    'week-strip__day--normal': !day.isSelected && !day.isToday,
                    'week-strip__day--today': day.isToday && !day.isSelected
                  }">
              {{ day.dateNum }}
            </span>
            <span v-if="day.isToday && !day.isSelected" class="mt-1 h-1.5 w-1.5 rounded-full bg-teal-500"></span>
          </div>
        </div>

        <div class="flex-1 flex flex-col min-h-0">
          <div class="flex justify-between items-center mb-4">
            <span class="text-sm font-black text-slate-700">{{ selectedDateDisplay }}</span>
            <span class="text-xs font-semibold tracking-[0.04em] text-slate-400">{{ selectedSchedules.length }}개 일정</span>
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
                 class="schedule-card group cursor-pointer">
              <div class="schedule-card__bar"></div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start gap-3">
                  <h4 class="truncate text-sm font-black text-slate-800 transition-colors group-hover:text-teal-800">{{ schedule.title }}</h4>
                  <span class="schedule-time-badge">{{ schedule.time }}</span>
                </div>
                <p class="mt-1 truncate text-xs text-slate-500">{{ formatScheduleSummary(schedule) }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="info-panel announcement-panel rounded-xl px-5 py-5 h-[232px] flex flex-col">
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
              class="pill-button pill-button-subtle"
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
                class="flex justify-between items-center rounded-lg p-3 hover:bg-slate-50 cursor-pointer"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <span class="text-sm font-black text-slate-700 truncate">{{ item.title }}</span>
                  <span v-if="item.tag" class="rounded-lg border border-teal-200 bg-teal-100/80 px-2.5 py-0.5 text-[10px] font-black tracking-[0.04em] text-teal-700">{{ item.tag }}</span>
                </div>
                <span class="text-xs text-slate-400 font-mono shrink-0">{{ item.date }}</span>
              </li>
            </ul>

            <div v-else class="h-full flex items-center justify-center text-sm text-slate-400">
              등록된 공지사항이 없습니다.
            </div>
          </div>
        </div>

        <div class="info-panel utility-panel rounded-xl px-5 py-5 h-[322px] flex flex-col">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h2 class="text-[1.35rem] leading-tight font-display font-black text-slate-900">{{ isHrMember ? '이번 주 면접 예정' : '다가오는 일정' }}</h2>
              <p class="text-xs text-slate-400 mt-1">
                {{ isHrMember ? '이번 주에 예정된 면접을 빠르게 확인할 수 있어요.' : '오늘 이후 예정된 일정을 빠르게 확인할 수 있어요.' }}
              </p>
            </div>
            <button
              v-if="isHrMember"
              @click="goToRecruitmentHome"
              class="pill-button pill-button-subtle"
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
                  class="listing-card"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-sm font-black text-slate-800 truncate">{{ item.title }}</p>
                      <p class="text-xs text-slate-500 mt-1">{{ formatMonthDayLabel(item.date) }} · {{ item.time }}</p>
                      <p class="text-xs text-slate-500 mt-1 truncate">{{ item.applicantName || item.interviewerName || '면접 정보 없음' }}</p>
                    </div>
                    <span class="listing-badge listing-badge-interview">면접</span>
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
                  class="listing-card"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="text-sm font-black text-slate-800 truncate">{{ schedule.title }}</p>
                      <p class="text-xs text-slate-500 mt-1">{{ formatMonthDayLabel(schedule.date) }} · {{ schedule.time }}</p>
                      <p class="text-xs text-slate-500 mt-1 truncate">{{ formatScheduleSummary(schedule) }}</p>
                    </div>
                    <span class="listing-badge">{{ schedule.type || '일정' }}</span>
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
        class="fixed bottom-24 right-6 z-40 w-[440px] max-w-[calc(100vw-32px)]"
      >
        <DashboardChatPanel
          :show-close-button="true"
          @close="closeDashboardChat"
        />
      </div>
    </transition>

    <button
      type="button"
      class="floating-chat-button"
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
.dashboard-shell {
  --dash-ink: #11232c;
  --dash-deep: #163743;
  --dash-teal: #14b8a6;
  --dash-teal-deep: #0f766e;
  --dash-teal-soft: #dff7f1;
  --dash-surface: #fbfcfc;
  --dash-paper: #f5f7f8;
  background: #f8fbfb;
}

.hero-panel {
  border-color: #e5e7eb;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(223, 247, 241, 0.78)),
    radial-gradient(circle at top right, rgba(20, 184, 166, 0.12), transparent 36%);
}

.hero-status-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: 1px solid #dbe4e6;
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.8);
  padding: 0.3rem 0.6rem;
  font-weight: 700;
}

.hero-date-badge {
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.88);
  padding: 0.5rem 0.7rem;
  font-size: 0.8rem;
  font-weight: 900;
  color: #334155;
}

.hero-next-line {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.8rem;
  line-height: 1.25rem;
  color: #64748b;
}

.metric-panel {
  border-color: #e5e7eb;
  background: #ffffff;
  min-height: 108px;
}

.metric-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2.15rem;
  width: 2.15rem;
  border-radius: 0.75rem;
}

.feature-panel,
.info-panel {
  border: 1px solid #e5e7eb;
  background: #ffffff;
}

.today-panel {
  background: #ffffff;
}

.announcement-panel {
  background: #ffffff;
}

.utility-panel {
  background: #ffffff;
}

.pill-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  padding: 0.55rem 0.95rem;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  transition: all 0.2s ease;
}

.pill-button-subtle {
  border: 1px solid rgba(20, 184, 166, 0.24);
  background: rgba(223, 247, 241, 0.88);
  color: var(--dash-teal-deep);
}

.pill-icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.6rem;
  padding: 0.42rem;
  color: rgba(71, 85, 105, 0.9);
  transition: all 0.18s ease;
}

.pill-icon-button:hover {
  background: rgba(241, 245, 249, 0.92);
  color: var(--dash-deep);
}

.week-strip__day {
  display: flex;
  height: 2.65rem;
  width: 2.65rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  font-size: 0.92rem;
  font-weight: 900;
  transition: all 0.2s ease;
}

.week-strip__day--selected {
  background: #14b8a6;
  color: white;
}

.week-strip__day--normal {
  background: rgba(248, 250, 252, 0.95);
  color: rgb(51, 65, 85);
}

.week-strip__day--normal:hover {
  background: white;
}

.week-strip__day--today {
  border: 1px solid rgba(15, 118, 110, 0.32);
  background: rgba(255, 255, 255, 0.92);
  color: var(--dash-teal-deep);
}

.schedule-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 1rem;
  transition: all 0.2s ease;
}

.schedule-card:hover {
  border-color: rgba(20, 184, 166, 0.34);
}

.schedule-card__bar {
  width: 0.3rem;
  height: 3rem;
  border-radius: 9999px;
  background: #14b8a6;
}

.schedule-time-badge {
  flex-shrink: 0;
  border-radius: 0.65rem;
  background: rgba(241, 245, 249, 0.96);
  padding: 0.4rem 0.65rem;
  font-size: 0.7rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  color: rgb(71, 85, 105);
}

.listing-card {
  cursor: pointer;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 1rem;
  transition: all 0.2s ease;
}

.listing-card:hover {
  border-color: rgba(20, 184, 166, 0.34);
}

.listing-badge {
  flex-shrink: 0;
  border-radius: 0.65rem;
  background: rgba(241, 245, 249, 0.98);
  padding: 0.45rem 0.7rem;
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgb(71, 85, 105);
}

.listing-badge-interview {
  background: rgba(223, 247, 241, 0.94);
  color: var(--dash-teal-deep);
}

.floating-chat-button {
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 40;
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.9rem;
  border: 1px solid #d1d5db;
  background: #0f766e;
  padding: 0.9rem 1.2rem;
  font-size: 0.86rem;
  font-weight: 900;
  color: white;
  transition: background-color 0.18s ease, border-color 0.18s ease;
}

.floating-chat-button:hover {
  background: #0d9488;
  border-color: #99f6e4;
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }
</style>
