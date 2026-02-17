<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import InterviewConfirmModal from './InterviewConfirmModal.vue'
import { useRoute, useRouter } from 'vue-router'
import AutoAssignModal from './AutoAssignModal.vue'


const route = useRoute()
const router = useRouter()

const showAutoModal = ref(false)

const goToday = () => {
  anchorDate.value = todayStr()
  selectedKeys.value = []
}

const resetSelection = () => {
  selectedKeys.value = []
}

const isWeekend = (dateStr) => {
  const d = new Date(dateStr)
  const day = d.getDay()
  return day === 0 || day === 6
}

// 임시 더미 면접관
const dummyInterviewers = [
  { id: 1, name: '김기술' },
  { id: 2, name: '정민수' },
  { id: 3, name: '박상수' }
]

// 임시 더미 지원자
const dummyApplicants = [
  { id: 101, name: '홍길동' },
  { id: 102, name: '김하늘' },
  { id: 103, name: '박민준' }
]

// query 있으면 사용, 없으면 더미 사용
const interviewers = ref(
    route.query.interviewers
        ? JSON.parse(route.query.interviewers)
        : dummyInterviewers
)

const applicants = ref(
    route.query.applicants
        ? JSON.parse(route.query.applicants)
        : dummyApplicants
)

const showModal = ref(false)

const sendInvite = (memo) => {
  alert('초대장이 발송되었습니다.')

  showModal.value = false

  router.push('/recruitment/home')
}

const COLOR = {
  brand: '#0D9488',      // 선택됨
  brandSoft: '#ECFDF5',  // hover/약한 배경
  border: '#E2E8F0',
  grid: '#EEF2F7',
  dangerSoft: '#FEE2E2', // 예약 불가
  sunday: '#EF4444',     // 일요일
  saturday: '#2563EB',   // 토요일
  todayRing: '#10B981'   // 오늘 동그라미
}

const timeSlots = Array.from({ length: 10 }, (_, i) => {
  const hour = i + 9
  return `${String(hour).padStart(2, '0')}:00`
})

const pad2 = (n) => String(n).padStart(2, '0')
const ymd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

const todayStr = () => ymd(new Date())
const isToday = (dateStr) => dateStr === todayStr()

const koDays = ['일', '월', '화', '수', '목', '금', '토']

const anchorDate = ref('2026-02-16')


const weekDays = computed(() => {
  const base = new Date(anchorDate.value)
  const dow = base.getDay()
  const start = new Date(base)
  start.setDate(base.getDate() - dow)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return {
      date: ymd(d),
      dayLabel: koDays[d.getDay()],
      dayIndex: d.getDay(),
      dayNum: d.getDate()
    }
  })
})

const autoAssignSchedule = () => {

  selectedKeys.value = []

  for (const day of weekDays.value) {
    for (const time of timeSlots) {

      if (!isBlocked(day.date, time)) {

        const key = keyOf(day.date, time)

        selectedKeys.value = [key]

        alert(`자동 배정 완료: ${day.date} ${time}`)
        return
      }
    }
  }

  alert('가능한 시간이 없습니다.')
}

const monthTitle = computed(() => {
  const d = new Date(anchorDate.value)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`
})

const moveWeek = (deltaWeek) => {
  const d = new Date(anchorDate.value)
  d.setDate(d.getDate() + deltaWeek * 7)
  anchorDate.value = ymd(d)
}
const moveMonth = (deltaMonth) => {
  const d = new Date(anchorDate.value)
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + deltaMonth)

  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, last))

  anchorDate.value = ymd(d)
}

const rooms = ref([
  {
    id: 1,
    name: 'Astra-1',
    blocked: [
      { date: '2026-02-17', time: '10:00' },
      { date: '2026-02-19', time: '13:00' }
    ]
  },
  {
    id: 2,
    name: 'Astra-2',
    blocked: [
      { date: '2026-02-16', time: '12:00' },
      { date: '2026-02-16', time: '13:00' },
      { date: '2026-02-20', time: '10:00' }
    ]
  },
  {
    id: 3,
    name: 'Orion',
    blocked: [
      { date: '2026-02-18', time: '11:00' },
      { date: '2026-02-18', time: '12:00' },
      { date: '2026-02-18', time: '13:00' }
    ]
  }
])

const selectedRoomId = ref(2)

const selectedRoom = computed(() => {
  return rooms.value.find(r => r.id === selectedRoomId.value) || rooms.value[0]
})

const isBlocked = (date, time) => {

  if (isWeekend(date)) return true

  return selectedRoom.value.blocked.some(
      b => b.date === date && b.time === time
  )
}

const MAX_HOURS = 6
const selectedKeys = ref([])

const keyOf = (date, time) => `${date}_${time}`

const isSelected = (date, time) => selectedKeys.value.includes(keyOf(date, time))

const isDragging = ref(false)
const dragMode = ref('add') // add | remove

const startDrag = (date, time) => {
  if (isBlocked(date, time)) return

  isDragging.value = true
  const k = keyOf(date, time)

  if (selectedKeys.value.includes(k)) {
    dragMode.value = 'remove'
    selectedKeys.value =
        selectedKeys.value.filter(x => x !== k)
  } else {
    dragMode.value = 'add'

    if (selectedKeys.value.length < MAX_HOURS) {
      selectedKeys.value.push(k)
    }
  }
}

const dragOver = (date, time) => {
  if (!isDragging.value) return
  if (isBlocked(date, time)) return

  const k = keyOf(date, time)

  if (
      dragMode.value === 'add' &&
      !selectedKeys.value.includes(k) &&
      selectedKeys.value.length < MAX_HOURS
  ) {
    selectedKeys.value.push(k)
  }

  if (
      dragMode.value === 'remove' &&
      selectedKeys.value.includes(k)
  ) {
    selectedKeys.value =
        selectedKeys.value.filter(x => x !== k)
  }
}

const endDrag = () => {
  isDragging.value = false
}

const handleMouseUp = () => {
  isDragging.value = false
}

onMounted(() => {
  document.addEventListener('mouseup', handleMouseUp)
})

onBeforeUnmount(() => {
  document.removeEventListener('mouseup', handleMouseUp)
})

watch(selectedRoomId, () => {
  selectedKeys.value = selectedKeys.value.filter(k => {
    const [d, t] = k.split('_')
    return !isBlocked(d, t)
  })
})

const parseKey = (k) => {
  const [d, t] = k.split('_')
  return { date: d, time: t }
}

const timeToMin = (t) => {
  const [hh, mm] = t.split(':').map(Number)
  return hh * 60 + mm
}

const minToTime = (m) => `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`

const formatKoDate = (dateStr) => {
  const d = new Date(dateStr)
  const mm = d.getMonth() + 1
  const dd = d.getDate()
  const day = koDays[d.getDay()]
  return `${mm}/${dd}(${day})`
}

const selectedTimeRanges = computed(() => {
  const items = selectedKeys.value
      .map(parseKey)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  // 날짜별로
  const map = new Map()
  for (const it of items) {
    if (!map.has(it.date)) map.set(it.date, [])
    map.get(it.date).push(it.time)
  }

  const ranges = []
  for (const [date, times] of map.entries()) {
    const mins = times.map(timeToMin).sort((a, b) => a - b)

    // 연속(60분 간격) 묶기
    let start = mins[0]
    let prev = mins[0]

    for (let i = 1; i < mins.length; i++) {
      const cur = mins[i]
      if (cur === prev + 60) {
        prev = cur
      } else {
        // 구간 종료
        ranges.push({
          date,
          start: minToTime(start),
          end: minToTime(prev + 60)
        })
        start = cur
        prev = cur
      }
    }

    // 마지막 구간 push
    ranges.push({
      date,
      start: minToTime(start),
      end: minToTime(prev + 60)
    })
  }

  return ranges.map(r => `${formatKoDate(r.date)} ${r.start} - ${r.end}`)
})

const goNext = () => {
  showModal.value = true
}

const dayHeaderClass = (dayIndex) => {
  if (dayIndex === 0) return 'sunday'
  if (dayIndex === 6) return 'saturday'
  return ''
}

const handleAutoAssign = ({
                            useTimeRange,
                            start,
                            end,
                            useMaxHour,
                            hours
                          }) => {

  selectedKeys.value = []

  const startMin = useTimeRange
      ? timeToMin(`${pad2(start)}:00`)
      : 0

  const endMin = useTimeRange
      ? timeToMin(`${pad2(end)}:00`)
      : 24 * 60

  const needMinutes = useMaxHour
      ? hours * 60
      : 60


  for (const day of weekDays.value) {

    if (isWeekend(day.date)) continue

    let streak = []

    for (const time of timeSlots) {

      const min = timeToMin(time)

      if (min < startMin || min >= endMin) continue

      if (isBlocked(day.date, time)) {
        streak = []
        continue
      }

      streak.push(time)

      if (streak.length * 60 >= needMinutes) {

        streak.forEach(t => {
          selectedKeys.value.push(keyOf(day.date, t))
        })

        alert(`자동 배정 완료: ${day.date}`)

        showAutoModal.value = false
        return
      }
    }

    streak = []
  }

  alert('조건에 맞는 시간이 없습니다.')
}


</script>

<template>
  <div class="page">
    <h1 class="title">면접 일정 선택</h1>

    <div class="names">
      <div class="line">
        <span class="label">면접관</span>
        <span class="value">{{ interviewers.map(i => i.name).join(', ') || '-' }}</span>
      </div>
      <div class="line">
        <span class="label">지원자</span>
        <span class="value">{{ applicants.map(a => a.name).join(', ') || '-' }}</span>
      </div>
    </div>

    <div class="topbar">

      <!-- 이전 주 -->
      <button
          class="navBtn ghost"
          @click="moveWeek(-1)"
      >
        ‹
      </button>

      <!-- 가운데 -->
      <div class="centerTitle">
        {{ monthTitle }}
        <div class="subDate">
          {{ weekDays[0].date }} ~ {{ weekDays[6].date }}
        </div>
      </div>

      <!-- 오른쪽 -->
      <div class="rightBox">

        <button
            class="navBtn ghost"
            @click="moveWeek(1)"
        >
          ›
        </button>


      </div>

    </div>

    <!-- 회의실 -->
    <div class="roomRow">
      <div class="roomLabel">회의실</div>

      <select class="roomSelect" v-model="selectedRoomId">
        <option v-for="r in rooms" :key="r.id" :value="r.id">
          {{ r.name }}
        </option>
      </select>

      <button class="resetTextBtn" @click="resetSelection">
        초기화
      </button>

      <button class="todayMiniBtn" @click="goToday">
        오늘로 이동
      </button>

      <button class="autoAssignBtn" @click="showAutoModal = true">
        자동 배정
      </button>
    </div>


    <!-- 그리드 -->
    <div class="calendar">

      <!-- 헤더 -->
      <div class="head">
        <div class="timeHead"></div>

        <div
            v-for="d in weekDays"
            :key="d.date"
            class="dayHead"
            :class="dayHeaderClass(d.dayIndex)"
        >
          <div class="dow">{{ d.dayLabel }}</div>

          <div class="numWrap" :class="{ today: isToday(d.date) }">
            <span class="num">{{ d.dayNum }}</span>
          </div>
        </div>
      </div>

      <!-- 바디 -->
      <div class="body">
        <div
            v-for="t in timeSlots"
            :key="t"
            class="row"
        >
          <div class="timeCol">{{ t }}</div>

          <div
              v-for="d in weekDays"
              :key="d.date + '_' + t"
              class="cell"
              :class="{
    block: isBlocked(d.date, t),
    select: isSelected(d.date, t)
  }"

              @mousedown.prevent="startDrag(d.date, t)"
              @mousemove.prevent="dragOver(d.date, t)"
          />

        </div>
      </div>

    </div>

    <!-- 아래 영역: 선택 시간/범례/버튼 -->
    <div class="bottom">

      <div class="left">
        <div class="pickedTitle">선택된 시간</div>

        <div v-if="!selectedTimeRanges.length" class="pickedEmpty">
          아직 선택된 시간이 없습니다. 최대 {{ MAX_HOURS }}시간까지 선택할 수 있습니다.
        </div>

        <ul v-else class="pickedList">
          <li v-for="(s, idx) in selectedTimeRanges" :key="idx">
            {{ s }}
          </li>
        </ul>

        <div class="legend">
          <div class="lgItem">
            <span class="dot available"></span>
            예약 가능
          </div>
          <div class="lgItem">
            <span class="dot blocked"></span>
            예약 불가
          </div>
          <div class="lgItem">
            <span class="dot selected"></span>
            선택됨
          </div>
        </div>
      </div>

      <!-- 버튼 영역 -->
      <div class="buttonRow">
        <button class="stepBtn prevBtn" @click="$router.back()">
          이전 단계
        </button>

        <button
            class="stepBtn nextBtn"
            :disabled="selectedKeys.length === 0"
            @click="goNext"
        >
          다음 단계
        </button>
      </div>


    </div>

  </div>

  <InterviewConfirmModal
      :open="showModal"

      :date="weekDays[0].date"
      :time="selectedTimeRanges.join(', ')"
      :interviewers="interviewers.map(i=>i.name).join(', ')"
      :applicant="applicants.map(a=>a.name).join(', ')"
      :room="selectedRoom.name"
      requester="HR 담당자"

      @close="showModal=false"
      @submit="sendInvite"
  />

  <AutoAssignModal
      :open="showAutoModal"
      @close="showAutoModal = false"
      @submit="handleAutoAssign"
  />

</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

* { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
.page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 36px 40px 44px;
  color: #0f172a;
  background: #f8fafc;
}

.back {
  border: none;
  background: none;
  color: #0D9488;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 10px;
}

.title {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 6px 0 14px;
}

.names {
  font-size: 14px;
  color: #334155;
  margin-bottom: 20px;
}
.names .line { display: flex; gap: 10px; margin: 4px 0; }
.names .label { width: 56px; color: #64748b; font-weight: 600; }
.names .value { font-weight: 600; color: #0f172a; }

.topbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 16px 0 14px;
}

.monthNav {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.monthTitle {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.navBtn {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  font-size: 18px;
  font-weight: 700;
}

.navBtn:hover {
  background: #f1f5f9;
}
.navBtn.ghost:hover { background: #ecfdf5; border-radius: 10px; }

.roomRow {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 6px 0 14px;
}
.roomLabel {
  font-size: 13px;
  color: #64748b;
  font-weight: 700;
}
.roomSelect {
  border: 1px solid #e2e8f0;
  background: white;
  border-radius: 10px;
  padding: 10px 12px;
  font-weight: 600;
  color: #0f172a;
}
.roomHint {
  font-size: 12px;
  color: #64748b;
  margin-left: 6px;
}

.calendar {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.02);
}

.head {
  display: grid;
  grid-template-columns: 84px repeat(7, 1fr);
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
}

.timeHead { border-right: 1px solid #e2e8f0; }

.dayHead {
  padding: 10px 0 12px;
  text-align: center;
  border-right: 1px solid #e2e8f0;
}
.dayHead:last-child { border-right: none; }

.dow {
  font-size: 12px;
  font-weight: 700;
  color: #334155;
}

.dayHead.sunday .dow,
.dayHead.sunday .num { color: #EF4444; }

.dayHead.saturday .dow,
.dayHead.saturday .num { color: #2563EB; }

.numWrap {
  margin-top: 6px;
  display: inline-flex;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  align-items: center;
  justify-content: center;
}

.numWrap.today {
  background: #0D9488;
  color: white;
  border-radius: 50%;
}
.numWrap.today .num {
  color: white;
}

.num {
  font-size: 14px;
  font-weight: 800;
  color: #0f172a;
}

.body .row {
  display: grid;
  grid-template-columns: 84px repeat(7, 1fr);
}

.timeCol {
  border-right: 1px solid #e2e8f0;
  border-bottom: 1px solid #eef2f7;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #475569;
  font-weight: 700;
}

.cell {
  border-right: 1px solid #eef2f7;
  border-bottom: 1px solid #eef2f7;
  height: 48px;
  background: #ffffff;
  cursor: pointer;
  transition: background 0.12s ease, box-shadow 0.12s ease;
}
.cell:last-child { border-right: none; }

.cell:hover {
  background: #ECFDF5;
}

.cell.block {
  background: #FEE2E2;
  cursor: not-allowed;
  opacity: 0.7;
}
.cell.block:hover { background: #FEE2E2; }

.cell.select {
  background: #0D9488;
}

.bottom {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 16px;
  margin-top: 18px;
}

.left {
  flex: 1;
  min-width: 0;
}

.pickedTitle {
  font-size: 13px;
  color: #0f172a;
  font-weight: 800;
  margin-bottom: 8px;
}

.pickedEmpty {
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
  padding: 10px 0;
}

.pickedList {
  margin: 0;
  padding-left: 18px;
  color: #0f172a;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.7;
}

.legend {
  margin-top: 12px;
  display: flex;
  gap: 14px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #475569;
  font-weight: 700;
}
.lgItem {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;
  border: 1px solid #e2e8f0;
}
.dot.available { background: #ffffff; }
.dot.blocked { background: #FEE2E2; border-color: #fecaca; }
.dot.selected { background: #0D9488; border-color: #0D9488; }

.nextBtn {
  border: none;
  background: #0D9488;
  color: #ffffff;
  padding: 12px 18px;
  border-radius: 10px;
  font-weight: 800;
  cursor: pointer;
  min-width: 120px;
}
.nextBtn:hover { background: #0f766e; }
.nextBtn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.todayBtn {
  margin: 10px auto 0;
  display: block;
  padding: 8px 16px;
  background: #0D9488;
  color: white;
  border: none;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  font-size: 13px;
}

.todayBtn:hover {
  background: #0f766e;
}

.calendar {
  user-select: none;
}

.centerTitle {
  text-align: center;
  font-weight: 800;
  font-size: 18px;
}

.subDate {
  font-size: 12px;
  color: #64748b;
  margin-top: 2px;
}

.rightBox {
  display: flex;
  align-items: center;
  gap: 10px;
}

.buttonRow {
  display: flex;
  gap: 14px;
}

.stepBtn {
  padding: 12px 22px;
  border-radius: 12px;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  transition: 0.15s ease;
}

/* 이전 단계 */
.prevBtn {
  background: #ffffff;
  border: 1px solid #cbd5e1;
  color: #0f172a;
}

.prevBtn:hover {
  background: #f1f5f9;
}

/* 다음 단계 */
.nextBtn {
  background: #0D9488;
  border: none;
  color: #ffffff;
}

.nextBtn:hover {
  background: #0f766e;
}

.nextBtn:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

/* 토요일 위 버튼 영역 */
.headerAction {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-bottom: 6px;
}

/* 작은 버튼 공통 */
.miniBtn {
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  border: none;
}

/* 오늘 버튼 */
.todayMiniBtn {
  background: #0D9488;
  color: white;
}

.todayMiniBtn:hover {
  background: #0f766e;
}

/* 초기화 버튼 */
.resetBtn {
  background: #e2e8f0;
  color: #0f172a;
}

.resetBtn:hover {
  background: #cbd5e1;
}

/* 회의실 옆 정렬 */
.roomRow {
  display: flex;
  align-items: center;
  gap: 12px;
}

.resetTextBtn {
  background: none;
  border: none;
  color: #EF4444;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}

.resetTextBtn:hover {
  text-decoration: underline;
}

.todayMiniBtn {
  background: #0D9488;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  font-size: 12px;
}

.todayMiniBtn:hover {
  background: #0f766e;
}

.autoAssignBtn {
  background: #2563EB;
  color: white;
  border: none;
  padding: 6px 14px;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  font-size: 12px;
}

.autoAssignBtn:hover {
  background: #1f2937;
}

</style>
