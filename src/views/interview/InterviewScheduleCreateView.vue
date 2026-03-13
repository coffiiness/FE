<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import InterviewConfirmModal from './InterviewConfirmModal.vue'
import AutoAssignModal from './AutoAssignModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useRoute, useRouter } from 'vue-router'
import { meetingRoomApi } from '@/api/meetingRoom'
import { interviewApi } from '@/api/interview'
import { memberApi } from '@/api/member'

// ── 공통 알림 모달 ─────────────────────────────────────────────────────────
const modal = ref({
  show: false, title: '', message: '', type: 'info',
  showCancel: false, confirmText: '확인', onConfirm: () => {},
})
const openModal = (opts) => {
  modal.value = { show: true, showCancel: false, confirmText: '확인', onConfirm: () => {}, ...opts }
}
const onModalConfirm = () => { modal.value.onConfirm(); modal.value.show = false }
const onModalCancel  = () => { modal.value.show = false }


const route = useRoute()
const router = useRouter()
const INTERVIEW_SLOT_TITLE_MAP_KEY = 'meetingRoomInterviewSlotTitles'
const INTERVIEW_SLOT_INTERVIEWERS_MAP_KEY = 'meetingRoomInterviewSlotInterviewers'
const INTERVIEW_SLOT_APPLICANTS_MAP_KEY = 'meetingRoomInterviewSlotApplicants'

const recruitmentId = Number(route.query.recruitmentId || 0)
const recruitmentStageId = Number(route.query.recruitmentStageId || 0) || null
const round = String(route.query.round || 'FIRST')

const safeParseJson = (value, fallback) => {
  if (!value) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

const interviewers = ref(safeParseJson(route.query.interviewers, []))
const applicants = ref(safeParseJson(route.query.applicants, []))

const getUserId = (person) => {
  const rawId = Number(person?.userId ?? person?.id ?? person?.memberId)
  return Number.isFinite(rawId) && rawId > 0 ? rawId : null
}

const showModal = ref(false)
const showAutoModal = ref(false)
const submitting = ref(false)
const currentMemberType = ref('')

const timeSlots = Array.from({ length: 10 }, (_, i) => `${String(i + 9).padStart(2, '0')}:00`)
const koDays = ['일', '월', '화', '수', '목', '금', '토']

const pad2 = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
const todayStr = () => ymd(new Date())
const isToday = (dateStr) => dateStr === todayStr()

const anchorDate = ref(todayStr())
const weekDays = computed(() => {
  const base = new Date(anchorDate.value)
  const dow = base.getDay()
  const start = new Date(base)
  start.setDate(base.getDate() - dow)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return { date: ymd(d), dayLabel: koDays[d.getDay()], dayIndex: d.getDay(), dayNum: d.getDate() }
  })
})

const monthTitle = computed(() => {
  const d = new Date(anchorDate.value)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
})

const moveWeek = (deltaWeek) => {
  const d = new Date(anchorDate.value)
  d.setDate(d.getDate() + deltaWeek * 7)
  anchorDate.value = ymd(d)
}

const goToday = () => {
  anchorDate.value = todayStr()
  selectedKeys.value = []
}

const resetSelection = () => {
  selectedKeys.value = []
}

const rooms = ref([])
const selectedRoomId = ref('')
const selectedRoom = computed(() => rooms.value.find((r) => Number(r.id) === Number(selectedRoomId.value)) || rooms.value[0])
const skipRoomResetOnce = ref(false)

const parseRoomCapacity = (capacityText) => {
  const parsed = Number(String(capacityText || '').replace(/[^0-9]/g, ''))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : Number.MAX_SAFE_INTEGER
}

const parseCapacityRange = (capacityText) => {
  const normalized = String(capacityText || '').replace('인실', '').trim()
  if (!normalized) return [1, Number.MAX_SAFE_INTEGER]
  if (normalized.includes('~')) {
    const [min, max] = normalized.split('~').map(Number)
    return [Number.isFinite(min) ? min : 1, Number.isFinite(max) ? max : Number.MAX_SAFE_INTEGER]
  }
  const one = Number(normalized)
  return Number.isFinite(one) && one > 0 ? [1, one] : [1, Number.MAX_SAFE_INTEGER]
}

const canUseRoomByHeadcount = (capacityText, totalPeople) => {
  const [, maxCapacity] = parseCapacityRange(capacityText)
  return totalPeople <= maxCapacity
}

const meetingRoomBusySlots = ref([])
const interviewerBusySlots = ref([])
const applicantBusySlots = ref([])
const participantBusySlots = ref([])

const toErrorText = (error) => {
  const payload = error?.response?.data
  if (!payload) return error?.message || '알 수 없는 오류'
  if (typeof payload === 'string') return payload
  if (typeof payload?.message === 'string') return payload.message
  if (typeof payload?.error === 'string') return payload.error
  if (typeof payload?.error?.message === 'string') return payload.error.message
  if (typeof payload?.data === 'string') return payload.data
  try {
    return JSON.stringify(payload)
  } catch {
    return '알 수 없는 오류'
  }
}

const isHrMember = computed(() => currentMemberType.value === 'HR')

const ensureHrAccess = async () => {
  try {
    const response = await memberApi.getMyMember()
    currentMemberType.value = String(response?.data?.data?.memberType || '')
  } catch (error) {
    currentMemberType.value = ''
    openModal({
      title: '권한 확인 실패',
      message: toErrorText(error) || '사용자 권한 정보를 확인할 수 없습니다.',
      type: 'warning',
      onConfirm: () => router.back()
    })
    return false
  }

  if (isHrMember.value) {
    return true
  }

  openModal({
    title: '접근 제한',
    message: '면접 일정 생성은 인사담당자만 가능합니다.',
    type: 'warning',
    onConfirm: () => router.back()
  })
  return false
}

const toApiDateTime = (date, time = '00:00') => `${date}T${time}:00`
const rangesOverlap = (targetStart, targetEnd, slotStart, slotEnd) => targetStart < slotEnd && slotStart < targetEnd
const toDateTimeKey = (meetingRoomId, startDatetime, endDatetime) => {
  const roomId = Number(meetingRoomId)
  const start = new Date(startDatetime).getTime()
  const end = new Date(endDatetime).getTime()
  if (!Number.isFinite(roomId) || Number.isNaN(start) || Number.isNaN(end)) return null
  return `${roomId}|${start}|${end}`
}
const getInterviewSlotTitle = () => {
  const recruitmentTitle = String(route.query.recruitmentTitle || '').trim()
  const stageTitle = String(route.query.stage || '').trim()
  return [recruitmentTitle, stageTitle].filter(Boolean).join(' - ') || '면접 일정'
}
const saveInterviewSlotTitle = (meetingRoomId, startDatetime, endDatetime) => {
  const key = toDateTimeKey(meetingRoomId, startDatetime, endDatetime)
  if (!key) return
  const title = getInterviewSlotTitle()
  try {
    const raw = localStorage.getItem(INTERVIEW_SLOT_TITLE_MAP_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    const next = parsed && typeof parsed === 'object' ? parsed : {}
    next[key] = title
    localStorage.setItem(INTERVIEW_SLOT_TITLE_MAP_KEY, JSON.stringify(next))
  } catch {
    // ignore storage errors
  }
}

const saveInterviewSlotParticipants = (meetingRoomId, startDatetime, endDatetime) => {
  const key = toDateTimeKey(meetingRoomId, startDatetime, endDatetime)
  if (!key) return

  const interviewerNames = interviewers.value.map((item) => String(item?.name || '').trim()).filter(Boolean)
  const applicantNames = applicants.value.map((item) => String(item?.name || '').trim()).filter(Boolean)

  try {
    const rawInterviewers = localStorage.getItem(INTERVIEW_SLOT_INTERVIEWERS_MAP_KEY)
    const parsedInterviewers = rawInterviewers ? JSON.parse(rawInterviewers) : {}
    const nextInterviewers =
      parsedInterviewers && typeof parsedInterviewers === 'object' ? parsedInterviewers : {}
    nextInterviewers[key] = interviewerNames
    localStorage.setItem(INTERVIEW_SLOT_INTERVIEWERS_MAP_KEY, JSON.stringify(nextInterviewers))
  } catch {
    // ignore storage errors
  }

  try {
    const rawApplicants = localStorage.getItem(INTERVIEW_SLOT_APPLICANTS_MAP_KEY)
    const parsedApplicants = rawApplicants ? JSON.parse(rawApplicants) : {}
    const nextApplicants =
      parsedApplicants && typeof parsedApplicants === 'object' ? parsedApplicants : {}
    nextApplicants[key] = applicantNames
    localStorage.setItem(INTERVIEW_SLOT_APPLICANTS_MAP_KEY, JSON.stringify(nextApplicants))
  } catch {
    // ignore storage errors
  }
}

const hasBusyOverlap = (date, time, slots, keyName, targetId = null) => {
  const cellStart = new Date(toApiDateTime(date, time))
  const cellEnd = new Date(cellStart)
  cellEnd.setHours(cellEnd.getHours() + 1)
  return slots.some((slot) => {
    if (targetId !== null && Number(slot[keyName]) !== Number(targetId)) return false
    const slotStartValue = slot?.start ?? slot?.startDatetime
    const slotEndValue = slot?.end ?? slot?.endDatetime
    const slotStart = new Date(slotStartValue)
    const slotEnd = new Date(slotEndValue)
    if (Number.isNaN(slotStart.getTime()) || Number.isNaN(slotEnd.getTime())) return false
    return rangesOverlap(cellStart, cellEnd, slotStart, slotEnd)
  })
}

const normalizeRoomBusySlots = (slots) => {
  if (!Array.isArray(slots)) return []
  return slots
    .map((slot) => ({
      meetingRoomId: Number(slot?.meetingRoomId),
      start: slot?.start ?? slot?.startDatetime,
      end: slot?.end ?? slot?.endDatetime
    }))
    .filter(
      (slot) =>
        Number.isFinite(slot.meetingRoomId) &&
        typeof slot.start === 'string' &&
        typeof slot.end === 'string'
    )
}

const normalizeAttendeeNames = (raw) => {
  if (Array.isArray(raw)) {
    return raw.map((name) => String(name || '').trim()).filter(Boolean)
  }
  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)
  }
  return []
}

const getParticipantBusyFromReservations = (reservationRows) => {
  const selectedParticipantNames = new Set(
    [
      ...interviewers.value.map((item) => String(item?.name || '').trim()),
      ...applicants.value.map((item) => String(item?.name || '').trim())
    ].filter(Boolean)
  )
  if (!selectedParticipantNames.size || !Array.isArray(reservationRows)) {
    return []
  }

  let attendeeMap = {}
  try {
    const raw = localStorage.getItem('meetingRoomReservationAttendees')
    const parsed = raw ? JSON.parse(raw) : {}
    attendeeMap = parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    attendeeMap = {}
  }

  return reservationRows
    .filter((reservation) => {
      const attendees = normalizeAttendeeNames(reservation?.attendees)
      const fallbackAttendees = normalizeAttendeeNames(attendeeMap[String(reservation?.id)])
      const organizerName = String(reservation?.organizerName || '').trim()
      return [...attendees, ...fallbackAttendees, organizerName].some((name) =>
        selectedParticipantNames.has(name)
      )
    })
    .map((reservation) => ({
      start: reservation?.startDatetime,
      end: reservation?.endDatetime
    }))
    .filter((slot) => typeof slot.start === 'string' && typeof slot.end === 'string')
}

const loadMeetingRooms = async () => {
  try {
    const response = await meetingRoomApi.list()
    const data = response?.data?.data
    if (!Array.isArray(data)) return
    rooms.value = data
      .map((room) => ({ id: room.id, name: room.name, capacity: `${room.capacity}인실`, blocked: [] }))
      .sort((a, b) => {
        const byCapacity = parseRoomCapacity(a.capacity) - parseRoomCapacity(b.capacity)
        if (byCapacity !== 0) return byCapacity
        return String(a.name || '').localeCompare(String(b.name || ''), 'ko')
      })
    if (rooms.value.length && !rooms.value.some((r) => Number(r.id) === Number(selectedRoomId.value))) {
      selectedRoomId.value = rooms.value[0].id
    }
  } catch (error) {
    console.error('회의실 목록 조회 실패:', toErrorText(error))
  }
}

const fetchAvailabilitySnapshot = async ({ fromDatetime, toDatetime }) => {
  const now = new Date()
  const nowWithBuffer = new Date(now.getTime() + 60 * 1000)
  const requestedFrom = fromDatetime ? new Date(fromDatetime) : nowWithBuffer
  const fromBase = requestedFrom > nowWithBuffer ? requestedFrom : nowWithBuffer
  const normalizedFrom = new Date(fromBase)
  normalizedFrom.setSeconds(0, 0)
  const from = `${normalizedFrom.getFullYear()}-${pad2(normalizedFrom.getMonth() + 1)}-${pad2(normalizedFrom.getDate())}T${pad2(normalizedFrom.getHours())}:${pad2(normalizedFrom.getMinutes())}:00`
  const interviewerIds = interviewers.value.map((m) => getUserId(m)).filter((id) => Number.isFinite(id))
  const applicantIds = applicants.value.map((m) => Number(m.id)).filter((id) => Number.isFinite(id))
  const meetingRoomIds = rooms.value.map((room) => Number(room.id)).filter((id) => Number.isFinite(id))
  const interviewResult = await interviewApi
    .getAvailability({
      from,
      meetingRoomIds,
      interviewerIds,
      applicantIds
    })
    .catch((error) => {
      console.error('면접 가용시간 조회 실패:', toErrorText(error))
      return null
    })

  const reservationResult = await meetingRoomApi
    .listReservations({
      fromDatetime: from,
      toDatetime
    })
    .catch((error) => {
      console.error('회의실 예약 조회 실패:', toErrorText(error))
      return null
    })

  const interviewData = interviewResult?.data?.data
  const roomBusyFromInterview = normalizeRoomBusySlots(interviewData?.meetingRoomBusySlots)
  const reservationRows = Array.isArray(reservationResult?.data?.data) ? reservationResult.data.data : []
  const roomBusyFromReservations = normalizeRoomBusySlots(reservationRows)
  const nextParticipantBusySlots = getParticipantBusyFromReservations(reservationRows)

  const mergedRoomBusy = [...roomBusyFromInterview, ...roomBusyFromReservations]
  const uniqueRoomBusy = new Map()
  for (const slot of mergedRoomBusy) {
    const key = `${slot.meetingRoomId}|${slot.start}|${slot.end}`
    if (!uniqueRoomBusy.has(key)) {
      uniqueRoomBusy.set(key, slot)
    }
  }
  return {
    meetingRoomBusySlots: Array.from(uniqueRoomBusy.values()),
    interviewerBusySlots: Array.isArray(interviewData?.interviewerBusySlots)
      ? interviewData.interviewerBusySlots
      : [],
    applicantBusySlots: Array.isArray(interviewData?.applicantBusySlots)
      ? interviewData.applicantBusySlots
      : [],
    participantBusySlots: nextParticipantBusySlots
  }
}

const loadAvailability = async () => {
  if (!weekDays.value.length) return
  const snapshot = await fetchAvailabilitySnapshot({
    fromDatetime: toApiDateTime(weekDays.value[0].date),
    toDatetime: toApiDateTime(weekDays.value[6].date, '23:59')
  })
  meetingRoomBusySlots.value = snapshot.meetingRoomBusySlots
  interviewerBusySlots.value = snapshot.interviewerBusySlots
  applicantBusySlots.value = snapshot.applicantBusySlots
  participantBusySlots.value = snapshot.participantBusySlots
}

const isWeekend = (dateStr) => {
  const d = new Date(dateStr)
  const day = d.getDay()
  return day === 0 || day === 6
}
const isPastDate = (dateStr) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(dateStr)
  target.setHours(0, 0, 0, 0)
  return target < today
}
const isPastDateTime = (dateStr, timeStr) => new Date(`${dateStr}T${timeStr}:00`) < new Date()

const isBlocked = (date, time) => {
  if (isPastDate(date) || isPastDateTime(date, time) || isWeekend(date)) return true
  const blockedArr = selectedRoom.value?.blocked || []
  const byStatic = blockedArr.some((b) => b.date === date && b.time === time)
  const byRoomBusy = hasBusyOverlap(date, time, meetingRoomBusySlots.value, 'meetingRoomId', selectedRoom.value?.id)
  const byInterviewerBusy = hasBusyOverlap(date, time, interviewerBusySlots.value, 'interviewerId')
  const byApplicantBusy = hasBusyOverlap(date, time, applicantBusySlots.value, 'applicantId')
  const byParticipantBusy = hasBusyOverlap(date, time, participantBusySlots.value, 'unused', null)
  return byStatic || byRoomBusy || byInterviewerBusy || byApplicantBusy || byParticipantBusy
}

const toHourTime = (hour) => `${pad2(hour)}:00`
const isSlotBlockedForRoom = (date, hour, room, busySource = {}) => {
  const time = toHourTime(hour)
  if (isPastDate(date) || isPastDateTime(date, time) || isWeekend(date)) return true

  const roomBusySource = Array.isArray(busySource.meetingRoomBusySlots)
    ? busySource.meetingRoomBusySlots
    : meetingRoomBusySlots.value
  const interviewerBusySource = Array.isArray(busySource.interviewerBusySlots)
    ? busySource.interviewerBusySlots
    : interviewerBusySlots.value
  const applicantBusySource = Array.isArray(busySource.applicantBusySlots)
    ? busySource.applicantBusySlots
    : applicantBusySlots.value
  const participantBusySource = Array.isArray(busySource.participantBusySlots)
    ? busySource.participantBusySlots
    : participantBusySlots.value

  const blockedByStatic = (room?.blocked || []).some((b) => b.date === date && b.time === time)
  const blockedByRoomBusy = hasBusyOverlap(date, time, roomBusySource, 'meetingRoomId', room?.id)
  const blockedByInterviewerBusy = hasBusyOverlap(date, time, interviewerBusySource, 'interviewerId')
  const blockedByApplicantBusy = hasBusyOverlap(date, time, applicantBusySource, 'applicantId')
  const blockedByParticipantBusy = hasBusyOverlap(date, time, participantBusySource, 'unused', null)
  return blockedByStatic || blockedByRoomBusy || blockedByInterviewerBusy || blockedByApplicantBusy || blockedByParticipantBusy
}

const canAssignContinuousHours = (date, startHour, durationHours, room, busySource = {}) => {
  for (let offset = 0; offset < durationHours; offset++) {
    const hour = startHour + offset
    if (isSlotBlockedForRoom(date, hour, room, busySource)) return false
  }
  return true
}

const buildSelectedKeysByRange = (date, startHour, durationHours) => {
  const next = []
  for (let offset = 0; offset < durationHours; offset++) {
    next.push(keyOf(date, toHourTime(startHour + offset)))
  }
  return next
}

const MAX_HOURS = 6
const selectedKeys = ref([])
const keyOf = (date, time) => `${date}_${time}`
const isSelected = (date, time) => selectedKeys.value.includes(keyOf(date, time))

const isDragging = ref(false)
const dragMode = ref('add')
const startDrag = (date, time) => {
  if (isBlocked(date, time)) return
  isDragging.value = true
  const k = keyOf(date, time)
  if (selectedKeys.value.includes(k)) {
    dragMode.value = 'remove'
    selectedKeys.value = selectedKeys.value.filter((x) => x !== k)
  } else {
    dragMode.value = 'add'
    if (selectedKeys.value.length < MAX_HOURS) selectedKeys.value.push(k)
  }
}
const dragOver = (date, time) => {
  if (!isDragging.value || isBlocked(date, time)) return
  const k = keyOf(date, time)
  if (dragMode.value === 'add' && !selectedKeys.value.includes(k) && selectedKeys.value.length < MAX_HOURS) {
    selectedKeys.value.push(k)
  }
  if (dragMode.value === 'remove' && selectedKeys.value.includes(k)) {
    selectedKeys.value = selectedKeys.value.filter((x) => x !== k)
  }
}
const handleMouseUp = () => {
  isDragging.value = false
}

const parseKey = (k) => {
  const [d, t] = k.split('_')
  return { date: d, time: t }
}
const timeToMin = (t) => {
  const [hh, mm] = t.split(':').map(Number)
  return hh * 60 + mm
}
const minToTime = (m) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`
const formatKoDate = (dateStr) => {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}(${koDays[d.getDay()]})`
}

const selectedTimeRanges = computed(() => {
  const items = selectedKeys.value.map(parseKey).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const map = new Map()
  for (const it of items) {
    if (!map.has(it.date)) map.set(it.date, [])
    map.get(it.date).push(it.time)
  }
  const ranges = []
  for (const [date, times] of map.entries()) {
    const mins = times.map(timeToMin).sort((a, b) => a - b)
    let start = mins[0]
    let prev = mins[0]
    for (let i = 1; i < mins.length; i++) {
      if (mins[i] === prev + 60) prev = mins[i]
      else {
        ranges.push({ date, start: minToTime(start), end: minToTime(prev + 60) })
        start = mins[i]
        prev = mins[i]
      }
    }
    ranges.push({ date, start: minToTime(start), end: minToTime(prev + 60) })
  }
  return ranges.map((r) => `${formatKoDate(r.date)} ${r.start} - ${r.end}`)
})

const selectedRangePayloads = computed(() => {
  const items = selectedKeys.value.map(parseKey).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
  const map = new Map()
  for (const it of items) {
    if (!map.has(it.date)) map.set(it.date, [])
    map.get(it.date).push(it.time)
  }

  const ranges = []
  for (const [date, times] of map.entries()) {
    const mins = times.map(timeToMin).sort((a, b) => a - b)
    let start = mins[0]
    let prev = mins[0]
    for (let i = 1; i < mins.length; i++) {
      if (mins[i] === prev + 60) prev = mins[i]
      else {
        ranges.push({ date, startMin: start, endMin: prev + 60 })
        start = mins[i]
        prev = mins[i]
      }
    }
    ranges.push({ date, startMin: start, endMin: prev + 60 })
  }

  return ranges.map((range) => ({
    date: range.date,
    start: minToTime(range.startMin),
    end: minToTime(range.endMin),
    durationMinutes: range.endMin - range.startMin
  }))
})

const submitDateText = computed(() => {
  if (!selectedRangePayloads.value.length) return '-'
  const uniqueDates = [...new Set(selectedRangePayloads.value.map((slot) => slot.date))]
  if (uniqueDates.length === 1) return formatKoDate(uniqueDates[0])
  return `${uniqueDates.length}일 선택`
})

const submitTimeText = computed(() => {
  if (!selectedRangePayloads.value.length) return '-'
  return selectedRangePayloads.value
    .map((slot) => `${formatKoDate(slot.date)} ${slot.start} - ${slot.end}`)
    .join('\n')
})

const confirmSchedule = async () => {
  if (!isHrMember.value) {
    openModal({
      title: '일정 확정 실패',
      message: '면접 일정 생성은 인사담당자만 가능합니다.',
      type: 'warning'
    })
    return
  }
  if (!recruitmentId) {
    openModal({ title: '일정 확정 실패', message: '채용 공고 정보가 없습니다.', type: 'warning' })
    return
  }
  if (!selectedRoom.value?.id) {
    openModal({ title: '일정 확정 실패', message: '회의실을 선택해주세요.', type: 'warning' })
    return
  }
  if (!selectedRangePayloads.value.length) {
    openModal({ title: '일정 확정 실패', message: '최소 1개 이상의 시간을 선택해주세요.', type: 'warning' })
    return
  }
  const interviewerIds = interviewers.value.map((m) => getUserId(m)).filter((id) => Number.isFinite(id))
  const applicantIds = applicants.value.map((m) => Number(m.id)).filter((id) => Number.isFinite(id))
  if (!interviewerIds.length || !applicantIds.length) {
    openModal({ title: '일정 확정 실패', message: '면접관/지원자 정보를 확인해주세요.', type: 'warning' })
    return
  }
  const totalParticipants = interviewerIds.length + applicantIds.length
  if (!canUseRoomByHeadcount(selectedRoom.value.capacity, totalParticipants)) {
    openModal({
      title: '일정 확정 실패',
      message: `선택한 회의실 정원(${selectedRoom.value.capacity})과 면접 인원(${totalParticipants}명)이 맞지 않습니다.`,
      type: 'warning'
    })
    return
  }

  submitting.value = true
  try {
    const participantNames = [
      ...interviewers.value.map((member) => String(member?.name || '').trim()),
      ...applicants.value.map((member) => String(member?.name || '').trim())
    ].filter(Boolean)
    const mergedMemo = participantNames.length ? `참석자: ${participantNames.join(', ')}` : ''

    for (const slot of selectedRangePayloads.value) {
      await interviewApi.create({
        recruitmentId,
        recruitmentStageId,
        round,
        interviewerIds,
        applicantIds,
        meetingRoomId: Number(selectedRoom.value.id),
        scheduledAt: `${slot.date}T${slot.start}:00`,
        durationMinutes: slot.durationMinutes,
        memo: mergedMemo
      })
      saveInterviewSlotTitle(
        Number(selectedRoom.value.id),
        `${slot.date}T${slot.start}:00`,
        `${slot.date}T${slot.end}:00`
      )
      saveInterviewSlotParticipants(
        Number(selectedRoom.value.id),
        `${slot.date}T${slot.start}:00`,
        `${slot.date}T${slot.end}:00`
      )
    }
    showModal.value = false
    openModal({
      title: '일정 확정 완료',
      message: `면접 일정이 ${selectedRangePayloads.value.length}건 저장되었습니다.`,
      type: 'success',
      onConfirm: () => router.push(`/recruitment/jobs/${recruitmentId}`)
    })
  } catch (error) {
    openModal({ title: '일정 확정 실패', message: toErrorText(error), type: 'warning' })
  } finally {
    submitting.value = false
  }
}

const goNext = () => {
  if (!isHrMember.value) {
    openModal({ title: '접근 제한', message: '면접 일정 생성은 인사담당자만 가능합니다.', type: 'warning' })
    return
  }
  if (!selectedKeys.value.length) {
    openModal({ title: '선택 확인', message: '최소 1개 이상의 시간을 선택해주세요.', type: 'warning' })
    return
  }
  if (!selectedRoom.value?.id) {
    openModal({ title: '선택 확인', message: '회의실을 선택해주세요.', type: 'warning' })
    return
  }
  showModal.value = true
}

const dayHeaderClass = (dayIndex) => {
  if (dayIndex === 0) return 'sunday'
  if (dayIndex === 6) return 'saturday'
  return ''
}

const handleAutoAssign = async ({
  useAllRooms = false,
  useStartTime = false,
  startHour = 9,
  useDuration = false,
  durationHours = 1
}) => {
  if (!isHrMember.value) {
    openModal({ title: '접근 제한', message: '면접 일정 생성은 인사담당자만 가능합니다.', type: 'warning' })
    return
  }
  selectedKeys.value = []

  const normalizedDuration = useDuration
    ? Math.max(1, Math.min(6, Number(durationHours) || 1))
    : 1
  const normalizedStartHour = Math.max(9, Math.min(18, Number(startHour) || 9))
  const latestStartHour = 19 - normalizedDuration
  if (latestStartHour < 9) {
    openModal({ title: '배정 불가', message: '예약 시간 조건이 너무 큽니다.', type: 'warning' })
    return
  }

  const totalPeople = interviewers.value.length + applicants.value.length
  const baseRooms = useAllRooms ? rooms.value : [selectedRoom.value].filter(Boolean)
  const candidateRooms = baseRooms.filter((room) => canUseRoomByHeadcount(room.capacity, totalPeople))

  if (!candidateRooms.length) {
    openModal({ title: '배정 불가', message: '인원 수에 맞는 회의실이 없습니다.', type: 'warning' })
    return
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const candidateDates = []
  for (let i = 0; i < 30; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    candidateDates.push(ymd(d))
  }

  const availabilitySnapshot = await fetchAvailabilitySnapshot({
    fromDatetime: toApiDateTime(candidateDates[0]),
    toDatetime: toApiDateTime(candidateDates[candidateDates.length - 1], '23:59')
  })

  for (const date of candidateDates) {
    if (isWeekend(date)) continue

    const startHourCandidates = useStartTime
      ? [normalizedStartHour]
      : Array.from({ length: latestStartHour - 9 + 1 }, (_, idx) => 9 + idx)

    for (const candidateStartHour of startHourCandidates) {
      if (candidateStartHour > latestStartHour) continue

      for (const room of candidateRooms) {
        if (!canAssignContinuousHours(date, candidateStartHour, normalizedDuration, room, availabilitySnapshot)) continue

        skipRoomResetOnce.value = true
        selectedRoomId.value = room.id
        selectedKeys.value = buildSelectedKeysByRange(date, candidateStartHour, normalizedDuration)
        anchorDate.value = date
        showAutoModal.value = false
        openModal({
          title: '자동 배정 완료',
          message: `${room.name} / ${date} ${toHourTime(candidateStartHour)}~${toHourTime(candidateStartHour + normalizedDuration)}`,
          type: 'success'
        })
        return
      }
    }
  }

  openModal({ title: '배정 불가', message: '조건에 맞는 가용 시간대가 없습니다.', type: 'warning' })
}

watch(selectedRoomId, () => {
  if (skipRoomResetOnce.value) {
    skipRoomResetOnce.value = false
    return
  }
  selectedKeys.value = []
})

watch(anchorDate, async () => {
  await loadAvailability()
})

watch([selectedRoomId, interviewers, applicants], async () => {
  const total = interviewers.value.length + applicants.value.length
  const room = rooms.value.find((r) => Number(r.id) === Number(selectedRoomId.value))
  if (!room) return
  if (!canUseRoomByHeadcount(room.capacity, total)) {
    openModal({ title: '회의실 변경', message: '인원 수에 맞는 회의실로 자동 변경합니다.', type: 'warning' })
    const available = rooms.value.find((r) => {
      return canUseRoomByHeadcount(r.capacity, total)
    })
    if (available) selectedRoomId.value = available.id
  }
  await loadAvailability()
})

onMounted(async () => {
  document.addEventListener('mouseup', handleMouseUp)
  const hasAccess = await ensureHrAccess()
  if (!hasAccess) return
  await loadMeetingRooms()
  await loadAvailability()
})

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', handleMouseUp)
})


</script>

<template>
  <div class="page">
    <h1 class="title">일정 선택</h1>

    <div class="names">
      <div class="line">
        <span class="label">면접관</span>
        <span class="value">{{ interviewers.map(i => i.name).join(', ') || '-' }}</span>
      </div>
      <div class="line">
        <span class="label">지원자</span>
        <span class="value">{{ applicants.map(a => a.name).join(', ') || '-' }}</span>
      </div>
    </div>

    <div class="topbar">

      <!-- 이전 주 -->
      <button
          class="navBtn ghost"
          @click="moveWeek(-1)"
      >
        ‹
      </button>

      <!-- 가운데 -->
      <div class="centerTitle">
        {{ monthTitle }}
        <div class="subDate">
          {{ weekDays[0].date }} ~ {{ weekDays[6].date }}
        </div>
      </div>

      <!-- 오른쪽 -->
      <div class="rightBox">

        <button
            class="navBtn ghost"
            @click="moveWeek(1)"
        >
          ›
        </button>


      </div>

    </div>

    <!-- 회의실 -->
    <div class="roomRow">
      <div class="roomLabel">회의실</div>

      <select class="roomSelect" v-model="selectedRoomId">
        <option v-for="r in rooms" :key="r.id" :value="r.id">
          {{ r.name }} ({{ r.capacity }})
        </option>
      </select>

      <button class="resetTextBtn" @click="resetSelection">
        초기화
      </button>

      <button class="todayMiniBtn" @click="goToday">
        오늘로 이동
      </button>

      <button
          class="autoAssignBtn"
          title="모든 회의실 기준으로 자동 탐색"
          :disabled="!isHrMember"
          @click="showAutoModal = true"
      >
        자동 배정
      </button>
    </div>


    <!-- 그리드 -->
    <div class="calendar">

      <!-- 헤더 -->
      <div class="head">
        <div class="timeHead"></div>

        <div
            v-for="d in weekDays"
            :key="d.date"
            class="dayHead"
            :class="dayHeaderClass(d.dayIndex)"
        >
          <div class="dow">{{ d.dayLabel }}</div>

          <div class="numWrap" :class="{ today: isToday(d.date) }">
            <span class="num">{{ d.dayNum }}</span>
          </div>
        </div>
      </div>

      <!-- 바디 -->
      <div class="body">
        <div
            v-for="t in timeSlots"
            :key="t"
            class="row"
        >
          <div class="timeCol">{{ t }}</div>

          <div
              v-for="d in weekDays"
              :key="d.date + '_' + t"
              class="cell"
              :class="{
    block: isBlocked(d.date, t),
    select: isSelected(d.date, t)
  }"

              @mousedown.prevent="startDrag(d.date, t)"
              @mousemove.prevent="dragOver(d.date, t)"
          />

        </div>
      </div>

    </div>

    <!-- 아래 영역: 선택 시간/범례/버튼 -->
    <div class="bottom">

      <div class="left">
        <div class="pickedTitle">선택된 시간</div>

        <div v-if="!selectedTimeRanges.length" class="pickedEmpty">
          아직 선택된 시간이 없습니다. 최대 {{ MAX_HOURS }}시간까지 선택할 수 있습니다.
        </div>

        <ul v-else class="pickedList">
          <li v-for="(s, idx) in selectedTimeRanges" :key="idx">
            {{ s }}
          </li>
        </ul>

        <div class="legend">
          <div class="lgItem">
            <span class="dot available"></span>
            예약 가능
          </div>
          <div class="lgItem">
            <span class="dot blocked"></span>
            예약 불가
          </div>
          <div class="lgItem">
            <span class="dot selected"></span>
            선택됨
          </div>
        </div>
      </div>

      <!-- 버튼 영역 -->
      <div class="buttonRow">
        <button class="stepBtn prevBtn" @click="$router.back()">
          이전 단계
        </button>

        <button
            class="stepBtn nextBtn"
            :disabled="selectedKeys.length === 0 || !isHrMember"
            @click="goNext"
        >
          일정 확정
        </button>
      </div>


    </div>

  </div>

  <InterviewConfirmModal
      :open="showModal"
      :date="submitDateText"
      :time="submitTimeText"
      :interviewers="interviewers.map(i=>i.name).join(', ')"
      :applicant="applicants.map(a=>a.name).join(', ')"
      :room="selectedRoom?.name || '-'"
      requester="HR 담당자"

      @close="showModal=false"
      @submit="confirmSchedule"
  />

  <AutoAssignModal
      :open="showAutoModal"
      @close="showAutoModal = false"
      @submit="handleAutoAssign"
  />

  <ConfirmModal
      :show="modal.show"
      :title="modal.title"
      :message="modal.message"
      :type="modal.type"
      :show-cancel="modal.showCancel"
      :confirm-text="modal.confirmText"
      @confirm="onModalConfirm"
      @cancel="onModalCancel"
  />

</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
.page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 36px 40px 44px;
  color: #0f172a;
  background: #f8fafc;
}

.back {
  border: none;
  background: none;
  color: #0D9488;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 10px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 6px 0 14px;
}

.names {
  font-size: 14px;
  color: #334155;
  margin-bottom: 20px;
}
.names .line { display: flex; gap: 10px; margin: 4px 0; }
.names .label { width: 56px; color: #64748b; font-weight: 600; }
.names .value { font-weight: 600; color: #0f172a; }

.topbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 16px 0 14px;
}

.monthNav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.monthTitle {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.navBtn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  font-size: 18px;
  font-weight: 700;
}

.navBtn:hover {
  background: #f1f5f9;
}
.navBtn.ghost:hover { background: #ecfdf5; border-radius: 10px; }

.roomRow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 6px 0 14px;
}
.roomLabel {
  font-size: 13px;
  color: #64748b;
  font-weight: 700;
}
.roomSelect {
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 600;
  color: #0f172a;
}
.roomHint {
  font-size: 12px;
  color: #64748b;
  margin-left: 6px;
}

.calendar {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.02);
}

.head {
  display: grid;
  grid-template-columns: 84px repeat(7, 1fr);
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.timeHead { border-right: 1px solid #e2e8f0; }

.dayHead {
  padding: 10px 0 12px;
  text-align: center;
  border-right: 1px solid #e2e8f0;
}
.dayHead:last-child { border-right: none; }

.dow {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

.dayHead.sunday .dow,
.dayHead.sunday .num { color: #EF4444; }

.dayHead.saturday .dow,
.dayHead.saturday .num { color: #2563EB; }

.numWrap {
  margin-top: 6px;
  display: inline-flex;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
}

.numWrap.today {
  background: #0D9488;
  color: white;
  border-radius: 50%;
}
.numWrap.today .num {
  color: white;
}

.num {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
}

.body .row {
  display: grid;
  grid-template-columns: 84px repeat(7, 1fr);
}

.timeCol {
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #eef2f7;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #475569;
  font-weight: 700;
}

.cell {
  border-right: 1px solid #eef2f7;
  border-bottom: 1px solid #eef2f7;
  height: 48px;
  background: #ffffff;
  cursor: pointer;
  transition: background 0.12s ease, box-shadow 0.12s ease;
}
.cell:last-child { border-right: none; }

.cell:hover {
  background: #ECFDF5;
}

.cell.block {
  background: #FEE2E2;
  cursor: not-allowed;
  opacity: 0.7;
}
.cell.block:hover { background: #FEE2E2; }

.cell.select {
  background: #0D9488;
}

.bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-top: 18px;
}

.left {
  flex: 1;
  min-width: 0;
}

.pickedTitle {
  font-size: 13px;
  color: #0f172a;
  font-weight: 800;
  margin-bottom: 8px;
}

.pickedEmpty {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
  padding: 10px 0;
}

.pickedList {
  margin: 0;
  padding-left: 18px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.7;
}

.legend {
  margin-top: 12px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #475569;
  font-weight: 700;
}
.lgItem {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;
  border: 1px solid #e2e8f0;
}
.dot.available { background: #ffffff; }
.dot.blocked { background: #FEE2E2; border-color: #fecaca; }
.dot.selected { background: #0D9488; border-color: #0D9488; }

.nextBtn {
  border: none;
  background: #0D9488;
  color: #ffffff;
  padding: 12px 18px;
  border-radius: 10px;
  font-weight: 800;
  cursor: pointer;
  min-width: 120px;
}
.nextBtn:hover { background: #0f766e; }
.nextBtn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.todayBtn {
  margin: 10px auto 0;
  display: block;
  padding: 8px 16px;
  background: #0D9488;
  color: white;
  border: none;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  font-size: 13px;
}

.todayBtn:hover {
  background: #0f766e;
}

.calendar {
  user-select: none;
}

.centerTitle {
  text-align: center;
  font-weight: 800;
  font-size: 18px;
}

.subDate {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.rightBox {
  display: flex;
  align-items: center;
  gap: 10px;
}

.buttonRow {
  display: flex;
  gap: 14px;
}

.stepBtn {
  padding: 12px 22px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  transition: 0.15s ease;
}

/* 이전 단계 */
.prevBtn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #0f172a;
}

.prevBtn:hover {
  background: #f1f5f9;
}

/* 다음 단계 */
.nextBtn {
  background: #0D9488;
  border: none;
  color: #ffffff;
}

.nextBtn:hover {
  background: #0f766e;
}

.nextBtn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

/* 토요일 위 버튼 영역 */
.headerAction {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 6px;
}

/* 작은 버튼 공통 */
.miniBtn {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  border: none;
}

/* 오늘 버튼 */
.todayMiniBtn {
  background: #0D9488;
  color: white;
}

.todayMiniBtn:hover {
  background: #0f766e;
}

/* 초기화 버튼 */
.resetBtn {
  background: #e2e8f0;
  color: #0f172a;
}

.resetBtn:hover {
  background: #cbd5e1;
}

/* 회의실 옆 정렬 */
.roomRow {
  display: flex;
  align-items: center;
  gap: 12px;
}

.resetTextBtn {
  background: none;
  border: none;
  color: #EF4444;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.resetTextBtn:hover {
  text-decoration: underline;
}

.todayMiniBtn {
  background: #0D9488;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  font-size: 12px;
}

.todayMiniBtn:hover {
  background: #0f766e;
}

.autoAssignBtn {
  background: #2563EB;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  font-size: 12px;
}

.autoAssignBtn:hover {
  background: #1f2937;
}

.autoAssignBtn:disabled {
  background: #94a3b8;
  cursor: not-allowed;
}

</style>
