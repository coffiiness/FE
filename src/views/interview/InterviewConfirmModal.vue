<script setup>
import { ref } from 'vue'

const props = defineProps({
  open: Boolean,

  date: String,
  time: String,
  interviewers: String,
  applicant: String,
  room: String,
  requester: String
})

const emit = defineEmits(['close', 'submit'])

const memo = ref('')

const close = () => {
  emit('close')
}

const submit = () => {
  emit('submit', memo.value)
}
</script>

<template>
  <div v-if="open" class="overlay">

    <div class="modal">

      <h2 class="title">면접 일정 확인</h2>

      <div class="info">

        <div class="row">
          <span>날짜</span>
          <b>{{ date }}</b>
        </div>

        <div class="row">
          <span>시간</span>
          <b>{{ time }}</b>
        </div>

        <div class="row">
          <span>면접관</span>
          <b>{{ interviewers }}</b>
        </div>

        <div class="row">
          <span>지원자</span>
          <b>{{ applicant }}</b>
        </div>

        <div class="row">
          <span>장소</span>
          <b>{{ room }}</b>
        </div>

        <div class="row">
          <span>요청자</span>
          <b>{{ requester }}</b>
        </div>

      </div>

      <!-- 메모 -->
      <textarea
          v-model="memo"
          class="memo"
          placeholder="초대 메시지를 입력하세요"
      />

      <!-- 버튼 -->
      <div class="btnRow">

        <button class="cancel" @click="close">
          취소
        </button>

        <button class="confirm" @click="submit">
          초대장 발송
        </button>

      </div>

    </div>

  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

/* 모달 박스 */
.modal {
  width: 520px;
  max-width: 90vw;
  background: #ffffff;
  border-radius: 18px;
  padding: 32px 34px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.15);
}

/* 제목 */
.title {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 26px;
  text-align: center;
}

/* 정보 영역 */
.info {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 22px;
}

.row {
  display: grid;
  grid-template-columns: 90px 1fr;
  align-items: center;
  font-size: 14px;
}

/* 왼쪽 라벨 */
.row span {
  color: #64748b;
  font-weight: 600;
}

/* 오른쪽 값 */
.row b {
  color: #0f172a;
  font-weight: 700;
  text-align: right;
}

/* 메모 */
.memo {
  width: 100%;
  height: 110px;
  margin-top: 6px;
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 14px;
  line-height: 1.5;
  color: #0f172a;
  background: #f8fafc;
  resize: none;
}

.memo::placeholder {
  color: #94a3b8;
}

/* 버튼 영역 */
.btnRow {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
}

/* 취소 */
.cancel {
  background: #f1f5f9;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
}

.cancel:hover {
  background: #e2e8f0;
}

/* 확인 */
.confirm {
  background: #0D9488;
  color: white;
  border: none;
  padding: 10px 18px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
}

.confirm:hover {
  background: #0f766e;
}

</style>
