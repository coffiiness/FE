<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import ScheduleListModal from '@/components/schedule/ScheduleListModal.vue'
import ScheduleCreateModal from '@/components/schedule/ScheduleCreateModal.vue'
import ScheduleDetailDrawer from '@/components/schedule/ScheduleDetailDrawer.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useRoute, useRouter } from 'vue-router'
import { useNotificationStore } from '@/stores/notification'
import { useScheduleStore } from '@/stores/schedule'
import { storeToRefs } from 'pinia'
import { meetingRoomApi } from '@/api/meetingRoom'
import { useModal } from '@/composables/useModal'

// 1. 상태 및 상수 정의
const currentView = ref('MONTH')
const viewOptions = [
  { label: '일', value: 'DAY' },
  { label: '주', value: 'WEEK' },
  { label: '월', value: 'MONTH' }
]

const koDays = ['일', '월', '화', '수', '목', '금', '토']
const timeSlots = Array.from({ length: 12 }, (_, i) => `${i + 9 < 10 ? '0' : ''}${i + 9}:00`)
const WEEK_SLOT_HEIGHT = 56

const isListModalOpen = ref(false)
const isFormModalOpen = ref(false)
const isDetailModalOpen = ref(false)
const { modal, openModal, onModalConfirm, onModalCancel } = useModal()

// Store
const scheduleStore = useScheduleStore()
const { schedules: allSchedules, loading } = storeToRefs(scheduleStore)
const { getToday } = scheduleStore

// 초기값: 진짜 오늘 날짜로 설정
const selectedDate = ref(getToday())
const selectedEventToEdit = ref(null)
const selectedEventDetail = ref(null)
const suppressDetailModalUntil = ref(0)
const targetDeleteId = ref(null)
const route = useRoute()
const router = useRouter()
const notificationStore = useNotificationStore()
const { acceptedSchedules } = storeToRefs(notificationStore)
const meetingRooms = ref([])

// [유틸] 현재 뷰 기준으로 API 조회 범위 계산
const getVisibleRange = () => {
  const curr = new Date(selectedDate.value)
  const year = curr.getFullYear()
  const month = curr.getMonth()
  // 월 뷰: 이전달 마지막주 ~ 다음달 첫주까지 포함
  const firstDay = new Date(year, month, 1)
  const startOffset = firstDay.getDay()
  const start = new Date(firstDay)
  start.setDate(start.getDate() - startOffset)

  const lastDay = new Date(year, month + 1, 0)
  const endOffset = 6 - lastDay.getDay()
  const end = new Date(lastDay)
  end.setDate(end.getDate() + endOffset)

  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { startDate: fmt(start), endDate: fmt(end) }
}

const loadSchedules = async () => {
  const { startDate, endDate } = getVisibleRange()
  await scheduleStore.fetchSchedules(startDate, endDate)
}

// [우측 사이드바] 실제 '오늘' 이후의 일정만 필터링
const upcomingEvents = computed(() => {
  const today = getToday()
  return allSchedules.value
      .filter(e => e.date >= today)
      .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime))
      .slice(0, 5)
})

// [월간 뷰용] 동적 캘린더 데이터 생성
const calendarDays = computed(() => {
  const currDate = new Date(selectedDate.value)
  const year = currDate.getFullYear()
  const month = currDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const startDayOfWeek = firstDayOfMonth.getDay()

  const days = []
  // 빈칸 채우기
  for(let i=0; i<startDayOfWeek; i++) {
    days.push({ date: '', dayDisplay: '', isCurrentMonth: false, events: [] })
  }

  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  for(let i=1; i<=lastDayOfMonth; i++) {
    const dayStr = i < 10 ? `0${i}` : `${i}`
    const monthStr = (month + 1) < 10 ? `0${month + 1}` : `${month + 1}`
    const dateStr = `${year}-${monthStr}-${dayStr}`

    const events = sortEvents(allSchedules.value.filter(e => e.date === dateStr))

    days.push({
      date: dateStr,
      dayDisplay: i,
      isCurrentMonth: true,
      dayOfWeek: new Date(year, month, i).getDay(),
      events: events
    })
  }

  while(days.length < 35) {
    days.push({ date: '', dayDisplay: '', isCurrentMonth: false, events: [] })
  }

  return days
})

// --- [Logic] 날짜 계산 및 이동 ---

const goToToday = () => {
  selectedDate.value = getToday()
}

const navigateDate = (direction) => {
  const date = new Date(selectedDate.value)

  if (currentView.value === 'WEEK') {
    date.setDate(date.getDate() + (direction * 7))
  } else if (currentView.value === 'DAY') {
    date.setDate(date.getDate() + direction)
  } else {
    date.setMonth(date.getMonth() + direction)
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  selectedDate.value = `${year}-${month}-${day}`
}

const currentMonthTitle = computed(() => {
  const date = new Date(selectedDate.value)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월`
})

const dayViewTitle = computed(() => {
  const date = new Date(selectedDate.value)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
})
const dayViewSubtitle = computed(() => {
  const date = new Date(selectedDate.value)
  return koDays[date.getDay()] + '요일'
})

// [주간 뷰] 이번 주 날짜 계산
const currentWeekDays = computed(() => {
  const curr = new Date(selectedDate.value)
  const dayOfWeek = curr.getDay()
  const startDay = new Date(curr)
  startDay.setDate(curr.getDate() - dayOfWeek)

  const week = []
  for (let i = 0; i < 7; i++) {
    const next = new Date(startDay)
    next.setDate(startDay.getDate() + i)

    const year = next.getFullYear()
    const month = String(next.getMonth() + 1).padStart(2, '0')
    const day = String(next.getDate()).padStart(2, '0')
    const fullDate = `${year}-${month}-${day}`

    week.push({
      dayName: koDays[i],
      dateNum: next.getDate(),
      fullDate: fullDate
    })
  }
  return week
})

const weekViewTitle = computed(() => {
  const start = currentWeekDays.value[0]
  const end = currentWeekDays.value[6]
  const startMonth = new Date(start.fullDate).getMonth() + 1
  const endMonth = new Date(end.fullDate).getMonth() + 1

  if (startMonth === endMonth) {
    return `${startMonth}월 ${start.dateNum}일 - ${end.dateNum}일`
  }
  return `${startMonth}월 ${start.dateNum}일 - ${endMonth}월 ${end.dateNum}일`
})

const currentCalendarTitle = computed(() => {
  if (currentView.value === 'DAY') return dayViewTitle.value
  if (currentView.value === 'WEEK') return currentMonthTitle.value
  return currentMonthTitle.value
})

const isAllDayEvent = (event) => {
  if (!event) return false
  return event.isAllDay === true || (
    String(event.startTime || '') === '00:00' &&
    String(event.endTime || '') === '00:00'
  )
}

const sortEvents = (events) => {
  return [...events].sort((a, b) => {
    if (isAllDayEvent(a) !== isAllDayEvent(b)) {
      return isAllDayEvent(a) ? -1 : 1
    }
    return String(a.startTime || '').localeCompare(String(b.startTime || ''))
  })
}

const currentListEvents = computed(() => {
  if (!selectedDate.value) return []
  return sortEvents(allSchedules.value.filter(e => e.date === selectedDate.value))
})

const getDayColor = (index) => {
  if (index === 0) return 'text-rose-500'
  if (index === 6) return 'text-blue-500'
  return 'text-slate-500'
}

const getEventsForDate = (date) => {
  return sortEvents(allSchedules.value.filter(e => e.date === date))
}

const getAllDayEventsForDate = (date) => {
  return sortEvents(allSchedules.value.filter(e => e.date === date && isAllDayEvent(e)))
}

const getTimedEventsForDate = (date) => {
  return sortEvents(allSchedules.value.filter(e => e.date === date && !isAllDayEvent(e)))
}

const maxAllDayEventsInWeek = computed(() => {
  return currentWeekDays.value.reduce((max, day) => {
    return Math.max(max, getAllDayEventsForDate(day.fullDate).length)
  }, 0)
})

const weekAllDayAreaHeight = computed(() => {
  return maxAllDayEventsInWeek.value > 0 ? `${maxAllDayEventsInWeek.value * 34 + 8}px` : '0px'
})

const getEventTimeLabel = (event) => isAllDayEvent(event) ? '종일' : event.startTime

const getEventMeridiemLabel = (event) => {
  if (isAllDayEvent(event)) return 'ALL DAY'
  const hour = Number(String(event.startTime || '').split(':')[0])
  if (!Number.isFinite(hour)) return 'TIME'
  return hour >= 12 ? 'PM' : 'AM'
}

const getEventStyle = (event, eventIndex = 0) => {
  const baseHour = 9
  const slotHeight = WEEK_SLOT_HEIGHT

  const startHour = parseInt(event.startTime.split(':')[0])
  const startMin = parseInt(event.startTime.split(':')[1])
  const endHour = parseInt(event.endTime.split(':')[0])
  const endMin = parseInt(event.endTime.split(':')[1])

  const top = ((startHour - baseHour) * slotHeight) + ((startMin / 60) * slotHeight)
  const durationHour = endHour - startHour
  const durationMin = endMin - startMin
  const height = (durationHour * slotHeight) + ((durationMin / 60) * slotHeight)

  return {
    top: `${top}px`,
    height: `${height}px`
  }
}

const getEventClass = (type) => {
  switch (type) {
    case 'INTERVIEW': return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    case 'MEETING': return 'bg-amber-50 text-amber-700 border-amber-100'
    case 'BUSINESS': return 'bg-emerald-50 text-emerald-700 border-emerald-100'
    case 'VACATION': return 'bg-rose-50 text-rose-700 border-rose-100'
    case 'OTHERS': return 'bg-slate-50 text-slate-700 border-slate-200'
    default: return 'bg-indigo-50 text-indigo-700 border-indigo-100'
  }
}

const getEventClassWeek = (type) => {
  switch (type) {
    case 'INTERVIEW': return 'bg-indigo-600 text-white border-indigo-800'
    case 'MEETING': return 'bg-amber-100 text-amber-800 border-amber-400'
    case 'BUSINESS': return 'bg-emerald-100 text-emerald-800 border-emerald-400'
    case 'VACATION': return 'bg-rose-100 text-rose-800 border-rose-400'
    case 'OTHERS': return 'bg-slate-100 text-slate-800 border-slate-400'
    default: return 'bg-indigo-600 text-white border-indigo-800'
  }
}

const getEventClassList = (type) => {
  switch (type) {
    case 'INTERVIEW': return 'bg-indigo-100 text-indigo-600'
    case 'MEETING': return 'bg-amber-100 text-amber-600'
    case 'BUSINESS': return 'bg-emerald-100 text-emerald-600'
    case 'VACATION': return 'bg-rose-100 text-rose-600'
    case 'OTHERS': return 'bg-slate-100 text-slate-600'
    default: return 'bg-indigo-100 text-indigo-600'
  }
}

const formatScheduleTypeLabel = (type) => {
  const labels = {
    INTERVIEW: '면접',
    MEETING: '회의',
    BUSINESS: '외근/출장',
    VACATION: '휴가',
    OTHERS: '기타'
  }

  return labels[type] || type
}

const DEFAULT_SAVE_ERROR_MESSAGE = '일정 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.'
const DEFAULT_DELETE_ERROR_MESSAGE = '일정 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.'

const toErrorText = (error) => {
  const payload = error?.response?.data

  if (!payload) {
    return error?.message || ''
  }

  if (typeof payload === 'string') return payload
  if (typeof payload?.message === 'string') return payload.message
  if (typeof payload?.error === 'string') return payload.error
  if (typeof payload?.error?.message === 'string') return payload.error.message
  if (typeof payload?.error?.detail === 'string') return payload.error.detail
  if (typeof payload?.error?.data?.message === 'string') return payload.error.data.message
  if (Array.isArray(payload?.errors)) {
    const first = payload.errors[0]
    if (typeof first === 'string') return first
    if (typeof first?.message === 'string') return first.message
  }

  return ''
}

const sanitizeErrorMessage = (message) => {
  const value = String(message || '').trim()
  if (!value) return ''

  const hasLocalhost = /https?:\/\/localhost[:/]?\d*/i.test(value) || /\blocalhost\b/i.test(value)
  const hasTechnicalTrace = /(AxiosError|Network Error|Request failed with status code|ECONNREFUSED|ETIMEDOUT|XMLHttpRequest)/i.test(value)

  if (hasLocalhost || hasTechnicalTrace) return ''
  if (value.length > 180) return ''

  return value
}

const toScheduleErrorMessage = (error, action = 'save') => {
  const status = error?.response?.status
  const code = error?.response?.data?.error?.code
  const extracted = toErrorText(error)
  const cleanMessage = sanitizeErrorMessage(extracted)

  if (/workspace is missing|create or join a workspace/i.test(extracted)) {
    return '워크스페이스가 없습니다. 워크스페이스를 생성하거나 초대를 수락해 주세요.'
  }

  if (status === 401 || code === 'E401') {
    return '로그인 정보가 만료되었거나 권한이 없습니다. 다시 로그인 후 시도해 주세요.'
  }

  if (status === 403 || code === 'E403') {
    return '해당 일정에 대한 권한이 없습니다.'
  }

  if (status === 404 || code === 'E404') {
    return action === 'delete'
      ? '삭제할 일정을 찾을 수 없습니다.'
      : '수정할 일정을 찾을 수 없습니다.'
  }

  if (status === 409 || code === 'E409') {
    return '같은 시간대에 충돌하는 일정이 있습니다. 시간을 변경해 주세요.'
  }

  if (status === 400 || code === 'E400') {
    if (/workspace|tenant|member/i.test(extracted)) {
      return '워크스페이스 정보가 올바르지 않습니다. 다시 로그인 후 시도해 주세요.'
    }

    if (action === 'delete') {
      return cleanMessage || '이미 삭제되었거나 삭제할 수 없는 일정입니다.'
    }

    return cleanMessage || '입력값을 확인해 주세요. 날짜와 시작/종료 시간을 다시 확인해 주세요.'
  }

  if (!error?.response) {
    return '서버에 연결할 수 없습니다. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.'
  }

  if (cleanMessage) {
    return cleanMessage
  }

  return action === 'delete' ? DEFAULT_DELETE_ERROR_MESSAGE : DEFAULT_SAVE_ERROR_MESSAGE
}

const openAlertModal = ({ title, message, type = 'warning' }) => {
  openModal({
    title,
    message,
    type,
    showCancel: false,
    confirmText: '확인'
  })
}


// --- [Events] ---

const clearConsumedScheduleQuery = async ({ clearDate = false } = {}) => {
  const hasScheduleQuery = typeof route.query.scheduleId === 'string' && route.query.scheduleId.length > 0
  const hasDateQuery = typeof route.query.date === 'string' && route.query.date.length > 0

  if (!hasScheduleQuery && (!clearDate || !hasDateQuery)) {
    return
  }

  const nextQuery = { ...route.query }
  delete nextQuery.scheduleId

  if (clearDate) {
    delete nextQuery.date
  }

  await router.replace({ query: nextQuery })
}

const handleDateClick = async (date) => {
  if (!date) return

  await clearConsumedScheduleQuery({ clearDate: true })
  selectedDate.value = date
  isDetailModalOpen.value = false
  selectedEventDetail.value = null
  isListModalOpen.value = true
}

const openDetailModal = async (event) => {
  if (Date.now() < suppressDetailModalUntil.value) {
    return
  }

  try {
    const detail = await scheduleStore.getScheduleDetail(event.id)
    const resolvedEvent = detail ? { ...event, ...detail } : event
    const room = getRoomInfo(resolvedEvent)
    selectedEventDetail.value = { ...resolvedEvent, room }
    isDetailModalOpen.value = true
  } catch (error) {
    console.error('일정 상세 조회 실패:', error)
    const room = getRoomInfo(event)
    selectedEventDetail.value = { ...event, room }
    isDetailModalOpen.value = true
  }
}

// 알림에서 넘어온 일정 ID로 상세 모달을 엽니다.
const openScheduleFromRouteQuery = async () => {
  const scheduleId = Number(route.query.scheduleId)
  if (Number.isNaN(scheduleId)) {
    return
  }

  const target = allSchedules.value.find((event) => event.id === scheduleId)
  if (!target) {
    await clearConsumedScheduleQuery()
    return
  }

  await openDetailModal(target)
  await clearConsumedScheduleQuery()
}

const mergeAcceptedSchedules = (items) => {
  items.forEach((item) => {
    if (!allSchedules.value.some((e) => e.id === item.id)) {
      scheduleStore.addSchedule(item)
    }
  })
}

onMounted(async () => {
  const queryDate = typeof route.query.date === 'string' && route.query.date ? route.query.date : null
  if (queryDate) {
    selectedDate.value = queryDate
  }

  await Promise.all([loadSchedules(), loadMeetingRooms()])
  await openScheduleFromRouteQuery()
})

watch(
  acceptedSchedules,
  (value) => {
    mergeAcceptedSchedules(value)
  },
  { deep: true, immediate: true }
)

// 날짜/뷰 변경 시 API 재조회
watch(
  () => selectedDate.value,
  async () => {
    await loadSchedules()
    await openScheduleFromRouteQuery()
  }
)

watch(
  () => [route.query.date, route.query.scheduleId],
  ([dateQuery, scheduleIdQuery], [previousDateQuery, previousScheduleIdQuery]) => {
    if (dateQuery === previousDateQuery && scheduleIdQuery === previousScheduleIdQuery) {
      return
    }

    if (typeof dateQuery === 'string' && dateQuery && dateQuery !== selectedDate.value) {
      selectedDate.value = dateQuery
      return
    }

    void openScheduleFromRouteQuery()
  }
)

const openCreateForm = async (date = null) => {
  const loaded = await ensureMeetingRoomsLoaded()
  if (!loaded) {
    openAlertModal({
      title: '회의실 목록 조회 실패',
      message: '회의실 목록을 불러오지 못했습니다. 회의실 선택 없이 일정 생성은 가능합니다.'
    })
  }

  selectedDate.value = date || selectedDate.value
  selectedEventToEdit.value = null
  isFormModalOpen.value = true
}

const openEditForm = async (event) => {
  if (event?.interviewScheduleId) {
    return
  }

  const loaded = await ensureMeetingRoomsLoaded()
  if (!loaded) {
    openAlertModal({
      title: '회의실 목록 조회 실패',
      message: '회의실 목록을 불러오지 못했습니다. 회의실 선택 없이도 일정 수정은 가능합니다.'
    })
  }

  try {
    const detail = await scheduleStore.getScheduleDetail(event.id)
    selectedEventToEdit.value = detail ? { ...event, ...detail } : event
  } catch (error) {
    console.error('일정 상세 조회 실패:', error)
    selectedEventToEdit.value = event
  }

  isDetailModalOpen.value = false
  isFormModalOpen.value = true
}

const handleSave = async (formData) => {
  try {
    if (formData.id) {
      await scheduleStore.updateSchedule(formData.id, formData)
    } else {
      await scheduleStore.createSchedule(formData)
    }

    suppressDetailModalUntil.value = Date.now() + 500
    isFormModalOpen.value = false
    isListModalOpen.value = false
    isDetailModalOpen.value = false
    selectedEventToEdit.value = null
    selectedEventDetail.value = null
    await loadSchedules()

    openAlertModal({
      title: '일정 저장 완료',
      message: '일정이 성공적으로 저장되었습니다.',
      type: 'success'
    })
  } catch (err) {
    const detail = toErrorText(err)
    console.error('일정 저장 실패:', detail || err?.message, err)

    openAlertModal({
      title: '일정 저장 실패',
      message: toScheduleErrorMessage(err, 'save'),
      type: 'warning'
    })
  }
}

const openDeleteConfirm = (id) => {
  const targetEvent = allSchedules.value.find((event) => event.id === id)
  if (targetEvent?.interviewScheduleId) {
    return
  }

  isDetailModalOpen.value = false
  targetDeleteId.value = id

  openModal({
    title: '일정 삭제',
    message: '정말로 이 일정을 삭제하시겠습니까? 삭제된 데이터는 복구할 수 없습니다.',
    type: 'danger',
    showCancel: true,
    confirmText: '삭제하기',
    cancelText: '취소',
    onConfirm: confirmDelete,
    onCancel: () => {
      targetDeleteId.value = null
    }
  })
}

const confirmDelete = async () => {
  const scheduleId = targetDeleteId.value
  targetDeleteId.value = null

  if (!scheduleId) {
    return
  }

  try {
    await scheduleStore.deleteSchedule(scheduleId)
    isFormModalOpen.value = false
    await loadSchedules()
  } catch (err) {
    const detail = toErrorText(err)
    console.error('일정 삭제 실패:', detail || err?.message, err)

    openAlertModal({
      title: '일정 삭제 실패',
      message: toScheduleErrorMessage(err, 'delete'),
      type: 'warning'
    })
  }
}


const loadMeetingRooms = async () => {
  try {
    const response = await meetingRoomApi.list()
    const data = response?.data?.data
    meetingRooms.value = Array.isArray(data) ? data : []
    return true
  } catch (error) {
    const detail = toErrorText(error)
    console.error('회의실 목록 조회 실패:', detail || error?.message, error)
    meetingRooms.value = []
    return false
  }
}

const ensureMeetingRoomsLoaded = async () => {
  if (meetingRooms.value.length > 0) return true
  return await loadMeetingRooms()
}

const getRoomInfo = (schedule) => {
  const roomId = Number(schedule?.roomId)
  if (!Number.isFinite(roomId)) return null

  const room = meetingRooms.value.find((item) => Number(item.id) === roomId)
  if (!room) return null

  return {
    id: room.id,
    name: room.name,
    floor: room.location ?? room.floor ?? '-',
    capacity: room.capacity
  }
}

// Google Calendar 연동
const isGoogleConnected = ref(localStorage.getItem('isGoogleCalendarConnected') === 'true')
const googleConnectedEmail = ref(localStorage.getItem('googleCalendarEmail') || '')

const connectGoogleCalendar = () => {
  const clientId = '553048700196-ojj8o5cgbq8d76q18khbkfh4t191mvoc.apps.googleusercontent.com'
  const redirectUri = window.location.origin + '/auth/callback'
  const scope = 'https://www.googleapis.com/auth/calendar openid email profile'
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`
  
  window.location.href = googleAuthUrl
}

const disconnectGoogleCalendar = () => {
  openModal({
    title: '연동 해제',
    message: '정말로 구글 캘린더 연동을 해제하시겠습니까?',
    type: 'danger',
    showCancel: true,
    confirmText: '해제하기',
    cancelText: '취소',
    onConfirm: confirmDisconnectGoogleCalendar
  })
}

const confirmDisconnectGoogleCalendar = () => {
  localStorage.removeItem('isGoogleCalendarConnected')
  localStorage.removeItem('googleCalendarEmail')
  isGoogleConnected.value = false
  googleConnectedEmail.value = ''

  openAlertModal({
    title: '해제 완료',
    message: '구글 캘린더 연동이 성공적으로 해제되었습니다.',
    type: 'success'
  })
}

</script>

<template>
  <div class="schedule-workbench min-h-screen px-6 pb-8 pt-3 font-sans text-slate-600">
    <div class="schedule-layout">
      <section class="schedule-surface">
        <div class="schedule-surface__head">
          <div>
            <h2 class="surface-title">{{ currentCalendarTitle }}</h2>
          </div>

          <div class="surface-head-actions">
            <div class="view-switch">
              <button
                v-for="opt in viewOptions"
                :key="opt.value"
                type="button"
                class="view-switch__button"
                :class="{ 'view-switch__button--active': currentView === opt.value }"
                @click="currentView = opt.value"
              >
                {{ opt.label }}
              </button>
            </div>

            <div class="surface-head-nav">
              <button type="button" class="icon-button" @click="navigateDate(-1)">
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button type="button" class="toolbar-button toolbar-button-subtle" @click="goToToday">오늘</button>
              <button type="button" class="icon-button" @click="navigateDate(1)">
                <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              class="toolbar-button toolbar-button-primary"
              @click="openCreateForm(getToday())"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
              </svg>
              일정 생성
            </button>
          </div>
        </div>

        <div v-if="currentView === 'MONTH'" class="flex h-full flex-col">
          <div class="month-weekdays">
            <div
              v-for="(day, idx) in koDays"
              :key="day"
              class="month-weekdays__item"
              :class="getDayColor(idx)"
            >
              {{ day }}
            </div>
          </div>

          <div class="month-grid">
            <div
              v-for="(cell, index) in calendarDays"
              :key="index"
              class="month-cell"
              :class="{
                'month-cell--muted': !cell.isCurrentMonth,
                'month-cell--today': cell.date === getToday(),
                'month-cell--last': (index + 1) % 7 === 0
              }"
              @click="cell.isCurrentMonth && handleDateClick(cell.date)"
            >
              <div class="month-cell__head">
                <span
                  class="month-cell__day"
                :class="{
                    'month-cell__day--today': cell.date === getToday(),
                    'month-cell__day--sunday': cell.dayOfWeek === 0 && cell.date !== getToday(),
                    'month-cell__day--saturday': cell.dayOfWeek === 6 && cell.date !== getToday(),
                    'opacity-0': !cell.isCurrentMonth
                  }"
                >
                  {{ cell.dayDisplay }}
                </span>
                <span v-if="cell.events.length" class="month-cell__count">{{ cell.events.length }}</span>
              </div>

              <div v-if="cell.events.length" class="month-cell__events">
                <button
                  v-for="evt in cell.events.slice(0, 3)"
                  :key="evt.id"
                  type="button"
                  class="month-event-chip"
                  :class="getEventClass(evt.type)"
                  @click.stop="openDetailModal(evt)"
                >
                  <span class="month-event-chip__time">{{ getEventTimeLabel(evt) }}</span>
                  <span class="month-event-chip__title truncate">{{ evt.title }}</span>
                </button>
                <div v-if="cell.events.length > 3" class="month-cell__more">
                  +{{ cell.events.length - 3 }}개 더 보기
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="currentView === 'WEEK'" class="week-shell custom-scrollbar">
          <div class="week-header-grid">
            <div class="week-header-grid__time"></div>
            <button
              v-for="(day, idx) in currentWeekDays"
              :key="day.fullDate"
              type="button"
              class="week-day-button"
              @click="handleDateClick(day.fullDate)"
            >
              <span class="week-day-button__label" :class="getDayColor(idx)">{{ day.dayName }}</span>
              <span
                class="week-day-button__date"
                :class="{
                  'week-day-button__date--today': day.fullDate === getToday(),
                  'week-day-button__date--selected': day.fullDate === selectedDate && day.fullDate !== getToday()
                }"
              >
                {{ day.dateNum }}
              </span>
            </button>
          </div>

          <div v-if="maxAllDayEventsInWeek > 0" class="week-all-day-grid">
            <div class="week-all-day-grid__label">종일</div>
            <div
              v-for="day in currentWeekDays"
              :key="`all-day-${day.fullDate}`"
              class="week-all-day-grid__column"
              :style="{ minHeight: weekAllDayAreaHeight }"
            >
              <button
                v-for="evt in getAllDayEventsForDate(day.fullDate)"
                :key="evt.id"
                type="button"
                class="week-all-day-chip"
                :class="getEventClassWeek(evt.type)"
                @click.stop="openDetailModal(evt)"
              >
                <span class="font-black opacity-85">종일</span>
                <span class="truncate">{{ evt.title }}</span>
              </button>
            </div>
          </div>

          <div class="week-time-grid">
            <div class="week-time-grid__times">
              <div v-for="time in timeSlots" :key="time" class="week-time-grid__time-label">
                {{ time }}
              </div>
            </div>

            <div class="week-time-grid__columns">
              <div
                v-for="(day, dayIdx) in currentWeekDays"
                :key="dayIdx"
                class="week-time-grid__day"
              >
                <div v-for="time in timeSlots" :key="time" class="week-time-grid__slot"></div>

                <button
                  v-for="(evt, eventIndex) in getTimedEventsForDate(day.fullDate)"
                  :key="evt.id"
                  type="button"
                  class="week-event"
                  :class="getEventClassWeek(evt.type)"
                  :style="getEventStyle(evt, eventIndex)"
                  @click.stop="openDetailModal(evt)"
                >
                  <span class="text-[10px] font-black opacity-85">{{ getEventTimeLabel(evt) }}</span>
                  <span class="truncate text-[11px] font-black">{{ evt.title }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="day-agenda custom-scrollbar">
          <div v-if="currentListEvents.length === 0" class="agenda-empty-state">
            <div class="agenda-empty-state__icon">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p class="text-sm font-semibold text-slate-500">이 날짜에는 등록된 일정이 없습니다.</p>
            <button type="button" class="toolbar-button toolbar-button-subtle mt-3" @click="openCreateForm(selectedDate)">
              새 일정 만들기
            </button>
          </div>

          <div v-else class="agenda-list">
            <button
              v-for="evt in currentListEvents"
              :key="evt.id"
              type="button"
              class="agenda-row"
              @click="openDetailModal(evt)"
            >
              <div class="agenda-row__time">
                <span class="agenda-row__time-main">{{ getEventTimeLabel(evt) }}</span>
                <span class="agenda-row__time-sub">{{ getEventMeridiemLabel(evt) }}</span>
              </div>
              <div class="agenda-row__body">
                <div class="agenda-row__topline">
                  <span class="agenda-type-chip" :class="getEventClassList(evt.type)">
                    {{ formatScheduleTypeLabel(evt.type) }}
                  </span>
                  <span class="text-[11px] text-slate-400">{{ evt.date }}</span>
                </div>
                <h4 class="truncate text-sm font-black text-slate-900">{{ evt.title }}</h4>
                <p class="truncate text-xs text-slate-500">{{ evt.description || '설명이 없습니다.' }}</p>
              </div>
            </button>
          </div>
        </div>
      </section>

      <aside class="schedule-sidebar">
        <section class="sidebar-card">
          <div class="sidebar-card__head">
            <div>
              <h3 class="text-lg font-black text-slate-950">다가오는 일정</h3>
            </div>
            <span class="sidebar-count-badge">{{ upcomingEvents.length }}</span>
          </div>

          <div class="sidebar-list custom-scrollbar">
            <button
              v-for="event in upcomingEvents"
              :key="event.id"
              type="button"
              class="sidebar-event"
              @click="openDetailModal(event)"
            >
              <div class="sidebar-event__head">
                <span class="agenda-type-chip" :class="getEventClassList(event.type)">
                  {{ formatScheduleTypeLabel(event.type) }}
                </span>
                <span class="text-[11px] text-slate-400">{{ event.date }}</span>
              </div>
              <p class="truncate text-sm font-black text-slate-900">{{ event.title }}</p>
              <p class="mt-1 text-xs text-slate-500">{{ event.time }}</p>
            </button>

            <div v-if="upcomingEvents.length === 0" class="sidebar-empty">
              다가오는 일정이 없습니다.
            </div>
          </div>
        </section>

        <section class="sidebar-card sidebar-card-sync">
          <div class="sidebar-card__head items-start">
            <div>
              <div class="sync-title-row">
                <span class="google-calendar-mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect x="3" y="4" width="18" height="17" rx="4" fill="white" stroke="#D7E0EA" />
                    <path d="M7 3.5V7" stroke="#4285F4" stroke-width="2" stroke-linecap="round" />
                    <path d="M17 3.5V7" stroke="#34A853" stroke-width="2" stroke-linecap="round" />
                    <path d="M4 9.5H20" stroke="#EA4335" stroke-width="2" />
                    <rect x="6.5" y="11.5" width="11" height="7" rx="2" fill="#4285F4" />
                    <text x="12" y="17" text-anchor="middle" font-size="6.5" font-weight="800" fill="white">31</text>
                  </svg>
                </span>
                <h3 class="text-lg font-black text-slate-950">Google Calendar</h3>
              </div>
              <p v-if="isGoogleConnected && googleConnectedEmail" class="mt-1 truncate text-xs text-slate-500">
                {{ googleConnectedEmail }}
              </p>
            </div>

            <span v-if="isGoogleConnected" class="sync-status sync-status--connected">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              연동됨
            </span>
            <span v-else class="sync-status sync-status--idle">
              미연동
            </span>
          </div>

          <p class="sync-description text-sm leading-6 text-slate-500">
            {{ isGoogleConnected
              ? '연결된 캘린더와 일정이 자동으로 동기화됩니다.'
              : '구글 캘린더와 연결해 외부 일정과 함께 관리할 수 있습니다.' }}
          </p>

          <button
            type="button"
            class="toolbar-button mt-1 w-full justify-center"
            :class="isGoogleConnected ? 'toolbar-button-subtle' : 'toolbar-button-primary'"
            @click="isGoogleConnected ? disconnectGoogleCalendar() : connectGoogleCalendar()"
          >
            {{ isGoogleConnected ? '연동 해제' : '구글 캘린더 연동하기' }}
          </button>
        </section>
      </aside>
    </div>

    <ScheduleDetailDrawer
      :is-open="isDetailModalOpen"
      :event="selectedEventDetail || {}"
      :show-actions="!selectedEventDetail?.interviewScheduleId"
      @close="isDetailModalOpen = false"
      @edit="openEditForm"
      @delete="openDeleteConfirm"
    />

    <ScheduleListModal
      :isOpen="isListModalOpen"
      :date="selectedDate"
      :events="currentListEvents"
      @close="isListModalOpen = false"
      @add="() => openCreateForm(selectedDate)"
      @edit="openDetailModal"
      @delete="openDeleteConfirm"
    />
    <ScheduleCreateModal
      :isOpen="isFormModalOpen"
      :initialDate="selectedDate"
      :initialData="selectedEventToEdit"
      :roomOptions="meetingRooms"
      :existingSchedules="allSchedules"
      @close="isFormModalOpen = false"
      @save="handleSave"
    />
    <ConfirmModal
      :show="modal.show"
      :title="modal.title"
      :message="modal.message"
      :type="modal.type"
      :show-cancel="modal.showCancel"
      :confirm-text="modal.confirmText"
      :cancel-text="modal.cancelText"
      @confirm="onModalConfirm"
      @cancel="onModalCancel"
    />
  </div>
</template>

<style scoped>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

.schedule-workbench {
  font-family: 'Pretendard Variable', 'Pretendard', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f7faf9;
}

.schedule-page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  margin-bottom: 0.9rem;
}

.schedule-page-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.schedule-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}

@media (min-width: 1280px) {
  .schedule-layout {
    grid-template-columns: minmax(0, 1fr) 320px;
    align-items: start;
  }
}

.schedule-surface,
.sidebar-card {
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
}

.schedule-surface {
  min-height: 760px;
  overflow: hidden;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
}

.schedule-surface__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  column-gap: 1rem;
  row-gap: 0.5rem;
  padding: 0 0 0.25rem;
}

.surface-title {
  font-size: 1.3rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1;
  color: rgb(15, 23, 42);
}

.surface-head-actions {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-left: auto;
  align-self: start;
}

.surface-head-nav {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

@media (max-width: 1024px) {
  .schedule-surface__head {
    grid-template-columns: 1fr;
  }

  .surface-head-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
    margin-left: 0;
  }
}

.view-switch {
  display: inline-flex;
  gap: 0.15rem;
  padding: 0.15rem;
  border-radius: 8px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.92);
}

.view-switch__button {
  border-radius: 6px;
  padding: 0.5rem 0.9rem;
  font-size: 0.75rem;
  font-weight: 900;
  color: rgb(100, 116, 139);
  transition: all 0.18s ease;
}

.view-switch__button--active {
  background: rgb(20, 184, 166);
  color: white;
}

.toolbar-button,
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 900;
  transition: all 0.18s ease;
}

.toolbar-button {
  padding: 0.72rem 0.95rem;
}

.icon-button {
  height: 2.1rem;
  width: 2.1rem;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.96);
  color: rgb(71, 85, 105);
}

.icon-button:hover {
  border-color: rgba(15, 118, 110, 0.28);
  color: rgb(15, 118, 110);
}

.toolbar-button-primary {
  border: 1px solid rgba(15, 118, 110, 0.92);
  background: rgb(15, 118, 110);
  color: white;
}

.toolbar-button-subtle {
  border: 1px solid rgba(20, 184, 166, 0.22);
  background: white;
  color: rgb(15, 118, 110);
}

.toolbar-button-primary:hover,
.toolbar-button-subtle:hover {
  filter: saturate(1.04);
}

.month-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(248, 250, 252, 0.52);
}

.month-weekdays__item {
  padding: 0.75rem 0;
  text-align: center;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.month-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-template-rows: repeat(5, minmax(118px, 1fr));
  border-top: 1px solid rgba(226, 232, 240, 0.88);
  border-left: 1px solid rgba(226, 232, 240, 0.88);
}

.month-cell {
  position: relative;
  min-height: 118px;
  border-right: 1px solid rgba(226, 232, 240, 0.84);
  border-bottom: 1px solid rgba(226, 232, 240, 0.84);
  padding: 0.75rem 0.7rem 0.65rem;
  transition: background 0.18s ease;
  cursor: pointer;
}

.month-cell:hover {
  background: rgba(248, 250, 252, 0.74);
}

.month-cell--muted {
  background: rgba(248, 250, 252, 0.42);
  cursor: default;
}

.month-cell--today {
  background: linear-gradient(180deg, rgba(240, 253, 250, 0.88), rgba(255, 255, 255, 0.9));
}

.month-cell--last {
  border-right: 0;
}

.month-cell__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.55rem;
}

.month-cell__day {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 1.75rem;
  min-width: 1.75rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 900;
  color: rgb(51, 65, 85);
}

.month-cell__day--today {
  background: rgb(20, 184, 166);
  border-radius: 9999px;
  color: white;
}

.month-cell__day--sunday {
  color: rgb(244, 63, 94);
}

.month-cell__day--saturday {
  color: rgb(99, 102, 241);
}

.month-cell__count {
  font-size: 0.65rem;
  font-weight: 900;
  color: rgb(100, 116, 139);
}

.month-cell__events {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}

.month-event-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  height: 1.75rem;
  padding: 0 0.55rem;
  border-radius: 4px;
  border: 0;
  border-left: 2px solid currentColor;
  font-size: 0.68rem;
  text-align: left;
  overflow: hidden;
}

.month-event-chip__time {
  flex-shrink: 0;
  font-weight: 900;
}

.month-event-chip__title {
  color: rgb(31, 41, 55);
  font-weight: 700;
}

.month-cell__more {
  padding-left: 0.15rem;
  font-size: 0.66rem;
  font-weight: 800;
  color: rgb(100, 116, 139);
}

.week-shell {
  height: 100%;
  overflow: auto;
}

.week-header-grid,
.week-all-day-grid,
.week-time-grid {
  display: grid;
  grid-template-columns: 68px repeat(7, minmax(0, 1fr));
}

.week-header-grid {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid rgba(226, 232, 240, 0.88);
  background: rgba(255, 255, 255, 0.96);
}

.week-header-grid__time {
  border-right: 1px solid rgba(226, 232, 240, 0.88);
}

.week-day-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.18rem;
  border-right: 1px solid rgba(226, 232, 240, 0.88);
  padding: 0.8rem 0 0.75rem;
  transition: background 0.16s ease;
}

.week-day-button:last-child {
  border-right: 0;
}

.week-day-button:hover {
  background: rgba(248, 250, 252, 0.72);
}

.week-day-button__label {
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.week-day-button__date {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2rem;
  min-width: 2rem;
  border-radius: 8px;
  font-size: 0.86rem;
  font-weight: 900;
  color: rgb(51, 65, 85);
}

.week-day-button__date--today {
  background: rgb(20, 184, 166);
  color: white;
}

.week-day-button__date--selected {
  border: 1px solid rgba(15, 118, 110, 0.3);
  color: rgb(15, 118, 110);
}

.week-all-day-grid {
  border-bottom: 1px solid rgba(226, 232, 240, 0.88);
}

.week-all-day-grid__label {
  border-right: 1px solid rgba(226, 232, 240, 0.88);
  padding-top: 0.65rem;
  text-align: center;
  font-size: 0.68rem;
  font-weight: 900;
  color: rgb(100, 116, 139);
  background: rgba(248, 250, 252, 0.72);
}

.week-all-day-grid__column {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  border-right: 1px solid rgba(226, 232, 240, 0.88);
  padding: 0.35rem;
}

.week-all-day-grid__column:last-child {
  border-right: 0;
}

.week-all-day-chip {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
  border-radius: 8px;
  border-left-width: 3px;
  padding: 0.4rem 0.45rem;
  text-align: left;
  font-size: 0.66rem;
}

.week-time-grid__times {
  background: rgba(248, 250, 252, 0.52);
  border-right: 1px solid rgba(226, 232, 240, 0.88);
}

.week-time-grid__time-label {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  height: 56px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.84);
  padding-top: 0.4rem;
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.04em;
  color: rgb(100, 116, 139);
}

.week-time-grid__columns {
  display: grid;
  grid-column: span 7 / span 7;
  grid-template-columns: repeat(7, minmax(0, 1fr));
}

.week-time-grid__day {
  position: relative;
  border-right: 1px solid rgba(226, 232, 240, 0.84);
}

.week-time-grid__day:last-child {
  border-right: 0;
}

.week-time-grid__slot {
  height: 56px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.84);
}

.week-event {
  position: absolute;
  left: 0.18rem;
  right: 0.18rem;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  overflow: hidden;
  border-left-width: 3px;
  border-radius: 8px;
  padding: 0.35rem 0.42rem;
  text-align: left;
}

.day-agenda {
  height: 100%;
  overflow: auto;
  padding: 1rem 1.1rem 1.25rem;
}

.agenda-list {
  display: flex;
  flex-direction: column;
}

.agenda-row {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: 0.9rem;
  align-items: center;
  min-height: 74px;
  padding: 0.75rem 0.35rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.72);
  text-align: left;
  transition: background 0.16s ease;
}

.agenda-row:hover {
  background: rgba(248, 250, 252, 0.7);
}

.agenda-row__time {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  padding-right: 0.5rem;
  border-right: 1px solid rgba(226, 232, 240, 0.74);
}

.agenda-row__time-main {
  font-size: 0.92rem;
  font-weight: 900;
  color: rgb(15, 23, 42);
}

.agenda-row__time-sub {
  font-size: 0.62rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgb(100, 116, 139);
}

.agenda-row__body {
  min-width: 0;
}

.agenda-row__topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.35rem;
}

.agenda-type-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  padding: 0.34rem 0.65rem;
  font-size: 0.64rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.agenda-empty-state {
  display: flex;
  min-height: 240px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed rgba(203, 213, 225, 0.96);
  border-radius: 8px;
  background: rgba(248, 250, 252, 0.55);
}

.agenda-empty-state__icon {
  display: inline-flex;
  height: 3.1rem;
  width: 3.1rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgba(241, 245, 249, 0.95);
  color: rgb(148, 163, 184);
  margin-bottom: 0.85rem;
}

.schedule-sidebar {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.sidebar-card {
  padding: 1.2rem;
  border: 1px solid rgba(226, 232, 240, 0.92);
}

.sidebar-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.95rem;
}

.sidebar-count-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 2rem;
  min-width: 2rem;
  border-radius: 9999px;
  background: rgba(223, 247, 241, 0.95);
  color: rgb(15, 118, 110);
  font-size: 0.78rem;
  font-weight: 900;
}

.sidebar-list {
  display: flex;
  max-height: 360px;
  flex-direction: column;
  gap: 0.65rem;
  overflow: auto;
}

.sidebar-event {
  border: 0;
  border-radius: 8px;
  background: rgb(249, 250, 251);
  padding: 0.85rem 0.9rem;
  text-align: left;
  transition: all 0.16s ease;
}

.sidebar-event:hover {
  background: rgb(243, 244, 246);
}

.sidebar-event__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.45rem;
}

.sidebar-empty {
  display: flex;
  min-height: 140px;
  align-items: center;
  justify-content: center;
  border: 1px dashed rgba(203, 213, 225, 0.9);
  border-radius: 8px;
  font-size: 0.82rem;
  color: rgb(100, 116, 139);
}

.sidebar-card-sync {
  background: rgba(255, 255, 255, 0.96);
}

.sync-title-row {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.google-calendar-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.55rem;
  height: 1.55rem;
  flex-shrink: 0;
}

.google-calendar-mark svg {
  width: 100%;
  height: 100%;
}

.sync-description {
  margin-top: 0.85rem;
  margin-bottom: 1rem;
}

.sync-status {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border-radius: 9999px;
  padding: 0.34rem 0.65rem;
  font-size: 0.66rem;
  font-weight: 900;
}

.sync-status--connected {
  background: rgba(220, 252, 231, 0.95);
  color: rgb(22, 101, 52);
}

.sync-status--idle {
  background: rgba(241, 245, 249, 0.95);
  color: rgb(100, 116, 139);
}

.custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background: #94a3b8; }
</style>




