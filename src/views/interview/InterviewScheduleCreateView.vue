import { useRoute } from 'vue-router'

const route = useRoute()

const jobId = route.query.jobId
const interviewerIds = route.query.interviewers?.split(',') || []
const applicantIds = route.query.applicants?.split(',') || []

console.log(jobId, interviewerIds, applicantIds)

<template>
  <div class="page">

    <h1 class="title">면접 일정 생성</h1>

    <div class="layout">

      <div class="panel">

        <div class="section">
          <h3 class="section-title">면접관</h3>

          <label
              v-for="i in interviewers"
              :key="i.id"
              class="checkbox"
          >
            <input
                type="checkbox"
                v-model="selectedInterviewers"
                :value="i.id"
            />
            {{ i.name }} ({{ i.role }})
          </label>
        </div>

        <div class="section">
          <h3 class="section-title">회의실</h3>

          <select v-model="selectedRoom" class="select">
            <option v-for="r in rooms" :key="r">
              회의실 {{ r }}
            </option>
          </select>
        </div>

        <div class="hint">
          선택한 시간: <b>{{ selectedCount }}시간</b><br />
          최대 6시간 선택 가능
        </div>

      </div>

      <div class="calendar">

        <div class="calendar-header">
          <div></div>
          <div v-for="d in days" :key="d" class="day">
            {{ d }}
          </div>
        </div>

        <div
            v-for="(t, r) in times"
            :key="t"
            class="row"
        >

          <div class="time">{{ t }}</div>

          <div
              v-for="(d, c) in days"
              :key="d"
              :class="cellClass(r,c)"
              @mousedown.prevent="start(r,c)"
              @mouseenter="drag(r,c)"
          />
        </div>

        <div class="legend">
          <div><span class="box available"></span> 예약 가능</div>
          <div><span class="box busy"></span> 예약 불가</div>
          <div><span class="box selected"></span> 선택됨</div>
        </div>

      </div>

    </div>

    <div class="actions">
      <button
          class="px-6 py-3 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="selectedCount === 0"
          @click="openModal"
      >
        확인
      </button>
    </div>

    <BaseModal
        :show="showModal"
        title="면접 일정 확인"
        confirm-text="초대장 발송"
        @close="closeModal"
        @confirm="sendInvite"
    >

      <div class="modal-info">

        <p><b>날짜</b>: 2025년 10월 29일 (수)</p>
        <p><b>시간</b>: {{ selectedCount }}시간</p>

        <p>
          <b>면접관</b>:
          {{ selectedInterviewerNames.join(', ') }}
        </p>

        <p><b>회의실</b>: {{ selectedRoom }}</p>

      </div>

      <textarea
          v-model="inviteMessage"
          placeholder="초대 메시지 입력"
          class="invite-textarea"
      />

    </BaseModal>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'

const interviewers = [
  { id:1, name:'김기술', role:'엔지니어링' },
  { id:2, name:'박상수', role:'프로덕트' },
  { id:3, name:'이영희', role:'인사' }
]

const rooms = ['A','B','C','D','E']

const days = ['Mon','Tue','Wed','Thu','Fri']

const times = [
  '09:00','10:00','11:00','12:00',
  '13:00','14:00','15:00','16:00','17:00','18:00'
]


const selectedInterviewers = ref([])
const selectedRoom = ref('A')

const table = ref([])
const selectedCount = ref(0)

const showModal = ref(false)
const inviteMessage = ref('')

const openModal = () => {
  showModal.value = true
}

const closeModal = () => {
  showModal.value = false
}

const sendInvite = () => {
  console.log('메시지:', inviteMessage.value)

  alert('초대장 발송 완료!')

  closeModal()
}

const selectedInterviewerNames = computed(() =>
    interviewers
        .filter(i => selectedInterviewers.value.includes(i.id))
        .map(i => i.name)
)

const init = () => {

  table.value = times.map(() =>
      days.map(() => ({
        reserved:false,
        selected:false
      }))
  )

  table.value[1][1].reserved = true
  table.value[2][2].reserved = true
  table.value[3][3].reserved = true
}

init()

const isDrag = ref(false)
const mode = ref(true)


const start = (r,c) => {

  const cell = table.value[r][c]

  if (cell.reserved) return

  isDrag.value = true
  mode.value = !cell.selected

  toggle(r,c)
}


const drag = (r,c) => {

  if (!isDrag.value) return

  toggle(r,c)
}

const toggle = (r,c) => {

  const cell = table.value[r][c]

  if (cell.reserved) return

  if (mode.value && !cell.selected) {

    if (selectedCount.value >= 6) return

    cell.selected = true
    selectedCount.value++
  }

  if (!mode.value && cell.selected) {

    cell.selected = false
    selectedCount.value--
  }
}

const end = () => {
  isDrag.value = false
}

onMounted(() => {
  window.addEventListener('mouseup', end)
})

onUnmounted(() => {
  window.removeEventListener('mouseup', end)
})

const cellClass = (r,c) => {

  const cell = table.value[r][c]

  if (cell.reserved) return 'cell busy'
  if (cell.selected) return 'cell selected'

  return 'cell available'
}
</script>

<style scoped>
.page {
  background: #ffffff;
  min-height: 100vh;
  padding: 32px;
  user-select: none;
  color: #020617;
}

.title {
  font-size: 26px;
  font-weight: 800;
  margin-bottom: 24px;
}

.layout {
  display: flex;
  gap: 28px;
}

.panel {
  width: 260px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 20px;
  background: #f8fafc;
}

.section {
  margin-bottom: 18px;
}

.section-title {
  font-weight: 700;
  margin-bottom: 8px;
}

.checkbox {
  display: flex;
  gap: 8px;
  font-size: 14px;
  margin-bottom: 6px;
}

.select {
  width: 100%;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
}

.hint {
  font-size: 13px;
  color: #334155;
}

.calendar {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 18px;
  padding: 16px;
}

.calendar-header,
.row {
  display: grid;
  grid-template-columns: 80px repeat(5, 1fr);
  align-items: center;
}

.day {
  text-align: center;
  font-weight: 700;
}

.time {
  text-align: center;
  font-weight: 600;
}

.cell {
  margin: 6px;
  height: 42px;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  cursor: pointer;
}

.available {
  background: #d1fae5;
  border: 1px solid #6ee7b7;
}

.busy {
  background: #fda4af;
  border: 1px solid #fb7185;
  cursor: not-allowed;
}

.selected {
  background: #0d9488;
  border: 1px solid #0f766e;

  box-shadow: 0 0 10px rgba(13,148,136,0.4);
}

.box.available {
  background: #d1fae5;
  border: 1px solid #6ee7b7;
}

.box.busy {
  background: #fda4af;
  border: 1px solid #fb7185;
}

.box.selected {
  background: #0d9488;
  border: 1px solid #0f766e;
}

.actions {
  margin-top: 28px;
  text-align: right;
}

.btn {
  background: #0d9488;
  color: white;
  padding: 12px 20px;
  border-radius: 12px;
  border: none;
  font-weight: 600;
}

.btn:disabled {
  background: #94a3b8;
}

.invite-textarea {
  width: 100%;
  height: 180px;

  margin-top: 28px;
  margin-bottom: 24px;

  padding: 16px 18px;

  border-radius: 12px;
  border: 2px solid #cbd5e1;

  font-size: 15px;

  background: #f8fafc;

  resize: none;
}

.invite-textarea:focus {
  outline: none;

  border-color: #0d9488;

  background: white;

  box-shadow: 0 0 0 3px rgba(13,148,136,0.15);
}

.modal-actions {
  margin-top: 32px;
}

.modal-info p {
  font-size: 16px;
  line-height: 1.7;

  margin-bottom: 6px;

  color: #020617;
}

.modal-info b {
  font-weight: 700;
}

.legend {
  display: flex;
  align-items: center;
  gap: 24px;

  margin-top: 20px;

  font-size: 14px;
  color: #020617;
}

.legend > div {
  display: flex;
  align-items: center;
  gap: 6px;

  white-space: nowrap;
}

.box {
  width: 14px;
  height: 14px;

  border-radius: 4px;

  display: inline-block;
  flex-shrink: 0;
}

</style>
