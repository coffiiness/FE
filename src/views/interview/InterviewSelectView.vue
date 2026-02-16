<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

/* 채용 정보 */
const recruitment = {
  title: '2024 상반기 백엔드 개발자 공개채용'
}

/* 면접관 */
const interviewers = ref([
  { id: 1, name: '김기술', dept: '개발팀', position: '부장' },
  { id: 2, name: '정민수', dept: '개발팀', position: '차장' },
  { id: 3, name: '박상수', dept: '기획팀', position: '과장' },
  { id: 4, name: '이영희', dept: '인사팀', position: '부장' },
  { id: 5, name: '최하늘', dept: '데이터팀', position: '대리' },
  { id: 6, name: '송지훈', dept: '보안팀', position: '차장' }
])

/* 지원자 */
const applicants = ref([
  { id: 101, name: '홍길동', job: '백엔드' },
  { id: 102, name: '김하늘', job: '프론트엔드' },
  { id: 103, name: '박민준', job: '데브옵스' },
  { id: 104, name: '이수진', job: 'AI' },
  { id: 105, name: '최성훈', job: '데이터' },
  { id: 106, name: '진희연', job: 'QA' }
])

/* 상태 */
const searchInterviewer = ref('')
const searchApplicant = ref('')

const selectedInterviewers = ref([])
const selectedApplicants = ref([])

/* 검색 */
const filteredInterviewers = computed(() => {
  const k = searchInterviewer.value.trim().toLowerCase()
  if (!k) return interviewers.value
  return interviewers.value.filter(i =>
      `${i.name} ${i.dept} ${i.position}`.toLowerCase().includes(k)
  )
})

const filteredApplicants = computed(() => {
  const k = searchApplicant.value.trim().toLowerCase()
  if (!k) return applicants.value
  return applicants.value.filter(a =>
      `${a.name} ${a.job}`.toLowerCase().includes(k)
  )
})

/* 선택 */
const toggleInterviewer = (id) => {
  if (selectedInterviewers.value.includes(id)) {
    selectedInterviewers.value = selectedInterviewers.value.filter(v => v !== id)
  } else {
    selectedInterviewers.value.push(id)
  }
}

const toggleApplicant = (id) => {
  if (selectedApplicants.value.includes(id)) {
    selectedApplicants.value = selectedApplicants.value.filter(v => v !== id)
  } else {
    selectedApplicants.value.push(id)
  }
}

const removeInterviewer = (id) => {
  selectedInterviewers.value = selectedInterviewers.value.filter(v => v !== id)
}

const removeApplicant = (id) => {
  selectedApplicants.value = selectedApplicants.value.filter(v => v !== id)
}

const resetInterviewers = () => (selectedInterviewers.value = [])
const resetApplicants = () => (selectedApplicants.value = [])

/* 다음 단계 */
const canProceed = computed(() =>
    selectedInterviewers.value.length > 0 && selectedApplicants.value.length > 0
)

const goNext = () => {
  if (!canProceed.value) return
  router.push('/recruitment/interview/schedule')
}

const goBack = () => router.back()
</script>

<template>
  <div class="page">

    <!-- 상단 -->
    <div class="header">
      <h1 class="title">{{ recruitment.title }}</h1>
    </div>

    <div class="layout">

      <!-- 면접관 -->
      <div class="panel">

        <div class="panel-header">
          <h2 class="panel-title">면접관 선택</h2>
          <button
              class="reset"
              :disabled="!selectedInterviewers.length"
              @click="resetInterviewers"
          >
            초기화
          </button>
        </div>

        <input
            v-model="searchInterviewer"
            class="search"
            placeholder="이름 / 부서 / 직급 검색"
        />

        <div class="list">
          <template v-if="filteredInterviewers.length">
            <div
                v-for="i in filteredInterviewers"
                :key="i.id"
                :class="['card', selectedInterviewers.includes(i.id) ? 'active' : '']"
                @click="toggleInterviewer(i.id)"
            >
              <div class="left">
                <strong class="name">{{ i.name }}</strong>
                <span class="sub">· {{ i.dept }} / {{ i.position }}</span>
              </div>

              <span class="picked" v-if="selectedInterviewers.includes(i.id)">선택됨</span>
            </div>
          </template>

          <p v-else class="empty">검색 결과가 없습니다.</p>
        </div>

        <div class="selected-box">
          <div class="selected-header">
            선택된 면접관 ({{ selectedInterviewers.length }}명)
          </div>

          <div class="chips" v-if="selectedInterviewers.length">
            <span v-for="id in selectedInterviewers" :key="id" class="chip">
              {{ interviewers.find(i => i.id === id)?.name }}
              <button class="chip-x" @click.stop="removeInterviewer(id)">×</button>
            </span>
          </div>

          <p v-else class="selected-empty">선택된 면접관이 없습니다.</p>
        </div>

      </div>

      <!-- 지원자 -->
      <div class="panel">

        <div class="panel-header">
          <h2 class="panel-title">지원자 선택</h2>
          <button
              class="reset"
              :disabled="!selectedApplicants.length"
              @click="resetApplicants"
          >
            초기화
          </button>
        </div>

        <input
            v-model="searchApplicant"
            class="search"
            placeholder="이름 / 직무 검색"
        />

        <div class="list">
          <template v-if="filteredApplicants.length">
            <div
                v-for="a in filteredApplicants"
                :key="a.id"
                :class="['card', selectedApplicants.includes(a.id) ? 'active' : '']"
                @click="toggleApplicant(a.id)"
            >
              <div class="left">
                <strong class="name">{{ a.name }}</strong>
                <span class="sub">· {{ a.job }}</span>
              </div>

              <span class="picked" v-if="selectedApplicants.includes(a.id)">선택됨</span>
            </div>
          </template>

          <p v-else class="empty">검색 결과가 없습니다.</p>
        </div>

        <div class="selected-box">
          <div class="selected-header">
            선택된 지원자 ({{ selectedApplicants.length }}명)
          </div>

          <div class="chips" v-if="selectedApplicants.length">
            <span v-for="id in selectedApplicants" :key="id" class="chip">
              {{ applicants.find(a => a.id === id)?.name }}
              <button class="chip-x" @click.stop="removeApplicant(id)">×</button>
            </span>
          </div>

          <p v-else class="selected-empty">선택된 지원자가 없습니다.</p>
        </div>

      </div>
    </div>

    <!-- 버튼 -->
    <div class="actions">
      <button class="prev" @click="goBack">이전 단계</button>

      <button
          :class="['next', canProceed ? 'enabled' : '']"
          :disabled="!canProceed"
          @click="goNext"
      >
        다음 단계
      </button>
    </div>

  </div>
</template>

<style scoped>

/* ================= BASE ================= */

.page {
  /* 컬러 변수 여기로 이동 (중요) */
  --brand: #0d9488;

  --text-main: #020617;
  --text-sub: #334155;

  --bg: #f8fafc;
  --white: #ffffff;

  --border: #e2e8f0;
  --border-dark: #cbd5e1;


  padding: 40px;
  background: var(--bg);
  color: var(--text-main);
  min-height: 100vh;
}


/* ================= HEADER ================= */

.header h1 {
  font-size: 28px;
  font-weight: 900;
  color: var(--text-main);
}


/* ================= LAYOUT ================= */

.layout {
  display: flex;
  gap: 28px;
  margin-top: 20px;
}


/* ================= PANEL ================= */

.panel {
  flex: 1;
  background: var(--white);
  border-radius: 16px;
  padding: 22px;

  border: 1px solid var(--border);
}


/* ================= PANEL HEADER ================= */

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-title {
  font-size: 18px;
  font-weight: 900;
  color: var(--text-main);
}

.reset {
  font-size: 13px;
  font-weight: 800;
  color: #dc2626;
  background: none;
  border: none;
  cursor: pointer;
}

.reset:disabled {
  opacity: 0.4;
  cursor: default;
}


/* ================= SEARCH ================= */

.search {
  margin-top: 12px;
  width: 100%;

  padding: 12px 14px;

  border-radius: 10px;
  border: 2px solid var(--border-dark);

  background: white;

  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
}

.search::placeholder {
  color: #475569;
  font-weight: 600;
}

.search:focus {
  outline: none;
  border-color: var(--brand);
}


/* ================= LIST ================= */

.list {
  margin-top: 14px;
  max-height: 320px;
  overflow-y: auto;
}


/* ================= CARD ================= */

.card {
  padding: 14px 16px;
  border-radius: 12px;

  border: 1px solid var(--border);
  background: white;

  margin-bottom: 10px;
  cursor: pointer;

  display: flex;
  justify-content: space-between;
  align-items: center;

  transition: all 0.15s ease;
}

.card:hover {
  background: #ecfeff;
  border-color: var(--brand);
}


/* 이름 */

.name {
  font-size: 15px;
  font-weight: 900;
  color: var(--text-main);
}


/* 부서 */

.sub {
  margin-left: 8px;
  font-size: 13px;
  font-weight: 700;
  color: var(--text-sub);
}


/* 선택됨 */

.picked {
  font-size: 13px;
  font-weight: 900;
  color: var(--brand);
}


/* ================= ACTIVE ================= */

.card.active {
  background: var(--brand);
  border-color: var(--brand);
}

.card.active .name,
.card.active .sub,
.card.active .picked {
  color: white;
}


/* ================= EMPTY ================= */

.empty {
  text-align: center;
  color: #334155;
  font-weight: 800;
  padding: 16px;
}

.selected-empty {
  color: #475569;
  font-weight: 700;
}


/* ================= SELECTED ================= */

.selected-box {
  margin-top: 18px;
  padding-top: 14px;

  border-top: 1px dashed var(--border);
}

.selected-header {
  font-size: 14px;
  font-weight: 900;
  color: var(--text-main);
  margin-bottom: 10px;
}


/* ================= CHIPS ================= */

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  background: var(--brand);
  color: white;

  padding: 6px 12px;
  border-radius: 999px;

  font-size: 13px;
  font-weight: 800;

  display: flex;
  align-items: center;
  gap: 6px;
}

.chip-x {
  background: rgba(255,255,255,0.3);
  border: none;
  color: white;

  width: 18px;
  height: 18px;

  border-radius: 50%;
  cursor: pointer;
}


/* ================= ACTIONS ================= */

.actions {
  margin-top: 26px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.prev {
  background: white;
  color: var(--text-main);

  border: 1px solid var(--border-dark);

  padding: 12px 22px;
  border-radius: 10px;

  font-weight: 800;
  cursor: pointer;
}

.next {
  background: #e2e8f0;
  color: #64748b;

  border: none;

  padding: 12px 22px;
  border-radius: 10px;

  font-weight: 800;
  cursor: not-allowed;
}

.next.enabled {
  background: var(--brand);
  color: white;
  cursor: pointer;
}

</style>


