# ListView

회의실 카드 목록 뷰. 회의실별 현재/오늘/다음 예약 정보를 요약 표시합니다.

## 주요 UI
- 회의실 카드 그리드
- 제공 시설 칩, 상태(사용 가능/사용 중) 표시
- 예약 요약(현재/오늘/다음)

## 이벤트
- `handlers.handleRoomClick(room)`  
  카드 클릭 시 회의실 상세 모달 오픈.
- `handlers.handleBookRoomClick(room)`  
  예약하기 버튼 클릭 시 예약 생성 모달 오픈.

## API 연동 예정 지점
- 회의실 목록/상태 로딩
- 현재/오늘/다음 예약 계산을 서버에서 제공 가능

## 표시 규칙
- “현재/오늘/다음” 예약은 `status === 'confirmed'`만 표시 (pending 제외)
