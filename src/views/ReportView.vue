<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import reportApi from '@/api/report'

// ── 탭 관리 ───────────────────────────────────────────────────────────────────
const tabs = [
  { id: 'pipeline', label: '파이프라인' },
  { id: 'performance', label: '공고 성과' },
  { id: 'interview', label: '면접 운영' },
  { id: 'automation', label: '자동화' },
]
const activeTab = ref('pipeline')

// ── 로딩 상태 ──────────────────────────────────────────────────────────────────
const kpiLoading = ref(false)
const tabLoading = ref(false)

// ── KPI 데이터 ─────────────────────────────────────────────────────────────────
const kpi = ref({
  totalApplicants: 0,
  inProgressCount: 0,
  activeRecruitments: 0,
  totalRecruitments: 0,
  passCount: 0,
  failCount: 0,
  conversionRate: 0,
})

// ── 파이프라인 데이터 ──────────────────────────────────────────────────────────
const stageDistribution = ref([])
const monthlyTrend = ref([])

// ── 공고 성과 데이터 ──────────────────────────────────────────────────────────
const recruitmentPerformance = ref([])

// ── 면접 운영 데이터 ──────────────────────────────────────────────────────────
const interviewReport = ref(null)

// ── 자동화 데이터 ─────────────────────────────────────────────────────────────
const automationReport = ref(null)

// ── 스타일 맵 ──────────────────────────────────────────────────────────────────
const STAGE_STYLES = {
  DOCUMENT:  { color: 'bg-slate-400',    textColor: 'text-slate-600' },
  INTERVIEW: { color: 'bg-blue-400',     textColor: 'text-blue-600' },
  TEST:      { color: 'bg-indigo-500',   textColor: 'text-indigo-600' },
  OFFER:     { color: 'bg-amber-400',    textColor: 'text-amber-600' },
  PASS:      { color: 'bg-emerald-500',  textColor: 'text-emerald-600' },
  FAIL:      { color: 'bg-rose-400',     textColor: 'text-rose-500' },
}

const INTERVIEW_STATUS_STYLES = {
  PENDING:   { color: 'bg-slate-400',    textColor: 'text-slate-600' },
  CONFIRMED: { color: 'bg-blue-400',     textColor: 'text-blue-600' },
  COMPLETED: { color: 'bg-emerald-500',  textColor: 'text-emerald-600' },
  CANCELLED: { color: 'bg-rose-400',     textColor: 'text-rose-500' },
}

const EVENT_STATUS_STYLES = {
  SUCCESS: { color: 'bg-emerald-500', textColor: 'text-emerald-600' },
  FAILED:  { color: 'bg-rose-400',    textColor: 'text-rose-500' },
  PENDING: { color: 'bg-amber-400',   textColor: 'text-amber-600' },
}

const EVENT_STATUS_LABELS = {
  SUCCESS: '성공',
  FAILED:  '실패',
  PENDING: '대기',
}

// ── 계산 값 ────────────────────────────────────────────────────────────────────
const maxStageCount = computed(() =>
  Math.max(...stageDistribution.value.map(s => s.count), 1)
)
const maxMonthly = computed(() =>
  Math.max(...monthlyTrend.value.map(m => m.count), 1)
)
const maxApplicants = computed(() =>
  Math.max(...recruitmentPerformance.value.map(r => r.applicantCount), 1)
)
const maxInterviewStatus = computed(() =>
  interviewReport.value
    ? Math.max(...interviewReport.value.statusDistribution.map(s => s.count), 1)
    : 1
)
const maxRoomUsage = computed(() =>
  interviewReport.value?.roomUsage?.length
    ? Math.max(...interviewReport.value.roomUsage.map(r => r.count), 1)
    : 1
)

const statusColor = (status) => {
  if (status === 'OPEN')   return 'bg-brand-100 text-brand-700'
  if (status === 'DRAFT')  return 'bg-slate-100 text-slate-500'
  if (status === 'CLOSED') return 'bg-rose-100 text-rose-600'
  return 'bg-gray-100 text-gray-600'
}
const statusLabel = (status) => {
  if (status === 'OPEN')   return '진행 중'
  if (status === 'DRAFT')  return '작성 중'
  if (status === 'CLOSED') return '종료됨'
  return status
}

const formatMonth = (monthStr) => {
  const parts = monthStr.split('-')
  return `${parseInt(parts[1])}월`
}

// ── API 호출 ───────────────────────────────────────────────────────────────────
const loadKpi = async () => {
  kpiLoading.value = true
  try {
    const res = await reportApi.getKpi()
    kpi.value = res.data.data
  } catch (e) {
    console.error('KPI 로드 실패:', e)
  } finally {
    kpiLoading.value = false
  }
}

const loadPipeline = async () => {
  tabLoading.value = true
  try {
    const res = await reportApi.getPipeline(6)
    stageDistribution.value = res.data.data.stageDistribution
    monthlyTrend.value = res.data.data.monthlyTrend
  } catch (e) {
    console.error('파이프라인 로드 실패:', e)
  } finally {
    tabLoading.value = false
  }
}

const loadRecruitmentPerformance = async () => {
  tabLoading.value = true
  try {
    const res = await reportApi.getRecruitmentPerformance()
    recruitmentPerformance.value = res.data.data
  } catch (e) {
    console.error('공고 성과 로드 실패:', e)
  } finally {
    tabLoading.value = false
  }
}

const loadInterviewReport = async () => {
  tabLoading.value = true
  try {
    const res = await reportApi.getInterviewReport()
    interviewReport.value = res.data.data
  } catch (e) {
    console.error('면접 운영 로드 실패:', e)
  } finally {
    tabLoading.value = false
  }
}

const loadAutomationReport = async () => {
  tabLoading.value = true
  try {
    const res = await reportApi.getAutomationReport()
    automationReport.value = res.data.data
  } catch (e) {
    console.error('자동화 로드 실패:', e)
  } finally {
    tabLoading.value = false
  }
}

const loadTabData = (tabId) => {
  if (tabId === 'pipeline') loadPipeline()
  else if (tabId === 'performance') loadRecruitmentPerformance()
  else if (tabId === 'interview') loadInterviewReport()
  else if (tabId === 'automation') loadAutomationReport()
}

watch(activeTab, (tabId) => loadTabData(tabId))

onMounted(() => {
  loadKpi()
  loadTabData(activeTab.value)
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <h2 class="text-lg font-bold text-gray-100">채용 리포트</h2>
    </div>

    <!-- ═══ KPI 요약 카드 (항상 노출) ═══ -->
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-5">
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-1 bg-brand-500" />
        <p class="text-sm text-gray-500 mb-1">전체 지원자</p>
        <p class="text-3xl font-bold text-gray-900">
          {{ kpi.totalApplicants }}<span class="text-base font-normal text-gray-400 ml-1">명</span>
        </p>
        <p class="text-xs text-gray-400 mt-1">진행 중 {{ kpi.inProgressCount }}명 포함</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
        <p class="text-sm text-gray-500 mb-1">진행 중 공고</p>
        <p class="text-3xl font-bold text-gray-900">
          {{ kpi.activeRecruitments }}<span class="text-base font-normal text-gray-400 ml-1">건</span>
        </p>
        <p class="text-xs text-gray-400 mt-1">전체 {{ kpi.totalRecruitments }}건 중</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
        <p class="text-sm text-gray-500 mb-1">채용 전환율</p>
        <p class="text-3xl font-bold text-gray-900">
          {{ kpi.conversionRate }}<span class="text-base font-normal text-gray-400 ml-1">%</span>
        </p>
        <p class="text-xs text-gray-400 mt-1">합격 {{ kpi.passCount }}명 / 불합격 {{ kpi.failCount }}명</p>
      </div>
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
        <div class="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
        <p class="text-sm text-gray-500 mb-1">합격자</p>
        <p class="text-3xl font-bold text-gray-900">
          {{ kpi.passCount }}<span class="text-base font-normal text-gray-400 ml-1">명</span>
        </p>
        <p class="text-xs text-gray-400 mt-1">전체 {{ kpi.totalApplicants }}명 중</p>
      </div>
    </div>

    <!-- ═══ 탭 네비게이션 ═══ -->
    <div class="border-b border-gray-200">
      <nav class="flex gap-1 -mb-px">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors"
          :class="activeTab === tab.id
            ? 'bg-white border border-b-white border-gray-200 text-brand-600 -mb-px'
            : 'text-gray-400 hover:text-gray-600'"
        >
          {{ tab.label }}
        </button>
      </nav>
    </div>

    <!-- ═══ 탭 로딩 ═══ -->
    <div v-if="tabLoading" class="flex justify-center py-16">
      <div class="w-8 h-8 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 파이프라인 탭                                                          -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'pipeline'" class="space-y-6">
      <!-- 전형 단계별 지원자 분포 -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 class="text-base font-bold text-gray-800 mb-6">전형 단계별 지원자 분포</h3>
        <div v-if="stageDistribution.length === 0" class="text-center py-8 text-gray-400 text-sm">데이터가 없습니다</div>
        <div v-else class="space-y-4">
          <div v-for="s in stageDistribution" :key="s.stageType" class="flex items-center gap-3">
            <span
              class="text-sm w-20 shrink-0"
              :class="STAGE_STYLES[s.stageType]?.textColor || 'text-gray-600'"
            >{{ s.label }}</span>
            <div class="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
              <div
                v-if="s.count > 0"
                class="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700 min-w-[2rem]"
                :class="STAGE_STYLES[s.stageType]?.color || 'bg-gray-400'"
                :style="{ width: (s.count / maxStageCount * 100) + '%' }"
              >
                <span class="text-white text-xs font-bold">{{ s.count }}</span>
              </div>
            </div>
            <span class="text-xs text-gray-400 w-6 text-right shrink-0">명</span>
          </div>
        </div>
      </div>

      <!-- 월별 신규 지원자 추이 -->
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 class="text-base font-bold text-gray-800 mb-6">월별 신규 지원자 추이 (최근 6개월)</h3>
        <div v-if="monthlyTrend.length === 0" class="text-center py-8 text-gray-400 text-sm">데이터가 없습니다</div>
        <div v-else class="flex items-end gap-6 h-48 px-4">
          <div v-for="(m, idx) in monthlyTrend" :key="m.month" class="flex-1 flex flex-col items-center gap-1">
            <span
              class="text-xs font-semibold mb-1"
              :class="idx === monthlyTrend.length - 1 ? 'text-brand-600' : 'text-gray-500'"
            >{{ m.count }}</span>
            <div class="w-full flex justify-center items-end" style="height: 160px">
              <div
                class="w-full max-w-[56px] rounded-t transition-all duration-500"
                :class="idx === monthlyTrend.length - 1 ? 'bg-brand-400' : 'bg-gray-200'"
                :style="{ height: (m.count / maxMonthly * 100) + '%', minHeight: m.count > 0 ? '8px' : '0' }"
              />
            </div>
            <span
              class="text-xs font-medium mt-1"
              :class="idx === monthlyTrend.length - 1 ? 'text-brand-500' : 'text-gray-400'"
            >{{ formatMonth(m.month) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 공고 성과 탭                                                           -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'performance'" class="space-y-6">
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 class="text-base font-bold text-gray-800 mb-6">공고별 지원자 현황</h3>
        <div v-if="recruitmentPerformance.length === 0" class="text-center py-8 text-gray-400 text-sm">등록된 공고가 없습니다</div>
        <div v-else class="space-y-5">
          <div v-for="r in recruitmentPerformance" :key="r.recruitmentId">
            <div class="flex items-center justify-between mb-1.5">
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-sm text-gray-700 font-medium truncate">{{ r.title }}</span>
                <span
                  class="px-1.5 py-0.5 rounded text-xs font-semibold shrink-0"
                  :class="statusColor(r.status)"
                >{{ statusLabel(r.status) }}</span>
              </div>
              <span class="text-sm font-bold text-gray-800 shrink-0 ml-2">{{ r.applicantCount }}명</span>
            </div>
            <div class="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                class="h-full rounded-full transition-all duration-700"
                :class="r.status === 'CLOSED' ? 'bg-slate-300' : 'bg-brand-400'"
                :style="{ width: (r.applicantCount / maxApplicants * 100) + '%', minWidth: r.applicantCount > 0 ? '8px' : '0' }"
              />
            </div>
            <div class="flex items-center gap-4 mt-1">
              <p class="text-xs text-gray-400">목표 {{ r.targetCount }}명</p>
              <p v-if="r.passCount > 0" class="text-xs text-emerald-500">합격 {{ r.passCount }}명</p>
              <p v-if="r.targetCount > 0" class="text-xs" :class="r.passCount >= r.targetCount ? 'text-emerald-500 font-semibold' : 'text-gray-400'">
                달성률 {{ Math.round(r.passCount / r.targetCount * 100) }}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 면접 운영 탭                                                           -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'interview'" class="space-y-6">
      <template v-if="interviewReport">
        <!-- 면접 KPI 카드 -->
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-5">
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
            <p class="text-sm text-gray-500 mb-1">전체 면접</p>
            <p class="text-2xl font-bold text-gray-900">{{ interviewReport.totalInterviews }}<span class="text-sm font-normal text-gray-400 ml-1">건</span></p>
          </div>
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
            <p class="text-sm text-gray-500 mb-1">완료</p>
            <p class="text-2xl font-bold text-gray-900">{{ interviewReport.completedCount }}<span class="text-sm font-normal text-gray-400 ml-1">건</span></p>
          </div>
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1 bg-rose-400" />
            <p class="text-sm text-gray-500 mb-1">취소율</p>
            <p class="text-2xl font-bold text-gray-900">{{ interviewReport.cancelRate }}<span class="text-sm font-normal text-gray-400 ml-1">%</span></p>
            <p class="text-xs text-gray-400 mt-0.5">취소 {{ interviewReport.cancelledCount }}건</p>
          </div>
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1 bg-amber-400" />
            <p class="text-sm text-gray-500 mb-1">평균 면접 시간</p>
            <p class="text-2xl font-bold text-gray-900">{{ interviewReport.avgDurationMinutes }}<span class="text-sm font-normal text-gray-400 ml-1">분</span></p>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <!-- 면접 상태별 분포 -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 class="text-base font-bold text-gray-800 mb-6">면접 상태별 분포</h3>
            <div v-if="interviewReport.totalInterviews === 0" class="text-center py-8 text-gray-400 text-sm">면접 데이터가 없습니다</div>
            <div v-else class="space-y-4">
              <div v-for="s in interviewReport.statusDistribution" :key="s.status" class="flex items-center gap-3">
                <span
                  class="text-sm w-16 shrink-0"
                  :class="INTERVIEW_STATUS_STYLES[s.status]?.textColor || 'text-gray-600'"
                >{{ s.label }}</span>
                <div class="flex-1 bg-gray-100 rounded-full h-7 overflow-hidden">
                  <div
                    v-if="s.count > 0"
                    class="h-full rounded-full flex items-center justify-end pr-3 transition-all duration-700 min-w-[2rem]"
                    :class="INTERVIEW_STATUS_STYLES[s.status]?.color || 'bg-gray-400'"
                    :style="{ width: (s.count / maxInterviewStatus * 100) + '%' }"
                  >
                    <span class="text-white text-xs font-bold">{{ s.count }}</span>
                  </div>
                </div>
                <span class="text-xs text-gray-400 w-6 text-right shrink-0">건</span>
              </div>
            </div>
          </div>


        </div>

        <!-- 회의실별 면접 건수 -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 class="text-base font-bold text-gray-800 mb-6">회의실별 면접 건수</h3>
          <div v-if="!interviewReport.roomUsage?.length" class="text-center py-8 text-gray-400 text-sm">회의실 데이터가 없습니다</div>
          <div v-else class="space-y-3">
            <div v-for="r in interviewReport.roomUsage" :key="r.roomName" class="flex items-center gap-3">
              <span class="text-sm text-gray-600 w-24 shrink-0 truncate">{{ r.roomName }}</span>
              <div class="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                <div
                  class="h-full bg-amber-400 rounded-full flex items-center justify-end pr-2.5 transition-all duration-700 min-w-[2rem]"
                  :style="{ width: (r.count / maxRoomUsage * 100) + '%' }"
                >
                  <span class="text-white text-xs font-bold">{{ r.count }}</span>
                </div>
              </div>
              <span class="text-xs text-gray-400 w-6 text-right shrink-0">건</span>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="text-center py-16 text-gray-400 text-sm">데이터를 불러오는 중...</div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <!-- 자동화 탭                                                              -->
    <!-- ═══════════════════════════════════════════════════════════════════════ -->
    <div v-else-if="activeTab === 'automation'" class="space-y-6">
      <template v-if="automationReport">
        <!-- 자동화 KPI 카드 -->
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-5">
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1 bg-indigo-500" />
            <p class="text-sm text-gray-500 mb-1">전체 규칙</p>
            <p class="text-2xl font-bold text-gray-900">{{ automationReport.totalRules }}<span class="text-sm font-normal text-gray-400 ml-1">개</span></p>
          </div>
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />
            <p class="text-sm text-gray-500 mb-1">실행 이벤트</p>
            <p class="text-2xl font-bold text-gray-900">{{ automationReport.totalEvents }}<span class="text-sm font-normal text-gray-400 ml-1">건</span></p>
            <p class="text-xs text-gray-400 mt-0.5">성공 {{ automationReport.successCount }}건</p>
          </div>
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1 bg-rose-400" />
            <p class="text-sm text-gray-500 mb-1">실패율</p>
            <p class="text-2xl font-bold text-gray-900">{{ automationReport.failureRate }}<span class="text-sm font-normal text-gray-400 ml-1">%</span></p>
            <p class="text-xs text-gray-400 mt-0.5">실패 {{ automationReport.failedCount }}건</p>
          </div>
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 relative overflow-hidden">
            <div class="absolute top-0 left-0 right-0 h-1 bg-brand-500" />
            <p class="text-sm text-gray-500 mb-1">자동화 채택률</p>
            <p class="text-2xl font-bold text-gray-900">{{ automationReport.adoptionRate }}<span class="text-sm font-normal text-gray-400 ml-1">%</span></p>
            <p class="text-xs text-gray-400 mt-0.5">{{ automationReport.automatedRecruitments }} / {{ automationReport.totalRecruitments }} 공고</p>
          </div>
        </div>

        <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <!-- 실행 상태 분포 -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 class="text-base font-bold text-gray-800 mb-6">실행 상태 분포</h3>
            <div v-if="automationReport.totalEvents === 0" class="text-center py-8 text-gray-400 text-sm">실행 데이터가 없습니다</div>
            <template v-else>
              <!-- 스택 바 -->
              <div class="flex rounded-full overflow-hidden h-5 mb-4">
                <div
                  v-for="s in automationReport.eventStatusDistribution"
                  :key="s.status"
                  :class="EVENT_STATUS_STYLES[s.status]?.color || 'bg-gray-300'"
                  :style="{ width: (s.count / automationReport.totalEvents * 100) + '%' }"
                  class="transition-all duration-700"
                />
              </div>
              <div class="flex items-center gap-5 flex-wrap">
                <div v-for="s in automationReport.eventStatusDistribution" :key="s.status" class="flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="EVENT_STATUS_STYLES[s.status]?.color || 'bg-gray-300'" />
                  <span class="text-xs text-gray-600">{{ EVENT_STATUS_LABELS[s.status] || s.status }}</span>
                  <span class="text-xs font-bold" :class="EVENT_STATUS_STYLES[s.status]?.textColor || 'text-gray-500'">
                    {{ s.count }}건 ({{ automationReport.totalEvents > 0 ? Math.round(s.count / automationReport.totalEvents * 100) : 0 }}%)
                  </span>
                </div>
              </div>
            </template>
          </div>

          <!-- 액션 타입별 통계 -->
          <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 class="text-base font-bold text-gray-800 mb-6">채널별 자동화 통계</h3>
            <div v-if="automationReport.totalEvents === 0" class="text-center py-8 text-gray-400 text-sm">실행 데이터가 없습니다</div>
            <div v-else class="space-y-5">
              <div v-for="a in automationReport.actionTypeDistribution" :key="a.actionType" class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  :class="a.actionType === 'EMAIL' ? 'bg-blue-50' : 'bg-purple-50'">
                  <!-- Email icon -->
                  <svg v-if="a.actionType === 'EMAIL'" class="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <!-- Slack icon -->
                  <svg v-else class="w-6 h-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-sm font-medium text-gray-700">{{ a.actionType === 'EMAIL' ? '이메일' : 'Slack' }}</span>
                    <span class="text-sm font-bold text-gray-800">{{ a.count }}건</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      class="h-full rounded-full transition-all duration-700"
                      :class="a.actionType === 'EMAIL' ? 'bg-blue-400' : 'bg-purple-400'"
                      :style="{ width: (automationReport.totalEvents > 0 ? a.count / automationReport.totalEvents * 100 : 0) + '%' }"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <div v-else class="text-center py-16 text-gray-400 text-sm">데이터를 불러오는 중...</div>
    </div>
  </div>
</template>
