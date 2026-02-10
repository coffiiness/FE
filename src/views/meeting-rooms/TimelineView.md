# TimelineView

회의실 타임라인 뷰. 시간 축 기반으로 예약을 표시하고 빈 슬롯 클릭으로 예약 생성 흐름을 시작합니다.

## 주요 UI
- 상단 필터 바: 날짜 선택, 시간 범위, 검색/필터 버튼
- 타임라인 그리드: 시간 슬롯 × 회의실 행

## 이벤트
- `handlers.handleTimeSlotClick(roomId, hour)`  
  빈 슬롯 클릭 시 호출. 예약 생성 모달 오픈 트리거.
- `handlers.handleBookingClick(booking)`  
  예약 블록 클릭 시 예약 상세 모달 오픈.

## API 연동 예정 지점
- 타임라인 조회: 날짜/필터 조건에 맞는 예약 로딩
- 검색/필터 적용
