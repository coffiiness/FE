<template>
  <div class="overlay" v-if="show">

    <div class="modal">

      <!-- 닫기 버튼 -->
      <button class="close-btn" @click="close">
        ✕
      </button>

      <h2 class="title">면접 일정 확인</h2>

      <div class="info">
        <p><b>날짜</b>: 2026년 2월 12일 (목)</p>
        <p><b>시간</b>: 10:00 ~ 12:00</p>
        <p><b>면접관</b>: 김기술, 박상수</p>
        <p><b>회의실</b>: 회의실 B</p>
      </div>

      <!-- 면접자 정보 -->
      <div class="box">
        <h4>면접자 정보</h4>
        <p>이름: 홍길동</p>
        <p>직무: Backend Engineer</p>
        <p>이메일: gildong@example.com</p>
      </div>

      <!-- 초대 메시지 -->
      <div class="box">
        <h4>초대 메시지</h4>
        <p>
          안녕하세요. 아래 일정으로 면접 진행 가능하신지
          확인 부탁드립니다.
        </p>
      </div>

      <!-- 버튼 -->
      <div class="actions">
        <button class="reject" @click="reject">
          거절하기
        </button>

        <button class="accept" @click="accept">
          수락하기
        </button>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'

/* emit */
const emit = defineEmits(['accept', 'reject'])

/* modal open */
const show = ref(true)

/* close */
const close = () => {
  show.value = false
}

/* accept */
const accept = () => {
  alert('면접을 수락했습니다.')
  emit('accept')
  close()
}

/* reject */
const reject = () => {
  alert('면접을 거절했습니다.')
  emit('reject')
  close()
}
</script>

<style scoped>
/* 배경 오버레이 */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* 모달 */
.modal {
  position: relative;
  width: 460px;
  background: #ffffff;
  border-radius: 18px;
  padding: 28px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
}

/* 닫기 버튼 */
.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  border: none;
  background: transparent;
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
  color: #64748b;
}

.close-btn:hover {
  color: #020617;
}

/* 제목 */
.title {
  font-size: 20px;
  font-weight: 800;
  margin-bottom: 16px;
  color: #020617;
}

/* 기본 정보 */
.info p {
  font-size: 15px;
  font-weight: 700;
  color: #020617;
  margin-bottom: 6px;
}

/* 박스 영역 */
.box {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  margin-top: 16px;
  background: #f8fafc;
}

.box h4 {
  font-size: 15px;
  font-weight: 800;
  margin-bottom: 8px;
  color: #020617;
}

.box p {
  font-size: 14px;
  line-height: 1.6;
  color: #020617;
}

/* 버튼 영역 */
.actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

/* 거절 버튼 */
.reject {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  font-weight: 700;
  cursor: pointer;
}

.reject:hover {
  background: #dc2626;
}

/* 수락 버튼 */
.accept {
  background: #0d9488;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  font-weight: 700;
  cursor: pointer;
}

.accept:hover {
  background: #0f766e;
}
</style>
