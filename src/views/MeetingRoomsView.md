# MeetingRoomsView

상위 컨테이너 뷰. 회의실 관련 공통 상태와 모달을 관리하고, 하위 라우트 뷰에 데이터를 주입합니다.

## 책임
- 회의실/예약 데이터 소스 관리
- 하위 뷰에 공통 props 전달
- 예약 생성/삭제, 회의실 생성/수정/삭제 핸들러 제공
- 모달(예약 생성/상세, 회의실 상세, 회의실 생성) 제어

## 전달 Props (to child views)
- `rooms`: 회의실 목록
- `bookings`: 예약 목록
- `hours`: 타임라인 시간 슬롯(08:00~20:00)
- `dateValue`: 선택 날짜 (`YYYY-MM-DD`)
- `handlers`: 공통 핸들러 묶음
  - `handleTimeSlotClick(roomId, hour)`
  - `handleBookingClick(booking)`
  - `handleRoomClick(room)`
  - `handleBookRoomClick(room)`
  - `handleDateClick(date)`
  - `setDateValue(value)`
  - `handleEditRoom(room)`
  - `handleDeleteRoom(roomId)`
  - `openCreateRoom()`

## 모달
- 예약 생성: `BookingModal`
- 예약 상세: `BookingDetailModal`
- 회의실 상세: `RoomDetailModal`
- 회의실 생성/수정: `CreateRoomModal`

## API 연동 예정 지점
- `rooms`, `bookings`를 API에서 로딩하도록 교체
- `handleBookingConfirm` / `handleBookingDelete`
- `handleCreateRoom` / `handleUpdateRoom` / `handleDeleteRoom`
