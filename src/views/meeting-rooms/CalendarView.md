# CalendarView

월 단위 캘린더 뷰. 날짜별 예약을 미리 보여주고, 더보기 클릭 시 해당 날짜의 전체 일정을 모달로 표시합니다.

## 주요 UI
- 월 네비게이션 (이전/다음/오늘)
- 회의실 필터 셀렉트
- 날짜별 예약 요약
- 더보기 모달

## 이벤트
- `handlers.handleDateClick(date)`  
  날짜 클릭 시 상위 뷰 날짜 갱신.
- `handlers.handleBookingClick(booking)`  
  예약 클릭 시 예약 상세 모달 오픈.

## 추가 동작
- 날짜 셀 높이 고정(월별 높이 변동 방지)
- 더보기 클릭 시 날짜 모달 오픈

## API 연동 예정 지점
- 월별 예약 로딩
- 회의실 필터 적용

## 관련 API
- [회의실 캘린더 월 조회]
  - 메서드: GET
  - 경로: http://localhost:8080/api/v1/meeting-rooms/calendar?month=YYYY-MM
- [예약 상세 조회]
  - 메서드: GET
  - 경로: http://localhost:8080/api/v1/meeting-rooms/bookings/{bookingId}
