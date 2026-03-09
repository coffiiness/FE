<script setup>
import { ref, onMounted, watch } from 'vue'
import BookingModal from '@/components/meeting-rooms/BookingModal.vue'
import BookingDetailModal from '@/components/meeting-rooms/BookingDetailModal.vue'
import RoomDetailModal from '@/components/meeting-rooms/RoomDetailModal.vue'
import CreateRoomModal from '@/components/meeting-rooms/CreateRoomModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { meetingRoomApi } from '@/api/meetingRoom'
import { recruitmentApi } from '@/api/recruitment'

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
  facilities: ['WiFi'],
  description: '',
  color: roomColors[index % roomColors.length]
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

const selectedRoom = ref(null)
const selectedBooking = ref(null)
const selectedDate = ref(null)
const selectedHour = ref(null)
const reservationTitleMap = ref({})
const interviewReservationTitleMap = ref({})
const interviewSlotTitleMap = ref({})

const RESERVATION_TITLE_MAP_KEY = 'meetingRoomReservationTitles'
const INTERVIEW_SLOT_TITLE_MAP_KEY = 'meetingRoomInterviewSlotTitles'

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

const loadInterviewSlotTitleMap = () => {
  try {
    const raw = localStorage.getItem(INTERVIEW_SLOT_TITLE_MAP_KEY)
    const parsed = raw ? JSON.parse(raw) : {}
    interviewSlotTitleMap.value = parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    interviewSlotTitleMap.value = {}
  }
}

const setReservationTitle = (reservationId, title) => {
  if (!reservationId || !title) return
  reservationTitleMap.value[String(reservationId)] = title
  saveReservationTitleMap()
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

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user') || 'null')
  } catch {
    return null
  }
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

const getMonthRange = (dateString) => {
  const [y, m] = dateString.split('-').map(Number)
  const from = new Date(y, m - 1, 1, 0, 0, 0)
  const to = new Date(y, m, 1, 0, 0, 0)
  return { from, to }
}

const toYearMonth = (dateString) => {
  const [y, m] = dateString.split('-').map(Number)
  return `${y}-${String(m).padStart(2, '0')}`
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
        if (Number.isFinite(scheduleId)) {
          nextMap[`schedule:${scheduleId}`] = mergedTitle
        }

        const roomAndTimeKey = toDateTimeKey(
          item?.meetingRoomId || item?.roomId || item?.meeting_room_id,
          startDate,
          endDate
        )
        if (roomAndTimeKey) {
          nextMap[roomAndTimeKey] = mergedTitle
          return
        }

        const timeOnlyKey = toTimeOnlyKey(startDate, endDate)
        if (!timeOnlyKey) return
        if (!timeOnlyBucket[timeOnlyKey]) timeOnlyBucket[timeOnlyKey] = new Set()
        timeOnlyBucket[timeOnlyKey].add(mergedTitle)
      })
    })

    Object.entries(timeOnlyBucket).forEach(([key, titles]) => {
      if (titles.size === 1) {
        nextMap[key] = [...titles][0]
      }
    })

    interviewReservationTitleMap.value = nextMap
  } catch (error) {
    interviewReservationTitleMap.value = {}
    console.error('면접 예약 제목 매핑 조회 실패:', error)
  }
}

const toViewBookingFromApi = (reservation) => {
  const reservationId = reservation?.id
  const scheduleId = Number(reservation?.interviewScheduleId)
  const titleFromApi =
    reservation?.title || reservation?.meetingTitle || reservation?.subject || reservation?.name
  const titleFromLocal = reservationTitleMap.value[String(reservationId)]
  const roomAndTimeKey = toDateTimeKey(reservation?.meetingRoomId, reservation?.startDatetime, reservation?.endDatetime)
  const timeOnlyKey = toTimeOnlyKey(reservation?.startDatetime, reservation?.endDatetime)
  const titleFromScheduleId = Number.isFinite(scheduleId)
    ? interviewReservationTitleMap.value[`schedule:${scheduleId}`]
    : null
  const titleFromLocalInterview = roomAndTimeKey ? interviewSlotTitleMap.value[roomAndTimeKey] : null
  const titleFromInterview =
    titleFromScheduleId ||
    (roomAndTimeKey ? interviewReservationTitleMap.value[roomAndTimeKey] : null) ||
    (timeOnlyKey ? interviewReservationTitleMap.value[timeOnlyKey] : null)

  return {
    id: `b-${reservationId}`,
    serverId: reservationId,
    roomId: `r-${reservation.meetingRoomId}`,
    roomServerId: reservation.meetingRoomId,
    title: titleFromLocalInterview || titleFromInterview || titleFromApi || titleFromLocal || '회의실 예약',
    description: reservation?.description || reservation?.memo || '',
    organizer: resolveOrganizerName(reservation),
    attendees: [],
    status: reservation.status === 'RESERVED' || reservation.status === 'ACTIVE' ? 'confirmed' : 'pending',
    startTime: new Date(reservation.startDatetime),
    endTime: new Date(reservation.endDatetime)
  }
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

const loadBookingsFromApi = async (dateString = dateValue.value) => {
  try {
    loadInterviewSlotTitleMap()
    const { from, to } = getMonthRange(dateString)
    const response = await meetingRoomApi.listReservations({
      fromDatetime: toLocalDateTime(from),
      toDatetime: toLocalDateTime(to)
    })
    const data = response?.data?.data
    const titleByReservationKey = await loadScheduleTitlesByReservationKey({ from, to })
    if (Array.isArray(data)) {
      bookings.value = data.map((reservation) => toViewBookingFromApi(reservation, titleByReservationKey))
    }
  } catch (error) {
    const detail = toErrorText(error)
    console.error('회의실 예약 목록 조회 실패:', detail, error)
  }
}

onMounted(async () => {
  loadReservationTitleMap()
  loadInterviewSlotTitleMap()
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
    const response = await meetingRoomApi.reserve(selectedRoom.value.serverId, {
      startDatetime: toLocalDateTime(booking.startTime),
      endDatetime: toLocalDateTime(booking.endTime)
    })
    const saved = response?.data?.data
    if (!saved?.id) return
    setReservationTitle(saved.id, booking.title)

    bookings.value.push({
      id: `b-${saved.id}`,
      serverId: saved.id,
      roomId: selectedRoom.value.id,
      roomServerId: selectedRoom.value.serverId,
      title: booking.title || '회의실 예약',
      description: booking.description || '',
      organizer: booking.organizer || getCurrentUser()?.name || '',
      attendees: booking.attendees || [],
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
  deleteTargetBookingId.value = bookingId
  deleteBookingModalOpen.value = true
}

const confirmDeleteBooking = async () => {
  const id = deleteTargetBookingId.value
  const target = bookings.value.find((b) => b.id === id)
  if (!target?.serverId || !target?.roomServerId) return
  try {
    await meetingRoomApi.cancelReservation(target.roomServerId, target.serverId)
    const idx = bookings.value.findIndex((b) => b.id === id)
    if (idx >= 0) bookings.value.splice(idx, 1)
    delete reservationTitleMap.value[String(target.serverId)]
    saveReservationTitleMap()
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
  try {
    const response = await meetingRoomApi.create({
      name: roomData.name,
      location: roomData.floor,
      capacity: roomData.capacity
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
        capacity: roomData.capacity
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
  deleteTargetRoomId.value = roomId
  deleteRoomModalOpen.value = true
}

const confirmDeleteRoom = async () => {
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
    console.error('회의실 삭제 실패:', error)
    openErrorModal('회의실 삭제 실패', '회의실 삭제에 실패했습니다.')
  }
}

const handleDateClick = (date) => {
  dateValue.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const setDateValue = (value) => {
  dateValue.value = value
}

const openCreateRoom = () => {
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
      @close="successModalOpen = false"
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
      @close="roomUpdatedModalOpen = false"
      @confirm="roomUpdatedModalOpen = false"
    />

    <ConfirmModal
      :show="roomCreatedModalOpen"
      type="success"
      title="회의실 등록 완료"
      :message="`'${createdRoomName}' 회의실이 성공적으로 등록되었습니다.`"
      confirmText="확인"
      :showCancel="false"
      @close="roomCreatedModalOpen = false"
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




