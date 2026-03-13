<script setup>
import { ref, onMounted, watch } from 'vue'
import BookingModal from '@/components/meeting-rooms/BookingModal.vue'
import BookingDetailModal from '@/components/meeting-rooms/BookingDetailModal.vue'
import RoomDetailModal from '@/components/meeting-rooms/RoomDetailModal.vue'
import CreateRoomModal from '@/components/meeting-rooms/CreateRoomModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { meetingRoomApi } from '@/api/meetingRoom'
import { scheduleApi } from '@/api/schedule'
import { recruitmentApi } from '@/api/recruitment'
import { useHrAccessGuard } from '@/composables/useHrAccessGuard'

const handleRoomConfirm = (roomData) => {
  if (editingRoom.value) {
    handleUpdateRoom(roomData)
  } else {
    handleCreateRoom(roomData)
  }
}

const defaultRooms = []
const roomColors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444', '#84cc16']
const parseFloor = (value) => {
  if (value === null || value === undefined) return 1
  const parsed = Number(String(value).replace(/[^0-9-]/g, ''))
  return Number.isFinite(parsed) ? parsed : 1
}

const parseCapacity = (value) => {
  const parsed = Number(String(value).replace(/[^0-9]/g, ''))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

const toViewRoom = (room, index = 0) => ({
  id: `r-${room.id}`,
  serverId: room.id,
  name: room.name,
  capacity: parseCapacity(room.capacity),
  floor: parseFloor(room.location),
  facilities: Array.isArray(room.facilities) && room.facilities.length ? room.facilities : ['WiFi'],
  description: room.description || '',
  color: room.color || roomColors[index % roomColors.length]
})

const rooms = ref([...defaultRooms])
const bookings = ref([])

const today = new Date()
const dateValue = ref(
  `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, '0')}-${`${today.getDate()}`.padStart(2, '0')}`
)
const hours = Array.from({ length: 13 }, (_, i) => i + 8)

const bookingModalOpen = ref(false)
const detailModalOpen = ref(false)
const roomDetailOpen = ref(false)
const createRoomOpen = ref(false)
const editingRoom = ref(null)
const successModalOpen = ref(false)
const errorModalOpen = ref(false)
const errorModalTitle = ref('')
const errorModalMessage = ref('')
const {
  memberType,
  loadMemberType
} = useHrAccessGuard()

const selectedRoom = ref(null)
const selectedBooking = ref(null)
const selectedDate = ref(null)
const selectedHour = ref(null)
const reservationTitleMap = ref({})
const reservationAttendeeMap = ref({})
const interviewReservationTitleMap = ref({})
const interviewReservationAttendeeMap = ref({})
const interviewReservationInterviewerMap = ref({})
const interviewReservationApplicantMap = ref({})
const interviewSlotTitleMap = ref({})

const RESERVATION_TITLE_MAP_KEY = 'meetingRoomReservationTitles'
const RESERVATION_ATTENDEE_MAP_KEY = 'meetingRoomReservationAttendees'
const INTERVIEW_SLOT_TITLE_MAP_KEY = 'meetingRoomInterviewSlotTitles'
const INTERVIEW_SLOT_INTERVIEWERS_MAP_KEY = 'meetingRoomInterviewSlotInterviewers'
const INTERVIEW_SLOT_APPLICANTS_MAP_KEY = 'meetingRoomInterviewSlotApplicants'

const loadReservationTitleMap = () => {
  try {
    const raw = localStorage.getItem(RESERVATION_TITLE_MAP_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    reservationTitleMap.value = parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    reservationTitleMap.value = {}
  }
}

const saveReservationTitleMap = () => {
  try {
    localStorage.setItem(RESERVATION_TITLE_MAP_KEY, JSON.stringify(reservationTitleMap.value))
  } catch {
    // ignore storage errors
  }
}

const loadReservationAttendeeMap = () => {
  try {
    const raw = localStorage.getItem(RESERVATION_ATTENDEE_MAP_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    reservationAttendeeMap.value = parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    reservationAttendeeMap.value = {}
  }
}

const saveReservationAttendeeMap = () => {
  try {
    localStorage.setItem(RESERVATION_ATTENDEE_MAP_KEY, JSON.stringify(reservationAttendeeMap.value))
  } catch {
    // ignore storage errors
  }
}

const loadInterviewSlotTitleMap = () => {
  try {
    const raw = localStorage.getItem(INTERVIEW_SLOT_TITLE_MAP_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    interviewSlotTitleMap.value = parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    interviewSlotTitleMap.value = {}
  }
}

const loadInterviewSlotParticipantMaps = () => {
  try {
    const raw = localStorage.getItem(INTERVIEW_SLOT_INTERVIEWERS_MAP_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    interviewReservationInterviewerMap.value =
      parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    interviewReservationInterviewerMap.value = {}
  }

  try {
    const raw = localStorage.getItem(INTERVIEW_SLOT_APPLICANTS_MAP_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    interviewReservationApplicantMap.value =
      parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    interviewReservationApplicantMap.value = {}
  }
}

const setReservationTitle = (reservationId, title) => {
  if (!reservationId || !title) return
  reservationTitleMap.value[String(reservationId)] = title
  saveReservationTitleMap()
}

const setReservationAttendees = (reservationId, attendees) => {
  if (!reservationId) return
  reservationAttendeeMap.value[String(reservationId)] = sanitizeAttendeeNames(attendees || [])
  saveReservationAttendeeMap()
}

const openErrorModal = (title, message) => {
  errorModalTitle.value = title
  errorModalMessage.value = message
  errorModalOpen.value = true
}

const pad2 = (n) => `${n}`.padStart(2, '0')
const toLocalDateTime = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
const parseDateOnly = (value) => {
  const [year, month, day] = String(value || '').split('-').map(Number)
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return new Date(value)
  }
  return new Date(year, month - 1, day, 0, 0, 0, 0)
}
const parseLocalDateTime = (value) => {
  if (value instanceof Date) return new Date(value.getTime())
  if (typeof value !== 'string') return new Date(value)

  const matched = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})(?::(\d{2}))?$/)
  if (matched) {
    const [, year, month, day, hour, minute, second = '00'] = matched
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      0
    )
  }
  return new Date(value)
}

const isPastReservationSlot = (dateValue, hour = null) => {
  if (!dateValue) return false
  const base = parseDateOnly(dateValue)
  if (Number.isFinite(hour)) {
    base.setHours(hour, 0, 0, 0)
    return base < new Date()
  }

  const endOfDay = new Date(base)
  endOfDay.setHours(23, 59, 59, 999)
  return endOfDay < new Date()
}

const toDateTimeKey = (meetingRoomId, startDatetime, endDatetime) => {
  const roomId = Number(meetingRoomId)
  const start = new Date(startDatetime).getTime()
  const end = new Date(endDatetime).getTime()
  if (!Number.isFinite(roomId) || Number.isNaN(start) || Number.isNaN(end)) return null
  return `${roomId}|${start}|${end}`
}

const toTimeOnlyKey = (startDatetime, endDatetime) => {
  const start = new Date(startDatetime).getTime()
  const end = new Date(endDatetime).getTime()
  if (Number.isNaN(start) || Number.isNaN(end)) return null
  return `${start}|${end}`
}

const parseNameTokens = (value) =>
  String(value || '')
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean)

const flattenNames = (raw) => {
  if (!raw) return []
  if (typeof raw === 'string') return parseNameTokens(raw)
  if (Array.isArray(raw)) return raw.flatMap((item) => flattenNames(item))
  if (typeof raw === 'object') {
    const direct = [
      raw.name,
      raw.userName,
      raw.memberName,
      raw.interviewerName,
      raw.applicantName,
      raw.displayName
    ]
    const nested = [raw.user?.name, raw.member?.name, raw.applicant?.name]
    return [...direct, ...nested].flatMap((item) => flattenNames(item))
  }
  return []
}

const uniqueNames = (names) => {
  const set = new Set()
  names.forEach((name) => {
    const normalized = String(name || '').trim()
    if (normalized) set.add(normalized)
  })
  return [...set]
}

const isUnknownAttendeeName = (name) => {
  const normalized = String(name || '').trim()
  return normalized.includes('알 수 없는') || normalized.startsWith('면접관#') || normalized.startsWith('지원자#')
}

const sanitizeAttendeeNames = (names) => uniqueNames(names).filter((name) => !isUnknownAttendeeName(name))

const removeOrganizerFromAttendees = (attendees, organizerName) => {
  const normalizedOrganizer = String(organizerName || '').trim()
  if (!normalizedOrganizer) {
    return sanitizeAttendeeNames(attendees)
  }
  return sanitizeAttendeeNames(attendees).filter((name) => name !== normalizedOrganizer)
}

const parseAttendeesFromText = (text) => {
  if (typeof text !== 'string' || !text.trim()) return []
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const prefixes = ['참석자:', '면접관:', '지원자:']
  const collected = []
  lines.forEach((line) => {
    const prefix = prefixes.find((p) => line.startsWith(p))
    if (!prefix) return
    collected.push(...parseNameTokens(line.replace(prefix, '')))
  })
  return uniqueNames(collected)
}

const parseNamesByPrefixes = (text, prefixes = []) => {
  if (typeof text !== 'string' || !text.trim()) return []
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const collected = []
  lines.forEach((line) => {
    const prefix = prefixes.find((p) => line.startsWith(p))
    if (!prefix) return
    collected.push(...parseNameTokens(line.replace(prefix, '')))
  })
  return uniqueNames(collected)
}

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
}

const getCurrentUserId = () => {
  const currentUser = getCurrentUser()
  const userId = Number(currentUser?.id)
  return Number.isFinite(userId) ? userId : null
}

const ensureHrMeetingRoomAction = (message) => {
  if (memberType.value === 'HR') {
    return true
  }

  openErrorModal('권한 없음', message)
  return false
}

const canDeleteBooking = (booking) => {
  if (!booking) return false
  const currentUserId = getCurrentUserId()
  const bookingUserId = Number(booking.userId)
  return (
    Number.isFinite(currentUserId) &&
    Number.isFinite(bookingUserId) &&
    currentUserId === bookingUserId &&
    !booking.interviewScheduleId
  )
}

const resolveOrganizerName = (reservation) => {
  const fromPayload =
    reservation?.organizerName ||
    reservation?.creatorName ||
    reservation?.hostName ||
    reservation?.userName ||
    reservation?.memberName

  if (fromPayload) return fromPayload

  const currentUser = getCurrentUser()
  const reservationUserId = Number(reservation?.userId)
  const currentUserId = Number(currentUser?.id)
  if (Number.isFinite(reservationUserId) && Number.isFinite(currentUserId) && reservationUserId === currentUserId) {
    return currentUser?.name || currentUser?.nickname || `user-${reservation.userId}`
  }
  return `user-${reservation.userId}`
}

const toErrorText = (error) => {
  const payload = error?.response?.data
  if (!payload) return error?.message || '알 수 없는 오류'
  if (typeof payload === 'string') return payload
  if (typeof payload?.message === 'string') return payload.message
  if (typeof payload?.error === 'string') return payload.error
  if (typeof payload?.error?.message === 'string') return payload.error.message
  if (typeof payload?.error?.detail === 'string') return payload.error.detail
  if (typeof payload?.data === 'string') return payload.data
  if (Array.isArray(payload?.errors)) {
    const first = payload.errors[0]
    if (typeof first === 'string') return first
    if (typeof first?.message === 'string') return first.message
  }
  try {
    return JSON.stringify(payload)
  } catch (e) {
    return '알 수 없는 오류'
  }
}

const toReservationErrorMessage = (error) => {
  const status = error?.response?.status
  const code = error?.response?.data?.error?.code
  if (status === 400 || code === 'E400') {
    return '이미 해당 시간에 예약이 있습니다. 다른 시간대로 다시 시도해 주세요.'
  }
  if (status === 401 || code === 'E401') {
    return '로그인 정보가 만료되었거나 권한이 없습니다. 다시 로그인 후 시도해 주세요.'
  }
  if (status === 409 || code === 'E409') {
    return '예약 충돌이 발생했습니다. 다른 시간대로 다시 시도해 주세요.'
  }
  return toErrorText(error) || '시간 중복이나 인증 정보를 확인해 주세요.'
}

const toDeleteRoomErrorMessage = (error) => {
  const status = error?.response?.status
  const code = error?.response?.data?.error?.code
  if (status === 400 || status === 409 || code === 'E400' || code === 'E409') {
    return '해당 회의실에 예정된 예약 또는 일정이 있어 삭제할 수 없습니다.'
  }
  return toErrorText(error) || '회의실 삭제에 실패했습니다.'
}

const getFullReservationRange = () => {
  const from = new Date(2000, 0, 1, 0, 0, 0)
  const to = new Date(3000, 0, 1, 0, 0, 0)
  return { from, to }
}

const toYearMonth = (dateString) => {
  const [y, m] = dateString.split('-').map(Number)
  return `${y}-${String(m).padStart(2, '0')}`
}

const formatDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const loadScheduleTitlesByReservationKey = async ({ from, to }) => {
  const startDate = formatDate(from)
  const inclusiveEnd = new Date(to.getTime())
  inclusiveEnd.setDate(inclusiveEnd.getDate() - 1)
  const endDate = formatDate(inclusiveEnd)

  try {
    const response = await scheduleApi.getSchedules(startDate, endDate)
    const items = Array.isArray(response?.data?.data) ? response.data.data : []
    const titleMap = {}

    items.forEach((item) => {
      const roomId = Number(item?.roomId)
      const title = String(item?.title || '').trim()
      if (!Number.isFinite(roomId) || !title || !item?.date || !item?.startTime || !item?.endTime) {
        return
      }

      const start = parseLocalDateTime(`${item.date}T${item.startTime}:00`)
      const end = parseLocalDateTime(`${item.date}T${item.endTime}:00`)
      const key = toDateTimeKey(roomId, start, end)
      if (!key) return
      titleMap[key] = title
    })

    return titleMap
  } catch (error) {
    console.error('Failed to load schedule title mapping:', error)
    return {}
  }
}

const loadInterviewReservationTitles = async (dateString = dateValue.value) => {
  try {
    const yearMonth = toYearMonth(dateString)
    const recruitmentsRes = await recruitmentApi.getRecruitments({ page: 0, size: 200 })
    const recruitments = Array.isArray(recruitmentsRes?.data?.data) ? recruitmentsRes.data.data : []

    const scheduleResults = await Promise.allSettled(
      recruitments.map((r) => recruitmentApi.getInterviewSchedules(r.id, yearMonth))
    )

    const nextMap = {}
    const nextAttendeeMap = {}
    const nextInterviewerMap = {}
    const nextApplicantMap = {}
    const timeOnlyBucket = {}
    scheduleResults.forEach((result, idx) => {
      if (result.status !== 'fulfilled') return
      const recruitment = recruitments[idx]
      const schedules = Array.isArray(result.value?.data?.data) ? result.value.data.data : []
      schedules.forEach((item) => {
        const scheduleId = Number(item?.id)
        const startRaw = item?.scheduledAt || item?.startDateTime || item?.startDatetime || item?.startAt
        if (!startRaw) return
        const startDate = new Date(startRaw)
        if (Number.isNaN(startDate.getTime())) return
        const duration = Number(item?.durationMinutes || 60)
        const endRaw = item?.endDateTime || item?.endDatetime || item?.endAt
        const endDate = endRaw ? new Date(endRaw) : new Date(startDate.getTime() + duration * 60000)
        const stageTitle = String(item?.title || '').trim()
        const recruitmentTitle = String(recruitment?.title || '').trim()
        const mergedTitle = [recruitmentTitle, stageTitle].filter(Boolean).join(' - ') || '면접 일정'
        const interviewerNames = sanitizeAttendeeNames(
          flattenNames([
            item?.interviewerName,
            item?.interviewerNames,
            item?.interviewerMemberName,
            item?.interviewerMemberNames,
            item?.interviewers
          ])
        )
        const applicantNames = sanitizeAttendeeNames(
          flattenNames([item?.applicantName, item?.applicantNames, item?.applicants])
        )
        const attendeeNamesFromApi = flattenNames([
          item?.interviewerName,
          item?.interviewerNames,
          item?.interviewerMemberName,
          item?.interviewerMemberNames,
          item?.interviewers,
          item?.applicantName,
          item?.applicantNames,
          item?.applicants
        ])
        const attendeeNamesFromMemo = parseAttendeesFromText(item?.description)
        const attendeeNames = attendeeNamesFromMemo.length
          ? attendeeNamesFromMemo
          : attendeeNamesFromApi
        const normalizedAttendees = sanitizeAttendeeNames(attendeeNames)
        if (Number.isFinite(scheduleId)) {
          nextMap[`schedule:${scheduleId}`] = mergedTitle
          nextAttendeeMap[`schedule:${scheduleId}`] = normalizedAttendees
          nextInterviewerMap[`schedule:${scheduleId}`] = interviewerNames
          nextApplicantMap[`schedule:${scheduleId}`] = applicantNames
        }

        const roomAndTimeKey = toDateTimeKey(
          item?.meetingRoomId || item?.roomId || item?.meeting_room_id,
          startDate,
          endDate
        )
        if (roomAndTimeKey) {
          nextMap[roomAndTimeKey] = mergedTitle
          nextAttendeeMap[roomAndTimeKey] = normalizedAttendees
          nextInterviewerMap[roomAndTimeKey] = interviewerNames
          nextApplicantMap[roomAndTimeKey] = applicantNames
          return
        }

        const timeOnlyKey = toTimeOnlyKey(startDate, endDate)
        if (!timeOnlyKey) return
        if (!timeOnlyBucket[timeOnlyKey]) timeOnlyBucket[timeOnlyKey] = new Set()
        timeOnlyBucket[timeOnlyKey].add(mergedTitle)
        if (!nextAttendeeMap[timeOnlyKey]) {
          nextAttendeeMap[timeOnlyKey] = normalizedAttendees
        }
        if (!nextInterviewerMap[timeOnlyKey]) {
          nextInterviewerMap[timeOnlyKey] = interviewerNames
        }
        if (!nextApplicantMap[timeOnlyKey]) {
          nextApplicantMap[timeOnlyKey] = applicantNames
        }
      })
    })

    Object.entries(timeOnlyBucket).forEach(([key, titles]) => {
      if (titles.size === 1) {
        nextMap[key] = [...titles][0]
      }
    })

    interviewReservationTitleMap.value = {
      ...interviewReservationTitleMap.value,
      ...nextMap
    }
    interviewReservationAttendeeMap.value = {
      ...interviewReservationAttendeeMap.value,
      ...nextAttendeeMap
    }
    interviewReservationInterviewerMap.value = {
      ...interviewReservationInterviewerMap.value,
      ...nextInterviewerMap
    }
    interviewReservationApplicantMap.value = {
      ...interviewReservationApplicantMap.value,
      ...nextApplicantMap
    }
  } catch (error) {
    interviewReservationTitleMap.value = {}
    interviewReservationAttendeeMap.value = {}
    console.error('면접 예약 제목 매핑 조회 실패:', error)
  }
}

const toViewBookingFromApi = (reservation, titleByReservationKey = {}) => {
  const reservationId = reservation?.id
  const organizer = resolveOrganizerName(reservation)
  const scheduleId = Number(reservation?.interviewScheduleId)
  const titleFromApi =
    reservation?.title || reservation?.meetingTitle || reservation?.subject || reservation?.name
  const titleFromLocal = reservationTitleMap.value[String(reservationId)]
  const attendeesFromLocal = reservationAttendeeMap.value[String(reservationId)] || []
  const roomAndTimeKey = toDateTimeKey(reservation?.meetingRoomId, reservation?.startDatetime, reservation?.endDatetime)
  const timeOnlyKey = toTimeOnlyKey(reservation?.startDatetime, reservation?.endDatetime)
  const titleFromScheduleId = Number.isFinite(scheduleId)
    ? interviewReservationTitleMap.value[`schedule:${scheduleId}`]
    : null
  const titleFromLocalInterview = roomAndTimeKey ? interviewSlotTitleMap.value[roomAndTimeKey] : null
  const titleFromSchedule = roomAndTimeKey ? titleByReservationKey[roomAndTimeKey] : null
  const titleFromInterview =
    titleFromScheduleId ||
    (roomAndTimeKey ? interviewReservationTitleMap.value[roomAndTimeKey] : null) ||
    (timeOnlyKey ? interviewReservationTitleMap.value[timeOnlyKey] : null)
  const attendeesFromPayload = flattenNames([
    reservation?.attendees,
    reservation?.attendeeNames,
    reservation?.participantNames,
    reservation?.interviewerName,
    reservation?.interviewerNames,
    reservation?.applicantName,
    reservation?.applicantNames
  ])
  const interviewersFromPayload = flattenNames([reservation?.interviewerName, reservation?.interviewerNames, reservation?.interviewers])
  const applicantsFromPayload = flattenNames([reservation?.applicantName, reservation?.applicantNames, reservation?.applicants])
  const attendeesFromInterview =
    (Number.isFinite(scheduleId) ? interviewReservationAttendeeMap.value[`schedule:${scheduleId}`] : null) ||
    (roomAndTimeKey ? interviewReservationAttendeeMap.value[roomAndTimeKey] : null) ||
    (timeOnlyKey ? interviewReservationAttendeeMap.value[timeOnlyKey] : null) ||
    []
  const interviewersFromInterview =
    (Number.isFinite(scheduleId) ? interviewReservationInterviewerMap.value[`schedule:${scheduleId}`] : null) ||
    (roomAndTimeKey ? interviewReservationInterviewerMap.value[roomAndTimeKey] : null) ||
    (timeOnlyKey ? interviewReservationInterviewerMap.value[timeOnlyKey] : null) ||
    []
  const applicantsFromInterview =
    (Number.isFinite(scheduleId) ? interviewReservationApplicantMap.value[`schedule:${scheduleId}`] : null) ||
    (roomAndTimeKey ? interviewReservationApplicantMap.value[roomAndTimeKey] : null) ||
    (timeOnlyKey ? interviewReservationApplicantMap.value[timeOnlyKey] : null) ||
    []
  const interviewersFromDescription = parseNamesByPrefixes(
    reservation?.description || reservation?.memo || '',
    ['면접관:']
  )
  const applicantsFromDescription = parseNamesByPrefixes(
    reservation?.description || reservation?.memo || '',
    ['지원자:']
  )
  const interviewers = sanitizeAttendeeNames(interviewersFromPayload).length
    ? sanitizeAttendeeNames(interviewersFromPayload)
    : sanitizeAttendeeNames(interviewersFromInterview).length
      ? sanitizeAttendeeNames(interviewersFromInterview)
      : sanitizeAttendeeNames(interviewersFromDescription)
  const applicants = sanitizeAttendeeNames(applicantsFromPayload).length
    ? sanitizeAttendeeNames(applicantsFromPayload)
    : sanitizeAttendeeNames(applicantsFromInterview).length
      ? sanitizeAttendeeNames(applicantsFromInterview)
      : sanitizeAttendeeNames(applicantsFromDescription)
  const attendeesFromInterviewResolved = sanitizeAttendeeNames(attendeesFromInterview)
  const attendeesFromDescription = parseAttendeesFromText(
    reservation?.description || reservation?.memo || ''
  )
  const attendees = sanitizeAttendeeNames(attendeesFromPayload).length
    ? removeOrganizerFromAttendees(attendeesFromPayload, organizer)
    : sanitizeAttendeeNames(attendeesFromLocal).length
      ? removeOrganizerFromAttendees(attendeesFromLocal, organizer)
    : attendeesFromInterviewResolved.length
      ? attendeesFromInterviewResolved
      : removeOrganizerFromAttendees(attendeesFromDescription, organizer)

  return {
    id: `b-${reservationId}`,
    serverId: reservationId,
    roomId: `r-${reservation.meetingRoomId}`,
    roomServerId: reservation.meetingRoomId,
    userId: Number(reservation?.userId),
    interviewScheduleId: Number(reservation?.interviewScheduleId) || null,
    title: titleFromLocalInterview || titleFromInterview || titleFromSchedule || titleFromApi || titleFromLocal || '회의실 예약',
    description: reservation?.description || reservation?.memo || '',
    organizer,
    interviewers,
    applicants,
    attendees,
    status: reservation.status === 'RESERVED' || reservation.status === 'ACTIVE' ? 'confirmed' : 'pending',
    startTime: new Date(reservation.startDatetime),
    endTime: new Date(reservation.endDatetime)
  }
}

const isVisibleReservationStatus = (status) => {
  const normalized = String(status || '').toUpperCase()
  return normalized === 'RESERVED' || normalized === 'ACTIVE'
}

const loadRoomsFromApi = async () => {
  try {
    const response = await meetingRoomApi.list()
    const data = response?.data?.data
    if (Array.isArray(data)) {
      rooms.value = data.map((room, index) => toViewRoom(room, index))
    }
  } catch (error) {
    console.error('회의실 목록 조회 실패:', error)
  }
}

const loadBookingsFromApi = async () => {
  try {
    loadInterviewSlotTitleMap()
    const { from, to } = getFullReservationRange()
    const response = await meetingRoomApi.listReservations({
      fromDatetime: toLocalDateTime(from),
      toDatetime: toLocalDateTime(to)
    })
    const data = response?.data?.data
    const titleByReservationKey = await loadScheduleTitlesByReservationKey({ from, to })
    if (Array.isArray(data)) {
      bookings.value = data
        .filter((reservation) => isVisibleReservationStatus(reservation?.status))
        .map((reservation) => toViewBookingFromApi(reservation, titleByReservationKey))
    }
  } catch (error) {
    const detail = toErrorText(error)
    console.error('회의실 예약 목록 조회 실패:', detail, error)
  }
}

onMounted(async () => {
  await loadMemberType().catch(() => {})
  loadReservationTitleMap()
  loadReservationAttendeeMap()
  loadInterviewSlotTitleMap()
  loadInterviewSlotParticipantMaps()
  await loadInterviewReservationTitles()
  await loadRoomsFromApi()
  await loadBookingsFromApi()
})

watch(
  dateValue,
  async () => {
    await loadInterviewReservationTitles()
    await loadBookingsFromApi()
  }
)

const handleTimeSlotClick = (roomId, hour) => {
  if (isPastReservationSlot(dateValue.value, hour)) {
    openErrorModal('예약 불가', '이미 지난 시간은 예약할 수 없습니다.')
    return
  }
  selectedRoom.value = rooms.value.find((r) => r.id === roomId) || null
  selectedDate.value = parseDateOnly(dateValue.value)
  selectedHour.value = hour
  bookingModalOpen.value = true
}

const handleBookingClick = (booking) => {
  selectedBooking.value = booking
  selectedRoom.value = rooms.value.find((r) => r.id === booking.roomId) || null
  roomDetailOpen.value = false
  detailModalOpen.value = true
}

const handleRoomClick = (room) => {
  selectedRoom.value = room
  roomDetailOpen.value = true
}

const handleBookRoomClick = (room) => {
  selectedRoom.value = room
  selectedDate.value = parseDateOnly(dateValue.value)
  selectedHour.value = null
  roomDetailOpen.value = false

  setTimeout(() => {
    bookingModalOpen.value = true
  }, 0)
}

const handleBookingConfirm = async (booking) => {
  if (!selectedRoom.value?.serverId) return
  try {
    const normalizedAttendees = removeOrganizerFromAttendees(
      booking.attendees || [],
      booking.organizer || getCurrentUser()?.name || ''
    )
    const response = await meetingRoomApi.reserve(selectedRoom.value.serverId, {
      title: booking.title || '회의실 예약',
      description: booking.description || '',
      startDatetime: toLocalDateTime(booking.startTime),
      endDatetime: toLocalDateTime(booking.endTime),
      participantUserIds: booking.participantUserIds || []
    })
    const saved = response?.data?.data
    if (!saved?.id) return
    setReservationTitle(saved.id, booking.title)
    setReservationAttendees(saved.id, normalizedAttendees)

    bookings.value.push({
      id: `b-${saved.id}`,
      serverId: saved.id,
      roomId: selectedRoom.value.id,
      roomServerId: selectedRoom.value.serverId,
      userId: getCurrentUserId(),
      interviewScheduleId: null,
      title: booking.title || '회의실 예약',
      description: booking.description || '',
      organizer: booking.organizer || getCurrentUser()?.name || '',
      interviewers: [],
      applicants: [],
      attendees: normalizedAttendees,
      status: 'confirmed',
      startTime: new Date(saved.startDatetime),
      endTime: new Date(saved.endDatetime)
    })
    bookingModalOpen.value = false
    successModalOpen.value = true
  } catch (error) {
    const detail = toReservationErrorMessage(error)
    console.error('회의실 예약 실패:', detail, error)
    openErrorModal('회의실 예약 실패', detail || '회의실 예약에 실패했습니다.')
  }
}

const deleteBookingModalOpen = ref(false)
const deleteTargetBookingId = ref(null)

const handleBookingDelete = (bookingId) => {
  const target = bookings.value.find((booking) => booking.id === bookingId)
  if (!canDeleteBooking(target)) {
    openErrorModal('권한 없음', '본인이 생성한 수동 회의실 예약만 삭제할 수 있습니다.')
    return
  }
  deleteTargetBookingId.value = bookingId
  deleteBookingModalOpen.value = true
}

const confirmDeleteBooking = async () => {
  const id = deleteTargetBookingId.value
  const target = bookings.value.find((b) => b.id === id)
  if (!target?.serverId || !target?.roomServerId) return
  if (!canDeleteBooking(target)) {
    openErrorModal('권한 없음', '본인이 생성한 수동 회의실 예약만 삭제할 수 있습니다.')
    deleteBookingModalOpen.value = false
    deleteTargetBookingId.value = null
    return
  }
  try {
    await meetingRoomApi.cancelReservation(target.roomServerId, target.serverId)
    const idx = bookings.value.findIndex((b) => b.id === id)
    if (idx >= 0) bookings.value.splice(idx, 1)
    delete reservationTitleMap.value[String(target.serverId)]
    saveReservationTitleMap()
    delete reservationAttendeeMap.value[String(target.serverId)]
    saveReservationAttendeeMap()
    deleteBookingModalOpen.value = false
    deleteTargetBookingId.value = null
    detailModalOpen.value = false
  } catch (error) {
    const detail = toErrorText(error)
    console.error('회의실 예약 삭제 실패:', detail, error)
    openErrorModal('회의실 예약 삭제 실패', detail || '회의실 예약 삭제에 실패했습니다.')
  }
}

const roomCreatedModalOpen = ref(false)
const createdRoomName = ref('')

const handleCreateRoom = async (roomData) => {
  if (!ensureHrMeetingRoomAction('회의실 생성은 인사담당자만 가능합니다.')) {
    return
  }
  try {
    const response = await meetingRoomApi.create({
      name: roomData.name,
      location: roomData.floor,
      capacity: roomData.capacity,
      description: roomData.description,
      facilities: roomData.facilities,
      color: roomData.color
    })
    const created = response?.data?.data
    if (!created?.id) return
    rooms.value.push({
      ...roomData,
      id: `r-${created.id}`,
      serverId: created.id
    })
    createRoomOpen.value = false
    createdRoomName.value = roomData.name
    roomCreatedModalOpen.value = true
  } catch (error) {
    const detail = toErrorText(error)
    console.error('회의실 생성 실패:', detail, error)
    openErrorModal('회의실 생성 실패', detail || '회의실 생성에 실패했습니다.')
  }
}

const handleEditRoom = (room) => {
  if (!ensureHrMeetingRoomAction('회의실 수정은 인사담당자만 가능합니다.')) {
    return
  }
  editingRoom.value = room
  createRoomOpen.value = true
}

const roomUpdatedModalOpen = ref(false)
const updatedRoomName = ref('')

const handleUpdateRoom = async (roomData) => {
  if (!editingRoom.value) return
  const idx = rooms.value.findIndex((r) => r.id === editingRoom.value.id)
  if (idx < 0) return
  try {
    const target = rooms.value[idx]
    if (target.serverId) {
      await meetingRoomApi.update(target.serverId, {
        name: roomData.name,
        location: roomData.floor,
        capacity: roomData.capacity,
        description: roomData.description,
        facilities: roomData.facilities,
        color: roomData.color
      })
    }
    rooms.value[idx] = { ...rooms.value[idx], ...roomData }
    editingRoom.value = null
    createRoomOpen.value = false
    updatedRoomName.value = roomData.name
    roomUpdatedModalOpen.value = true
  } catch (error) {
    const detail = toErrorText(error)
    console.error('회의실 수정 실패:', detail, error)
    openErrorModal('회의실 수정 실패', detail || '회의실 수정에 실패했습니다.')
  }
}

const deleteRoomModalOpen = ref(false)
const deleteTargetRoomId = ref(null)

const handleDeleteRoom = (roomId) => {
  if (!ensureHrMeetingRoomAction('회의실 삭제는 인사담당자만 가능합니다.')) {
    return
  }
  deleteTargetRoomId.value = roomId
  deleteRoomModalOpen.value = true
}

const confirmDeleteRoom = async () => {
  if (!ensureHrMeetingRoomAction('회의실 삭제는 인사담당자만 가능합니다.')) {
    deleteRoomModalOpen.value = false
    deleteTargetRoomId.value = null
    return
  }
  const id = deleteTargetRoomId.value
  const idx = rooms.value.findIndex((r) => r.id === id)
  if (idx < 0) return
  try {
    const target = rooms.value[idx]
    if (target.serverId) {
      await meetingRoomApi.remove(target.serverId)
    }
    rooms.value.splice(idx, 1)
    bookings.value = bookings.value.filter((b) => b.roomId !== id)
    deleteRoomModalOpen.value = false
    deleteTargetRoomId.value = null
  } catch (error) {
    const detail = toDeleteRoomErrorMessage(error)
    console.error('회의실 삭제 실패:', detail, error)
    openErrorModal('회의실 삭제 실패', detail)
  }
}

const handleDateClick = (date) => {
  dateValue.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const setDateValue = (value) => {
  dateValue.value = value
}

const openCreateRoom = () => {
  if (!ensureHrMeetingRoomAction('회의실 생성은 인사담당자만 가능합니다.')) {
    return
  }
  editingRoom.value = null
  createRoomOpen.value = true
}
</script>

<template>
  <div class="space-y-6">
    <router-view v-slot="{ Component }">
      <component
          :is="Component"
          :rooms="rooms"
          :bookings="bookings"
        :selectedDate="dateValue"
          :hours="hours"
          :dateValue="dateValue"
          :handlers="{
          handleTimeSlotClick,
          handleBookingClick,
          handleRoomClick,
          handleBookRoomClick,
          handleDateClick,
          setDateValue,
          handleEditRoom,
          handleDeleteRoom,
          openCreateRoom
        }"
      />
    </router-view>

    <BookingModal
        :open="bookingModalOpen"
        :room="selectedRoom"
        :selectedDate="selectedDate"
        :selectedHour="selectedHour"
        @close="bookingModalOpen = false"
        @confirm="handleBookingConfirm"
    />

    <BookingDetailModal
        :open="detailModalOpen"
        :booking="selectedBooking"
        :room="selectedRoom"
        @close="detailModalOpen = false"
        @delete="handleBookingDelete"
    />

    <RoomDetailModal
        :open="roomDetailOpen"
        :room="selectedRoom"
        :bookings="bookings"
        :selectedDate="dateValue"
        @close="roomDetailOpen = false"
        @bookRoom="handleBookRoomClick"
        @bookingClick="handleBookingClick"
    />

    <CreateRoomModal
        :open="createRoomOpen"
        :room="editingRoom"
        :mode="editingRoom ? 'edit' : 'create'"
        @close="createRoomOpen = false; editingRoom = null"
        @confirm="handleRoomConfirm"
    />

    <ConfirmModal
      :show="successModalOpen"
      type="success"
      title="예약 완료"
      message="회의실 예약이 성공적으로 완료되었습니다."
      confirmText="확인"
      :showCancel="false"
      @confirm="successModalOpen = false"
    />

    <ConfirmModal
      :show="deleteRoomModalOpen"
      type="danger"
      title="회의실 삭제"
      message="이 회의실을 삭제하시겠습니까? 해당 회의실의 예약 내역도 함께 삭제됩니다."
      confirmText="삭제하기"
      cancelText="취소"
      :showCancel="true"
      @confirm="confirmDeleteRoom"
      @cancel="deleteRoomModalOpen = false"
    />

    <ConfirmModal
      :show="roomUpdatedModalOpen"
      type="success"
      title="회의실 수정 완료"
      :message="`'${updatedRoomName}' 회의실 정보가 수정되었습니다.`"
      confirmText="확인"
      :showCancel="false"
      @confirm="roomUpdatedModalOpen = false"
    />

    <ConfirmModal
      :show="roomCreatedModalOpen"
      type="success"
      title="회의실 등록 완료"
      :message="`'${createdRoomName}' 회의실이 성공적으로 등록되었습니다.`"
      confirmText="확인"
      :showCancel="false"
      @confirm="roomCreatedModalOpen = false"
    />

    <ConfirmModal
      :show="deleteBookingModalOpen"
      type="danger"
      title="예약 삭제"
      message="이 예약을 삭제하시겠습니까? 삭제 후에는 복구할 수 없습니다."
      confirmText="삭제하기"
      cancelText="취소"
      :showCancel="true"
      @confirm="confirmDeleteBooking"
      @cancel="deleteBookingModalOpen = false"
    />

    <ConfirmModal
      :show="errorModalOpen"
      type="warning"
      :title="errorModalTitle"
      :message="errorModalMessage"
      confirmText="확인"
      :showCancel="false"
      @confirm="errorModalOpen = false"
      @cancel="errorModalOpen = false"
    />
  </div>
</template>




