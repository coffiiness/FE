<script setup>
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRoomStore } from '@/stores/room'
import BookingModal from '@/components/meeting-rooms/BookingModal.vue'
import BookingDetailModal from '@/components/meeting-rooms/BookingDetailModal.vue'
import RoomDetailModal from '@/components/meeting-rooms/RoomDetailModal.vue'
import CreateRoomModal from '@/components/meeting-rooms/CreateRoomModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const roomStore = useRoomStore()
const { rooms } = storeToRefs(roomStore)

const bookings = ref([
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
])

const dateValue = ref('2026-02-10')
const hours = Array.from({ length: 13 }, (_, i) => i + 8)

const bookingModalOpen = ref(false)
const detailModalOpen = ref(false)
const roomDetailOpen = ref(false)
const createRoomOpen = ref(false)
const editingRoom = ref(null)
const successModalOpen = ref(false)

const selectedRoom = ref(null)
const selectedBooking = ref(null)
const selectedDate = ref(null)
const selectedHour = ref(null)


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
  bookingModalOpen.value = true
}

const handleBookingConfirm = (booking) => {
  bookings.value.push({
    id: `b-${Date.now()}`,
    ...booking
  })
  bookingModalOpen.value = false
  successModalOpen.value = true
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
  const idx = rooms.value.findIndex((r) => r.id === editingRoom.value.id)
  if (idx >= 0) rooms.value[idx] = { ...rooms.value[idx], ...roomData }
  editingRoom.value = null
  createRoomOpen.value = false
}

const handleDeleteRoom = (roomId) => {
  if (!confirm('이 회의실을 삭제하시겠습니까?')) return
  const idx = rooms.value.findIndex((r) => r.id === roomId)
  if (idx >= 0) rooms.value.splice(idx, 1)
}

const handleDateClick = (date) => {
  dateValue.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const setDateValue = (value) => {
  dateValue.value = value
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
          openCreateRoom: () => (createRoomOpen = true)
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
      @confirm="editingRoom ? handleUpdateRoom : handleCreateRoom"
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
  </div>
</template>
