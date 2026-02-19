<script setup>
import { ref, computed } from 'vue'

// ── 공고 데이터 ─────────────────────────────────────────────────────────────
const jobs = ref([
  { id: 1, title: 'Backend Server Developer', team: 'Platform Team', status: 'active',  totalApplicants: 42  },
  { id: 2, title: 'Product Designer (UX/UI)',  team: 'Design Group',  status: 'urgent', totalApplicants: 28  },
  { id: 3, title: 'DevOps Engineer',           team: 'Infra Unit',    status: 'active',  totalApplicants: 85  },
  { id: 4, title: 'Frontend Developer',        team: 'Web Core',      status: 'closed', totalApplicants: 156 },
])

// ── 지원자 데이터 ────────────────────────────────────────────────────────────
const applicants = ref([
  { name: '박지원', job: '백엔드 개발자',      status: '1차 면접',  appliedMonth: '2026-02' },
  { name: '김철수', job: '백엔드 개발자',      status: '2차 면접',  appliedMonth: '2026-02' },
  { name: '이영희', job: '프론트엔드 개발자',  status: '서류 검토', appliedMonth: '2026-02' },
  { name: '최민수', job: '백엔드 개발자',      status: '처우 협의', appliedMonth: '2026-01' },
  { name: '정수현', job: '백엔드 개발자',      status: '불합격',    appliedMonth: '2026-01' },
  { name: '한소영', job: '프론트엔드 개발자',  status: '1차 면접',  appliedMonth: '2026-02' },
  { name: '오준석', job: 'DevOps 엔지니어',   status: '서류 검토', appliedMonth: '2026-02' },
  { name: '윤지민', job: '백엔드 개발자',      status: '합격',      appliedMonth: '2026-01' },
])

// ── 회의실 예약 데이터 ───────────────────────────────────────────────────────
const bookings = ref([
  { roomId: 'r1', roomName: 'Orion-1',   type: '면접',   month: '2026-02' },
  { roomId: 'r1', roomName: 'Orion-1',   type: '면접',   month: '2026-02' },
  { roomId: 'r1', roomName: 'Orion-1',   type: '면접',   month: '2026-02' },
  { roomId: 'r2', roomName: 'Nebula-3',  type: '일반회의', month: '2026-02' },
  { roomId: 'r2', roomName: 'Nebula-3',  type: '일반회의', month: '2026-02' },
  { roomId: 'r3', roomName: 'Astra-2',   type: '일반회의', month: '2026-02' },
  { roomId: 'r3', roomName: 'Astra-2',   type: '기타',   month: '2026-02' },
  { roomId: 'r3', roomName: 'Astra-2',   type: '면접',   month: '2026-02' },
  { roomId: 'r4', roomName: 'Nova-5',    type: '일반회의', month: '2026-02' },
  { roomId: 'r4', roomName: 'Nova-5',    type: '일반회의', month: '2026-02' },
  { roomId: 'r5', roomName: 'Cosmo-1',   type: '기타',   month: '2026-02' },
  { roomId: 'r6', roomName: 'Pulse-7',   type: '면접',   month: '2026-02' },
  { roomId: 'r6', roomName: 'Pulse-7',   type: '일반회의', month: '2026-02' },
  { roomId: 'r6', roomName: 'Pulse-7',   type: '기타',   month: '2026-02' },
])

// ── 월별 지원자 추이 (6개월) ─────────────────────────────────────────────────
const monthlyApplicants = ref([
  { month: '9월',  count: 18 },
  { month: '10월', count: 24 },
  { month: '11월', count: 31 },
  { month: '12월', count: 27 },
  { month: '1월',  count: 42 },
  { month: '2월',  count: 8,  current: true },
])

// ── KPI 계산 ────────────────────────────────────────────────────────────────
const totalApplicants = computed(() => applicants.value.length)
const passedCount     = computed(() => applicants.value.filter(a => a.status === '합격').length)
const failedCount     = computed(() => applicants.value.filter(a => a.status === '불합격').length)
const inProgressCount = computed(() => applicants.value.filter(a => !['합격','불합격'].includes(a.status)).length)
const activeJobCount  = computed(() => jobs.value.filter(j => j.status !== 'closed').length)
const bookingCount    = computed(() => bookings.value.length)
const passRate        = computed(() => totalApplicants.value > 0
  ? ((passedCount.value / totalApplicants.value) * 100).toFixed(1) : '0.0')

// ── 전형 단계별 분포 ─────────────────────────────────────────────────────────
const STAGES = ['서류 검토', '1차 면접', '2차 면접', '처우 협의', '합격', '불합격']
const STAGE_COLORS = {
  '서류 검토': 'bg-slate-400',
  '1차 면접':  'bg-blue-400',
  '2차 면접':  'bg-indigo-500',
  '처우 협의': 'bg-amber-400',
  '합격':      'bg-emerald-500',
  '불합격':    'bg-rose-400',
}
const STAGE_TEXT_COLORS = {
  '서류 검토': 'text-slate-600',
  '1차 면접':  'text-blue-600',
  '2차 면접':  'text-indigo-600',
  '처우 협의': 'text-amber-600',
  '합격':      'text-emerald-600',
  '불합격':    'text-rose-500',
}
const stageDistribution = computed(() =>
  STAGES.map(s => ({
    stage: s,
    count: applicants.value.filter(a => a.status === s).length,
    color: STAGE_COLORS[s],
    textColor: STAGE_TEXT_COLORS[s],
  }))
)
const maxStageCount = computed(() => Math.max(...stageDistribution.value.map(s => s.count), 1))

// ── 공고별 지원자 ────────────────────────────────────────────────────────────
const maxJobApplicants = computed(() => Math.max(...jobs.value.map(j => j.totalApplicants), 1))

const jobStatusColor = (status) => {
  if (status === 'active')  return 'bg-brand-100 text-brand-700'
  if (status === 'urgent')  return 'bg-rose-100 text-rose-700'
  if (status === 'closed')  return 'bg-slate-100 text-slate-500'
  return 'bg-gray-100 text-gray-600'
}
const jobStatusLabel = (status) => {
  if (status === 'active')  return '진행 중'
  if (status === 'urgent')  return '마감 임박'
  if (status === 'closed')  return '종료됨'
  return status
}

// ── 직무별 지원자 ────────────────────────────────────────────────────────────
const jobTypes = computed(() => {
  const map = {}
  applicants.value.forEach(a => { map[a.job] = (map[a.job] || 0) + 1 })
  return Object.entries(map)
    .map(([job, count]) => ({ job, count }))
    .sort((a, b) => b.count - a.count)
})
const maxJobType = computed(() => Math.max(...jobTypes.value.map(j => j.count), 1))
const JOB_BAR_COLORS = ['bg-brand-500', 'bg-indigo-500', 'bg-amber-500', 'bg-emerald-500']

// ── 회의실별 예약 건수 ────────────────────────────────────────────────────────
const roomBookingCounts = computed(() => {
  const map = {}
  bookings.value.forEach(b => {
    if (!map[b.roomName]) map[b.roomName] = 0
    map[b.roomName]++
  })
  return Object.entries(map)
    .map(([room, count]) => ({ room, count }))
    .sort((a, b) => b.count - a.count)
})
const maxRoomCount = computed(() => Math.max(...roomBookingCounts.value.map(r => r.count), 1))

// ── 예약 유형 분포 ────────────────────────────────────────────────────────────
const bookingTypes = computed(() => {
  const map = { '면접': 0, '일반회의': 0, '기타': 0 }
  bookings.value.forEach(b => { if (map[b.type] !== undefined) map[b.type]++ })
  const total = bookings.value.length || 1
  return Object.entries(map).map(([type, count]) => ({
    type, count, percent: Math.round((count / total) * 100)
  }))
})
const BOOKING_TYPE_COLORS = { '면접': 'bg-brand-500', '일반회의': 'bg-indigo-400', '기타': 'bg-slate-300' }
const BOOKING_TYPE_TEXT   = { '면접': 'text-brand-600', '일반회의': 'text-indigo-600', '기타': 'text-slate-500' }

// ── 월별 최대값 ──────────────────────────────────────────────────────────────
const maxMonthly = computed(() => Math.max(...monthlyApplicants.value.map(m => m.count), 1))

const formatPercent = (v) => v + '%'
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-end">
      <span class="text-sm text-gray-400">기준: 2026년 2월</span>
    </div>

    <!-- KPI 요약 카드 -->
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-5">
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-1 bg-brand-500" />
        <p class="text-sm text-gray-500 mb-1">전체 지원자</p>
        <p class="text-3xl font-bold text-gray-900">{{ totalApplicants }}<span class="text-base font-normal text-gray-400 ml-1">명</span></p>
        <p class="text-xs text-gray-400 mt-1">진행 중 {{ inProgressCount }}명 포함</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
        <p class="text-sm text-gray-500 mb-1">진행 중 공고</p>
        <p class="text-3xl font-bold text-gray-900">{{ activeJobCount }}<span class="text-base font-normal text-gray-400 ml-1">건</span></p>
        <p class="text-xs text-gray-400 mt-1">전체 {{ jobs.length }}건 중</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
        <p class="text-sm text-gray-500 mb-1">이번 달 회의실 예약</p>
        <p class="text-3xl font-bold text-gray-900">{{ bookingCount }}<span class="text-base font-normal text-gray-400 ml-1">건</span></p>
        <p class="text-xs text-gray-400 mt-1">회의실 {{ roomBookingCounts.length }}개 이용</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
        <p class="text-sm text-gray-500 mb-1">채용 전환율</p>
        <p class="text-3xl font-bold text-gray-900">{{ passRate }}<span class="text-base font-normal text-gray-400 ml-1">%</span></p>
        <p class="text-xs text-gray-400 mt-1">합격 {{ passedCount }}명 / 불합격 {{ failedCount }}명</p>
      </div>
    </div>

    <!-- 채용 & 지원자 현황 -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

      <!-- 전형 단계별 지원자 분포 -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 class="text-base font-bold text-gray-800 mb-6">전형 단계별 지원자 분포</h3>
        <div class="space-y-4">
          <div v-for="s in stageDistribution" :key="s.stage" class="flex items-center gap-3">
            <span class="text-sm w-20 shrink-0" :class="s.textColor">{{ s.stage }}</span>
            <div class="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
              <div
                class="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700 min-w-[2rem]"
                :class="s.color"
                :style="{ width: (s.count / maxStageCount * 100) + '%' }"
              >
                <span class="text-white text-xs font-bold">{{ s.count }}</span>
              </div>
            </div>
            <span class="text-xs text-gray-400 w-6 text-right shrink-0">명</span>
          </div>
        </div>
      </div>

      <!-- 공고별 지원자 수 -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 class="text-base font-bold text-gray-800 mb-6">공고별 지원자 현황</h3>
        <div class="space-y-5">
          <div v-for="job in jobs" :key="job.id">
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-sm text-gray-700 font-medium truncate">{{ job.title }}</span>
                <span class="px-1.5 py-0.5 rounded text-xs font-semibold shrink-0" :class="jobStatusColor(job.status)">{{ jobStatusLabel(job.status) }}</span>
              </div>
              <span class="text-sm font-bold text-gray-800 shrink-0 ml-2">{{ job.totalApplicants }}명</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700"
                :class="job.status === 'closed' ? 'bg-slate-300' : 'bg-brand-400'"
                :style="{ width: (job.totalApplicants / maxJobApplicants * 100) + '%' }"
              />
            </div>
            <p class="text-xs text-gray-400 mt-1">{{ job.team }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 월별 지원자 추이 -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 class="text-base font-bold text-gray-800 mb-6">월별 신규 지원자 추이 (최근 6개월)</h3>
      <div class="flex items-end gap-6 h-48 px-4">
        <div v-for="m in monthlyApplicants" :key="m.month" class="flex-1 flex flex-col items-center gap-1">
          <span class="text-xs font-semibold mb-1" :class="m.current ? 'text-brand-600' : 'text-gray-500'">
            {{ m.count }}
          </span>
          <div class="w-full flex justify-center items-end" style="height: 160px">
            <div
              class="w-full max-w-[56px] rounded-t transition-all duration-500"
              :class="m.current ? 'bg-brand-400' : 'bg-gray-200'"
              :style="{ height: (m.count / maxMonthly * 100) + '%' }"
            />
          </div>
          <span class="text-xs font-medium mt-1" :class="m.current ? 'text-brand-500' : 'text-gray-400'">
            {{ m.month }}
          </span>
        </div>
      </div>
    </div>

    <!-- 직무별 분포 & 회의실 이용 현황 -->
    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">

      <!-- 직무별 지원자 분포 -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 class="text-base font-bold text-gray-800 mb-6">직무별 지원자 분포</h3>
        <div class="space-y-4">
          <div v-for="(item, idx) in jobTypes" :key="item.job" class="flex items-center gap-3">
            <span class="text-sm text-gray-600 w-32 shrink-0 truncate">{{ item.job }}</span>
            <div class="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
              <div
                class="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700 min-w-[2rem]"
                :class="JOB_BAR_COLORS[idx % JOB_BAR_COLORS.length]"
                :style="{ width: (item.count / maxJobType * 100) + '%' }"
              >
                <span class="text-white text-xs font-bold">{{ item.count }}</span>
              </div>
            </div>
            <span class="text-xs text-gray-400 w-6 text-right shrink-0">명</span>
          </div>
        </div>
      </div>

      <!-- 회의실 이용 현황 -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 class="text-base font-bold text-gray-800 mb-6">회의실 이용 현황</h3>

        <!-- 회의실별 예약 건수 -->
        <div class="space-y-3 mb-6">
          <div v-for="r in roomBookingCounts" :key="r.room" class="flex items-center gap-3">
            <span class="text-sm text-gray-600 w-20 shrink-0">{{ r.room }}</span>
            <div class="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
              <div
                class="h-full bg-amber-400 rounded-full flex items-center justify-end pr-2.5 transition-all duration-700 min-w-[2rem]"
                :style="{ width: (r.count / maxRoomCount * 100) + '%' }"
              >
                <span class="text-white text-xs font-bold">{{ r.count }}</span>
              </div>
            </div>
            <span class="text-xs text-gray-400 w-6 text-right shrink-0">건</span>
          </div>
        </div>

        <!-- 예약 유형 구분선 -->
        <div class="border-t border-gray-100 pt-5">
          <p class="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">예약 유형 분포</p>
          <!-- 스택 바 -->
          <div class="flex rounded-full overflow-hidden h-4 mb-3">
            <div
              v-for="t in bookingTypes"
              :key="t.type"
              :class="BOOKING_TYPE_COLORS[t.type]"
              :style="{ width: t.percent + '%' }"
              class="transition-all duration-700"
            />
          </div>
          <div class="flex items-center gap-5">
            <div v-for="t in bookingTypes" :key="t.type" class="flex items-center gap-1.5">
              <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="BOOKING_TYPE_COLORS[t.type]" />
              <span class="text-xs text-gray-600">{{ t.type }}</span>
              <span class="text-xs font-bold" :class="BOOKING_TYPE_TEXT[t.type]">{{ t.count }}건 ({{ t.percent }}%)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
