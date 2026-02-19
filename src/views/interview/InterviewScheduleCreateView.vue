<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import InterviewConfirmModal from './InterviewConfirmModal.vue'
import AutoAssignModal from './AutoAssignModal.vue'
import ConfirmModal from '@/components/common/ConfirmModal.vue'
import { useRoute, useRouter } from 'vue-router'

// ── 공통 알림 모달 ─────────────────────────────────────────────────────────
const modal = ref({
  show: false, title: '', message: '', type: 'info',
  showCancel: false, confirmText: '확인', onConfirm: () => {},
})
const openModal = (opts) => {
  modal.value = { show: true, showCancel: false, confirmText: '확인', onConfirm: () => {}, ...opts }
}
const onModalConfirm = () => { modal.value.onConfirm(); modal.value.show = false }
const onModalCancel  = () => { modal.value.show = false }


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

import { useScheduleStore } from '@/Stores/schedule'

const scheduleStore = useScheduleStore()

const sendInvite = (memo) => {
  // [연동] ScheduleStore에 일정 추가
  // 1. 선택된 키(date_time)를 파싱하여 구간(Range) 단위로 변환
  const items = selectedKeys.value
      .map(parseKey)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  const map = new Map()
  for (const it of items) {
    if (!map.has(it.date)) map.set(it.date, [])
    map.get(it.date).push(it.time)
  }

  const applicantNames = applicants.value.map(a => a.name).join(', ')
  const interviewerNames = interviewers.value.map(i => i.name).join(', ')

  // 구간별 일정 추가
  for (const [date, times] of map.entries()) {
    const mins = times.map(timeToMin).sort((a, b) => a - b)
    
    let start = mins[0]
    let prev = mins[0]

    const addRange = (s, e) => {
      scheduleStore.addSchedule({
        title: `[면접] ${applicantNames}`,
        date: date,
        startTime: minToTime(s),
        endTime: minToTime(e),
        type: 'INTERVIEW',
        description: `면접관: ${interviewerNames}\n지원자: ${applicantNames}\n장소: ${selectedRoom.value.name}\n메모: ${memo || '없음'}`,
        roomId: selectedRoom.value.id // [추가] 회의실 ID
      })
    }

    for (let i = 1; i < mins.length; i++) {
      const cur = mins[i]
      if (cur === prev + 60) {
        prev = cur
      } else {
        addRange(start, prev + 60)
        start = cur
        prev = cur
      }
    }
    // 마지막 구간
    addRange(start, prev + 60)
  }

  showModal.value = false

  openModal({
    title: '일정 등록 완료',
    message: '초대장이 발송되었으며, 내 일정에 등록되었습니다.',
    type: 'success',
    onConfirm: () => router.push('/recruitment/home'),
  })
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

        openModal({ title: '자동 배정 완료', message: `${day.date} ${time} 으로 배정되었습니다.`, type: 'success' })
        return
      }
    }
  }

  openModal({ title: '배정 불가', message: '가능한 시간이 없습니다.', type: 'warning' })
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

  // Astra-1 (소형 회의실)
  {
    id: 1,
    name: 'Astra-1',
    capacity: '2~4인실',
    blocked: [

      // 월요일 오전 정기회의
      { date: '2026-02-16', time: '09:00' },
      { date: '2026-02-16', time: '10:00' },
      { date: '2026-02-16', time: '11:00' },

      // 화요일 프로젝트 미팅
      { date: '2026-02-17', time: '14:00' },
      { date: '2026-02-17', time: '15:00' },

      // 수요일 랜덤
      { date: '2026-02-18', time: '13:00' },

      // 목요일 오전 점유
      { date: '2026-02-19', time: '09:00' },
      { date: '2026-02-19', time: '10:00' },

      // 금요일 리뷰
      { date: '2026-02-20', time: '16:00' },
      { date: '2026-02-20', time: '17:00' }
    ]
  },


  // Astra-2 (중형 회의실)
  {
    id: 2,
    name: 'Astra-2',
    capacity: '4~6인실',
    blocked: [

      // 월요일 오후 워크샵
      { date: '2026-02-16', time: '13:00' },
      { date: '2026-02-16', time: '14:00' },
      { date: '2026-02-16', time: '15:00' },

      // 화요일 임원 회의
      { date: '2026-02-17', time: '10:00' },
      { date: '2026-02-17', time: '11:00' },
      { date: '2026-02-17', time: '12:00' },

      // 수요일 전체회의
      { date: '2026-02-18', time: '14:00' },
      { date: '2026-02-18', time: '15:00' },
      { date: '2026-02-18', time: '16:00' },

      // 목요일 랜덤
      { date: '2026-02-19', time: '11:00' },

      // 금요일 피크타임
      { date: '2026-02-20', time: '10:00' },
      { date: '2026-02-20', time: '11:00' }
    ]
  },


  // Orion (대형 회의실)
  {
    id: 3,
    name: 'Orion',
    capacity: '6~8인실',
    blocked: [

      // 월요일 전략회의 (반나절)
      { date: '2026-02-16', time: '09:00' },
      { date: '2026-02-16', time: '10:00' },
      { date: '2026-02-16', time: '11:00' },
      { date: '2026-02-16', time: '12:00' },

      // 화요일 외부미팅
      { date: '2026-02-17', time: '15:00' },
      { date: '2026-02-17', time: '16:00' },

      // 수요일 대형면접
      { date: '2026-02-18', time: '09:00' },
      { date: '2026-02-18', time: '10:00' },
      { date: '2026-02-18', time: '11:00' },

      // 목요일 세미나
      { date: '2026-02-19', time: '13:00' },
      { date: '2026-02-19', time: '14:00' },
      { date: '2026-02-19', time: '15:00' },

      // 금요일 마감회의
      { date: '2026-02-20', time: '17:00' },
      { date: '2026-02-20', time: '18:00' }
    ]
  }

])
const selectedRoomId = ref(rooms.value[0]?.id || '')

const selectedRoom = computed(() => {
  return rooms.value.find(r => r.id === selectedRoomId.value) || rooms.value[0]
})

const isPastDate = (dateStr) => {
  const today = new Date()
  today.setHours(0,0,0,0)

  const target = new Date(dateStr)
  target.setHours(0,0,0,0)

  return target < today
}


const isBlocked = (date, time) => {

  // 과거 날짜 차단
  if (isPastDate(date)) return true

  // 주말 차단
  if (isWeekend(date)) return true

  // blocked 정보가 없거나 배열이 아니면 빈 배열로 처리
  const blockedArr = selectedRoom.value?.blocked || []
  return blockedArr.some(
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
  // 회의실 변경 시 무조건 초기화
  selectedKeys.value = []
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
                            useAllRooms,
                            useTimeRange,
                            start,
                            useMaxHour,
                            hours
                          }) => {

  selectedKeys.value = []

  const totalPeople =
      interviewers.value.length + applicants.value.length

  const startMin = useTimeRange
      ? timeToMin(`${pad2(start)}:00`)
      : 0

  const endMin = 24 * 60

  const needMinutes =
      useMaxHour ? hours * 60 : 60

  const now = new Date()
  const todayStrNow = todayStr()
  const currentMin =
      now.getHours() * 60 + now.getMinutes()

  // 인원 수용 가능한 방만 필터 (정렬 없음)
  const candidateRooms = rooms.value.filter(room => {

    const [min, max] = room.capacity
        .replace('인실', '')
        .split('~')
        .map(Number)

    return totalPeople >= min &&
        totalPeople <= max
  })


  // 🔥 날짜 → 시간 → 방
  for (const day of weekDays.value) {

    if (isPastDate(day.date)) continue

    for (const time of timeSlots) {

      const min = timeToMin(time)

      if (min < startMin || min >= endMin)
        continue

      if (day.date === todayStrNow &&
          min <= currentMin)
        continue

      for (const room of candidateRooms) {

        let ok = true

        for (let i = 0; i < needMinutes / 60; i++) {

          const nextMin = min + i * 60
          const nextTime = minToTime(nextMin)

          const blocked =
              room.blocked.some(
                  b =>
                      b.date === day.date &&
                      b.time === nextTime
              )

          if (blocked) {
            ok = false
            break
          }
        }

        if (ok) {

          selectedRoomId.value = room.id

          selectedKeys.value =
              Array.from(
                  { length: needMinutes / 60 },
                  (_, i) =>
                      keyOf(
                          day.date,
                          minToTime(min + i * 60)
                      )
              )

          showAutoModal.value = false
          openModal({ title: '자동 배정 완료', message: `${room.name} / ${day.date} 으로 배정되었습니다.`, type: 'success' })
          return
        }
      }
    }
  }

  openModal({ title: '배정 불가', message: '조건에 맞는 시간이 없습니다.', type: 'warning' })
}


watch([selectedRoomId, interviewers, applicants], () => {

  const total =
      interviewers.value.length + applicants.value.length

  const room = rooms.value.find(
      r => r.id === selectedRoomId.value
  )

  if (!room) return


  const [min, max] = room.capacity
      .replace('인실', '')
      .split('~')
      .map(Number)


  if (total < min || total > max) {

    openModal({ title: '회의실 변경', message: '현재 인원으로는 이 회의실을 사용할 수 없어 가능한 회의실로 자동 변경되었습니다.', type: 'warning' })

    // 자동으로 가능한 방으로 변경
    const available = rooms.value.find(r => {
      const [a, b] = r.capacity
          .replace('인실', '')
          .split('~')
          .map(Number)

      return total >= a && total <= b
    })

    if (available) {
      selectedRoomId.value = available.id
    }
  }
})


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
          {{ r.name }} ({{ r.capacity }})
        </option>
      </select>

      <button class="resetTextBtn" @click="resetSelection">
        초기화
      </button>

      <button class="todayMiniBtn" @click="goToday">
        오늘로 이동
      </button>

      <button
          class="autoAssignBtn"
          title="모든 회의실 기준으로 자동 탐색"
          @click="showAutoModal = true"
      >
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

  <ConfirmModal
      :show="modal.show"
      :title="modal.title"
      :message="modal.message"
      :type="modal.type"
      :show-cancel="modal.showCancel"
      :confirm-text="modal.confirmText"
      @confirm="onModalConfirm"
      @cancel="onModalCancel"
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
