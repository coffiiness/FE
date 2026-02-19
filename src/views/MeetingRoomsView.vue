<script setup>
import { ref, onMounted, watch } from 'vue'
import BookingModal from '@/components/meeting-rooms/BookingModal.vue'
import BookingDetailModal from '@/components/meeting-rooms/BookingDetailModal.vue'
import RoomDetailModal from '@/components/meeting-rooms/RoomDetailModal.vue'
import CreateRoomModal from '@/components/meeting-rooms/CreateRoomModal.vue'

const ROOMS_KEY = 'meeting_rooms'
const BOOKINGS_KEY = 'meeting_bookings'

const handleRoomConfirm = (roomData) => {
  if (editingRoom.value) {
    handleUpdateRoom(roomData)
  } else {
    handleCreateRoom(roomData)
  }
}

const defaultRooms = [
  {
    id: 'r1',
    name: 'Orion-1',
    capacity: 8,
    floor: 7,
    facilities: ['프로젝터', '화이트보드', 'WiFi'],
    description: '채용 면접 전용 회의실',
    color: '#14b8a6'
  },
  {
    id: 'r2',
    name: 'Nebula-3',
    capacity: 6,
    floor: 7,
    facilities: ['모니터', '화상회의', '스피커'],
    description: '디자인/기획 협업 공간',
    color: '#10b981'
  },
  {
    id: 'r3',
    name: 'Astra-2',
    capacity: 10,
    floor: 3,
    facilities: ['프로젝터', '마이크', 'WiFi'],
    description: '대형 회의 및 발표 공간',
    color: '#6366f1'
  },
  {
    id: 'r4',
    name: 'Nova-5',
    capacity: 12,
    floor: 5,
    facilities: ['프로젝터', '마이크', 'WiFi'],
    description: '대형 회의 및 발표 공간',
    color: '#f59e0b'
  },
  {
    id: 'r5',
    name: 'Cosmo-1',
    capacity: 4,
    floor: 2,
    facilities: ['프로젝터', '마이크', 'WiFi'],
    description: '대형 회의 및 발표 공간',
    color: '#06b6d4'
  },
  {
    id: 'r6',
    name: 'Pulse-7',
    capacity: 16,
    floor: 9,
    facilities: ['프로젝터', '마이크', 'WiFi'],
    description: '대형 회의 및 발표 공간',
    color: '#ec4899'
  }
]

const defaultBookings = [
  {
    id: 'b1',
    roomId: 'r1',
    title: '면접 1차 · FE',
    description: '프론트엔드 직무 1차 면접',
    organizer: '채용팀',
    attendees: ['김하린', '박선우'],
    status: 'confirmed',
    startTime: new Date('2026-02-10T10:30:00'),
    endTime: new Date('2026-02-10T12:00:00')
  },
  {
    id: 'b2',
    roomId: 'r2',
    title: '디자인 리뷰',
    description: '홈 화면 UI 리뷰',
    organizer: '브랜드팀',
    attendees: ['정지윤', '김태형'],
    status: 'confirmed',
    startTime: new Date('2026-02-10T09:00:00'),
    endTime: new Date('2026-02-10T10:30:00')
  },
  {
    id: 'b3',
    roomId: 'r3',
    title: '면접 2차 · BE',
    description: '백엔드 직무 최종 면접',
    organizer: '개발팀',
    attendees: ['윤태호'],
    status: 'pending',
    startTime: new Date('2026-02-10T14:00:00'),
    endTime: new Date('2026-02-10T15:00:00')
  }
]

const rooms = ref([...defaultRooms])
const bookings = ref([...defaultBookings])

const dateValue = ref('2026-02-10')
const hours = Array.from({ length: 13 }, (_, i) => i + 8)

const bookingModalOpen = ref(false)
const detailModalOpen = ref(false)
const roomDetailOpen = ref(false)
const createRoomOpen = ref(false)
const editingRoom = ref(null)

const selectedRoom = ref(null)
const selectedBooking = ref(null)
const selectedDate = ref(null)
const selectedHour = ref(null)

const safeJsonParse = (raw, fallback) => {
  try {
    const v = JSON.parse(raw)
    return v ?? fallback
  } catch (e) {
    return fallback
  }
}

const reviveBookingDates = (list) => {
  if (!Array.isArray(list)) return []
  return list.map((b) => ({
    ...b,
    startTime: b?.startTime ? new Date(b.startTime) : null,
    endTime: b?.endTime ? new Date(b.endTime) : null
  }))
}

const loadState = () => {
  const savedRoomsRaw = localStorage.getItem(ROOMS_KEY)
  if (savedRoomsRaw) {
    const parsed = safeJsonParse(savedRoomsRaw, null)
    if (Array.isArray(parsed) && parsed.length > 0) {
      rooms.value = parsed
    } else {
      rooms.value = [...defaultRooms] 
    }
  }

  const savedBookingsRaw = localStorage.getItem(BOOKINGS_KEY)
  if (savedBookingsRaw) {
    const parsed = safeJsonParse(savedBookingsRaw, null)
    if (Array.isArray(parsed)) {
      bookings.value = reviveBookingDates(parsed)
    }
  }
}

const saveRooms = () => {
  localStorage.setItem(ROOMS_KEY, JSON.stringify(rooms.value))
}
const saveBookings = () => {
  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings.value))
}

onMounted(() => {
  loadState()
})

watch(
    rooms,
    () => {
      saveRooms()
    },
    { deep: true }
)

watch(
    bookings,
    () => {
      saveBookings()
    },
    { deep: true }
)

const handleTimeSlotClick = (roomId, hour) => {
  selectedRoom.value = rooms.value.find((r) => r.id === roomId) || null
  selectedDate.value = new Date(dateValue.value)
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
  selectedDate.value = new Date(dateValue.value)
  selectedHour.value = 9
  roomDetailOpen.value = false

  setTimeout(() => {
    bookingModalOpen.value = true
  }, 0)
}

const handleBookingConfirm = (booking) => {
  bookings.value.push({
    id: `b-${Date.now()}`,
    ...booking
  })
  bookingModalOpen.value = false
}

const handleBookingDelete = (bookingId) => {
  const idx = bookings.value.findIndex((b) => b.id === bookingId)
  if (idx >= 0) bookings.value.splice(idx, 1)
  detailModalOpen.value = false
}

const handleCreateRoom = (roomData) => {
  rooms.value.push({
    id: `r-${Date.now()}`,
    ...roomData
  })
  createRoomOpen.value = false
}

const handleEditRoom = (room) => {
  editingRoom.value = room
  createRoomOpen.value = true
}

const handleUpdateRoom = (roomData) => {
  if (!editingRoom.value) return
  const idx = rooms.value.findIndex((r) => r.id === editingRoom.value.id)
  if (idx >= 0) rooms.value[idx] = { ...rooms.value[idx], ...roomData }
  editingRoom.value = null
  createRoomOpen.value = false
}

const handleDeleteRoom = (roomId) => {
  if (!confirm('이 회의실을 삭제하시겠습니까?')) return
  const idx = rooms.value.findIndex((r) => r.id === roomId)
  if (idx >= 0) rooms.value.splice(idx, 1)

  // 해당 회의실 예약도 같이 제거 (원하면 제거 안 해도 됨)
  bookings.value = bookings.value.filter((b) => b.roomId !== roomId)
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
  </div>
</template>
