# ManageView

회의실 관리 뷰. 회의실 목록을 테이블로 보여주고 수정/삭제/추가 동작을 제공합니다.

## 주요 UI
- 회의실 테이블(이름/수용 인원/층수/시설)
- 수정/삭제 버튼
- 회의실 추가 버튼

## 이벤트
- `handlers.openCreateRoom()`  
  회의실 생성 모달 오픈.
- `handlers.handleEditRoom(room)`  
  회의실 수정 모달 오픈.
- `handlers.handleDeleteRoom(roomId)`  
  회의실 삭제 처리.

## API 연동 예정 지점
- 회의실 CRUD
- 
## 관련 API
- [회의실 목록 조회]
  - 메서드: GET
  - 경로: http://localhost:8080/api/v1/meeting-rooms
- [회의실 생성]
  - 메서드: POST
  - 경로: http://localhost:8080/api/v1/meeting-rooms
- [회의실 수정]
  - 메서드: PATCH
  - 경로: http://localhost:8080/api/v1/meeting-rooms/{roomId}
- [회의실 삭제]
  - 메서드: DELETE
  - 경로: http://localhost:8080/api/v1/meeting-rooms/{roomId}
