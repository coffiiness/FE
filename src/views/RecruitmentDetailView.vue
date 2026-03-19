<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ScheduleListModal from '@/components/schedule/ScheduleListModal.vue'
import ScheduleDetailDrawer from '@/components/schedule/ScheduleDetailDrawer.vue'
import { applicationBoardApi } from '@/api/applicationBoard'
import { automationRulesApi } from '@/api/automationRules'
import { automationTemplatesApi } from '@/api/automationTemplates'
import { memberApi } from '@/api/member'
import { recruitmentApi } from '@/api/recruitment'
import { useAuth } from '@/composables/useAuth'
// Stores
import { useRecruitmentStore } from '@/stores/recruitment'
import { useOrganizationStore } from '@/stores/organization'
import { useScheduleStore } from '@/stores/schedule'
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const jobId = Number(route.params.id)

const recruitmentStore = useRecruitmentStore()
const organizationStore = useOrganizationStore()
const scheduleStore = useScheduleStore()
const { user } = useAuth()

const { jobs } = storeToRefs(recruitmentStore)
const { organizations } = storeToRefs(organizationStore)

// --- 상태 관리 ---
const activeTab = ref('CALENDAR') // 'CALENDAR' | 'APPLICANTS'
const applicantSearchQuery = ref('')
const applicants = ref([])
const applicantBoardColumns = ref([])
const applicantBoardLoading = ref(false)
const applicantBoardLoaded = ref(false)
const applicantBoardError = ref('')
const movingApplicationId = ref(null)
const bulkMoving = ref(false)
const selectedApplicationIds = ref([])
const bulkTargetProcessId = ref('')
const bulkMoveResultModal = ref({
  open: false,
  title: '',
  message: ''
})
const memberType = ref('')
const automationRules = ref([])
const automationTemplates = ref([])
const automationTemplatesLoading = ref(false)
const automationLoading = ref(false)
const automationError = ref('')
const automationSaving = ref(false)
const editingRuleId = ref(null)
const openProcessMenuId = ref(null)
const ruleModalProcessId = ref(null)
const automationForm = ref({
  recruitmentProcessId: '',
  triggerType: 'ON_ENTER',
  actionType: 'EMAIL',
  templateCode: ''
})
const draggingCardId = ref(null)
const draggingOverColumnId = ref(null)
const applicantBoardScrollRef = ref(null)
const autoScrollDirection = ref(0)
const autoScrollFrameId = ref(null)

// --- Modal State ---
const isInterviewDetailModalOpen = ref(false)
const selectedInterview = ref(null)
const isInterviewListModalOpen = ref(false)
const showCopyModal = ref(false) // 링크 복사 모달
const apiSchedules = ref([])
const recruitmentDetail = ref(null)
const applicantDetailModalOpen = ref(false)
const applicantDetailLoading = ref(false)
const applicantDetailError = ref('')
const applicantDetail = ref(null)
const downloadingApplicantFileId = ref(null)

// --- Calendar State (New) ---
const calendarState = reactive({
  currentMonth: new Date(), // 현재 날짜로 초기화
})

const currentView = ref('MONTH')
const viewOptions = [
  { label: '일', value: 'DAY' },
  { label: '주', value: 'WEEK' },
  { label: '월', value: 'MONTH' }
]

const timeSlots = Array.from({ length: 12 }, (_, i) => `${i + 9 < 10 ? '0' : ''}${i + 9}:00`)

const selectedDay = ref(null)
const expandedBookingIds = ref(new Set())

const toPositiveNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
}

const getMemberUserId = (member) => {
  return toPositiveNumber(member?.userId ?? member?.id ?? member?.memberId)
}

const firstFilledString = (...values) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return ''
}

const normalizeDisplayName = (value) => {
  const text = String(value || '').trim()
  if (!text || text === '?' || text === '알 수 없음') return ''
  return text
}

const splitNames = (value) => {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

const getUniqueNames = (values) => {
  return values
    .map((value) => normalizeDisplayName(value))
    .filter((name, index, names) => name && names.indexOf(name) === index)
}

const currentUserId = computed(() => toPositiveNumber(user.value?.id))
const currentUserName = computed(() => normalizeDisplayName(user.value?.name))

const looksLikeRecruitmentDetail = (candidate) => {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) return false

  return (
    candidate.id !== undefined ||
    typeof candidate.title === 'string' ||
    typeof candidate.leadGroupName === 'string' ||
    Array.isArray(candidate.interviewers) ||
    Array.isArray(candidate.stages)
  )
}

const extractRecruitmentDetail = (response) => {
  const payload = response?.data ?? response
  const candidates = [
    payload?.data?.data,
    payload?.data,
    payload?.result?.data,
    payload?.result,
    payload?.recruitment,
    payload?.item,
    payload
  ]

  return candidates.find(looksLikeRecruitmentDetail) || null
}

const isCurrentUserMember = (member) => {
  const memberUserId = getMemberUserId(member)
  return !!memberUserId && !!currentUserId.value && memberUserId === currentUserId.value
}

const getInterviewerLabel = (member) => {
  const name = normalizeDisplayName(member?.displayName || member?.name)
  if (!name) return '이름 없음'
  return isCurrentUserMember(member) ? `${name} (나)` : name
}

const getAllMembers = () => {
  return organizations.value.flatMap((dept) =>
    (dept.teams || []).flatMap((team) => team.members || [])
  )
}

const getTeamNameById = (teamId) => {
  const id = toPositiveNumber(teamId)
  if (!id) return ''

  for (const dept of organizations.value) {
    for (const team of dept.teams || []) {
      if (Number(team.id) === id) {
        return `${dept.name} > ${team.name}`
      }
    }
  }

  return ''
}

const resolveLeadGroupName = (job) => {
  return (
    normalizeDisplayName(job.leadGroupName) ||
    normalizeDisplayName(job.leadTeamName) ||
    normalizeDisplayName(job.team) ||
    getTeamNameById(job.leadGroupId ?? job.leadTeamId ?? job.teamId) ||
    '부서 미지정'
  )
}

const resolveInterviewerInfo = (job) => {
  const names = []
  const ids = []
  const addName = (candidate) => {
    const normalized = normalizeDisplayName(candidate)
    if (!normalized) return
    if (!names.includes(normalized)) names.push(normalized)
  }

  const addId = (idCandidate) => {
    const id = toPositiveNumber(idCandidate)
    if (!id) return
    if (!ids.includes(id)) ids.push(id)

    const mappedName = memberNameById.get(id)
    if (mappedName) addName(mappedName)
  }

  const memberNameById = new Map(
    getAllMembers()
      .map((member) => [getMemberUserId(member), normalizeDisplayName(member.name)])
      .filter(([id, name]) => id && name)
  )

  const assignees = Array.isArray(job.assignees) ? job.assignees : []
  const explicitInterviewerIds = Array.isArray(job.interviewerIds) ? job.interviewerIds : []
  const interviewers = Array.isArray(job.interviewers) ? job.interviewers : []

  explicitInterviewerIds.forEach((value) => {
    if (typeof value === 'object' && value !== null) {
      addId(value.userId ?? value.memberId ?? value.id)
      addName(value.name)
      return
    }

    addId(value)
  })

  assignees.forEach((assignee) => {
    addId(assignee?.userId ?? assignee?.memberId ?? assignee?.id)
    addName(assignee?.name)
  })

  interviewers.forEach((interviewer) => {
    if (typeof interviewer === 'string') {
      addName(interviewer)
      return
    }

    addId(interviewer?.userId ?? interviewer?.memberId ?? interviewer?.id)
    addName(interviewer?.name)
  })

  return { ids, names }
}

// --- Constants ---
const labels = {
  allInterviewers: '전체 면접관',
  todayMove: '오늘로 이동',
  more: '더보기',
  dayNone: '등록된 면접이 없습니다.',
  dayPick: '날짜를 선택하세요',
  dayBookings: '당일 면접',
  daySuffix: '면접 일정',
  host: '면접관',
  detail: '면접 상세 보기',
  noDesc: '설명이 없습니다.',
  close: '닫기'
}

const koDays = ['일', '월', '화', '수', '목', '금', '토']
const interviewerPalette = ['#0f766e', '#2563eb', '#7c3aed', '#ea580c', '#dc2626', '#0891b2', '#65a30d', '#db2777']

const getPaletteColor = (seed = 0) => {
  const paletteSize = interviewerPalette.length
  const index = Math.abs(Number(seed) || 0) % paletteSize
  return interviewerPalette[index] || '#64748b'
}

const hashString = (value) => {
  return String(value || '')
    .split('')
    .reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) >>> 0, 0)
}

const stripMeSuffix = (value) => String(value || '').replace(/\s*\(나\)\s*$/, '').trim()
const normalizeInterviewerColorKey = (value) => stripMeSuffix(normalizeDisplayName(value)).toLowerCase()

// --- Recruitment Data from API ---
const recruitment = computed(() => {
  const summaryJob = jobs.value.find((item) => Number(item.id) === jobId)
  const detailJob = recruitmentDetail.value
  const job = detailJob ? { ...(summaryJob || {}), ...detailJob } : summaryJob
  if (!job) return {}

  const interviewerMembers = Array.isArray(detailJob?.interviewers)
    ? detailJob.interviewers
    : Array.isArray(job.interviewers)
      ? job.interviewers.filter((interviewer) => typeof interviewer === 'object' && interviewer !== null)
      : []

  const interviewerSource =
    interviewerMembers.length > 0
      ? {
          ...job,
          interviewerIds: interviewerMembers
            .map((interviewer) => toPositiveNumber(interviewer?.userId ?? interviewer?.id ?? interviewer?.memberId))
            .filter(Boolean),
          interviewers: interviewerMembers
        }
      : job

  // D-Day 계산
  let statusText = job.status || job.recruitmentStatus || 'DRAFT'
  let ddayText = '-'

  const now = new Date()
  if (statusText === 'CLOSED') {
    ddayText = '\uB9C8\uAC10'
  } else if (statusText === 'DRAFT') {
    if (job.startDate) {
      const start = new Date(job.startDate)
      const diffToStart = Math.ceil((start - now) / (1000 * 60 * 60 * 24))
      ddayText = diffToStart > 0 ? `${diffToStart}\uC77C \uD6C4 \uC2DC\uC791` : '\uAC8C\uC2DC \uC804'
    } else {
      ddayText = '\uAC8C\uC2DC \uC804'
    }
  } else if (statusText === 'OPEN' && job.endDate) {
    const endDate = new Date(job.endDate)
    const diffDays = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24))
    ddayText = diffDays <= 0 ? '\uB9C8\uAC10' : `D-${diffDays}`
  }

  // Career text
  let positionText = '경력 무관'
  if (job.careerType === 'NEW') positionText = '신입'
  else if (job.careerType === 'EXPERIENCED') {
    const min = job.minExperienceYears
    const max = job.maxExperienceYears
    if (min && max) positionText = `경력 ${min}~${max}년`
    else if (min) positionText = `경력 ${min}년 이상`
    else positionText = '경력'
  }

  // 기간 텍스트
  const startStr = job.startDate ? new Date(job.startDate).toLocaleDateString('ko-KR') : '미정'
  const endStr = job.endDate ? new Date(job.endDate).toLocaleDateString('ko-KR') : '미정'
  const { ids: interviewerIds, names: interviewerNames } = resolveInterviewerInfo(interviewerSource)

  return {
    id: job.id,
    title: job.title,
    period: `${startStr} ~ ${endStr}`,
    status: statusText,
    dday: ddayText,
    totalApplicants:
      Number(job.totalApplicants) ||
      (job.stages || []).reduce((sum, s) => sum + (s.applicantCount || 0), 0),
    ongoingInterviews: Number(job.processingInterview ?? job.ongoingInterviews ?? 0),
    completionRate: 0,
    interviewers: interviewerNames,
    interviewerIds,
    interviewerMembers,
    position: positionText,
    leadGroupName: resolveLeadGroupName(job),
    stages: job.stages || []
  }
})

// (Removed duplicate)

const interviewers = ref([])

const selectedInterviewerIds = computed(() =>
  interviewers.value
    .filter((member) => member.checked)
    .map((member) => getMemberUserId(member))
    .filter((id) => Number.isFinite(id) && id > 0)
)

const selectedInterviewerKey = computed(() => selectedInterviewerIds.value.join(','))
const allInterviewersChecked = computed(() =>
  interviewers.value.length > 0 && interviewers.value.every((member) => member.checked !== false)
)

// 조직도에서 전체 직원 가져오기
const allEmployees = computed(() => {
  if (!organizations.value) return []
  return organizations.value.flatMap(dept => dept.teams.flatMap(team => team.members))
})

const buildInterviewerList = (recruitmentData, employees = []) => {
  if (!recruitmentData?.id) return []

  const employeeById = new Map(
    employees
      .map((employee) => [getMemberUserId(employee), employee])
      .filter(([id]) => !!id)
  )
  const employeeByName = new Map(
    employees
      .map((employee) => [normalizeDisplayName(employee?.name), employee])
      .filter(([name]) => !!name)
  )
  const previousCheckedByKey = new Map(
    interviewers.value
      .map((member) => {
        const userId = getMemberUserId(member)
        const name = normalizeDisplayName(member?.name)
        const key = userId ? `id:${userId}` : name ? `name:${name}` : ''
        return key ? [key, member.checked !== false] : null
      })
      .filter(Boolean)
  )
  const result = []
  const seen = new Set()

  const addCandidate = (candidate) => {
    const candidateId = toPositiveNumber(candidate?.userId ?? candidate?.id ?? candidate?.memberId)
    const candidateName = normalizeDisplayName(candidate?.name)
    const matchedEmployee = candidateId
      ? employeeById.get(candidateId)
      : candidateName
        ? employeeByName.get(candidateName)
        : null
    const resolvedId = candidateId ?? getMemberUserId(matchedEmployee)
    const resolvedName =
      normalizeDisplayName(matchedEmployee?.name) ||
      candidateName ||
      (resolvedId && resolvedId === currentUserId.value ? currentUserName.value : '')
    const key = resolvedId ? `id:${resolvedId}` : resolvedName ? `name:${resolvedName}` : ''

    if (!key || !resolvedName || seen.has(key)) return

    seen.add(key)
    result.push({
      ...(matchedEmployee || {}),
      ...(candidate && typeof candidate === 'object' ? candidate : {}),
      userId: resolvedId,
      name: resolvedName,
      checked: previousCheckedByKey.has(key) ? previousCheckedByKey.get(key) : true
    })
  }

  ;(Array.isArray(recruitmentData.interviewerMembers) ? recruitmentData.interviewerMembers : []).forEach((member) => {
    addCandidate(member)
  })
  ;(Array.isArray(recruitmentData.interviewerIds) ? recruitmentData.interviewerIds : []).forEach((id) => {
    addCandidate({ userId: id })
  })
  ;(Array.isArray(recruitmentData.interviewers) ? recruitmentData.interviewers : []).forEach((interviewer) => {
    if (typeof interviewer === 'string') {
      addCandidate({ name: interviewer })
      return
    }

    addCandidate(interviewer)
  })

  return result.map((member, idx) => {
    const color = getPaletteColor(idx)
    return {
      ...member,
      color,
      displayName: getInterviewerLabel(member),
      checked: member.checked !== false
    }
  })
}

// Initialize interviewers based on recruitment data
watch([recruitment, allEmployees, currentUserId], ([newVal, employees]) => {
  interviewers.value = buildInterviewerList(newVal, employees)
}, { immediate: true })

const toYearMonth = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const toYmd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const toHm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
const toMonthRange = (date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0)

  return {
    startDate: toYmd(start),
    endDate: toYmd(end)
  }
}

const getBookingDisplayTitle = (booking) => {
  const rawTitle = normalizeDisplayName(booking?.title) || '면접 일정'
  const recruitmentTitle = normalizeDisplayName(recruitment.value?.title)
  const prefix = recruitmentTitle ? `${recruitmentTitle} · ` : ''

  if (prefix && rawTitle.startsWith(prefix)) {
    return rawTitle.slice(prefix.length).trim() || rawTitle
  }

  return rawTitle
}

const getBookingPrimaryText = (booking) => booking?.applicantName || getBookingDisplayTitle(booking)
const getBookingSecondaryText = (booking) => booking?.entryType === 'BUSY'
  ? booking?.interviewerName || getInterviewerName(booking?.interviewerId)
  : getBookingDisplayTitle(booking)
const getBookingApplicantText = (booking) => normalizeDisplayName(booking?.applicantName) || '지원자 미정'
const getBookingInterviewerText = (booking) =>
  normalizeDisplayName(booking?.interviewerName) || getInterviewerName(booking?.interviewerId)
const getBookingSummaryText = (booking) => {
  if (booking?.entryType === 'BUSY') {
    return getBookingInterviewerText(booking)
  }

  return [`지원자: ${getBookingApplicantText(booking)}`, `면접관: ${getBookingInterviewerText(booking)}`]
    .filter(Boolean)
    .join(' · ')
}
const loadBusySchedulesByMonth = async (startDate, endDate, attendeeIds) => {
  return scheduleStore.getAttendeeAvailabilityRange(startDate, endDate, attendeeIds)
}

const formatApplicantDate = (value) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}.${month}.${day}`
}

const setAllInterviewersChecked = (checked = true) => {
  interviewers.value = interviewers.value.map((member) => ({
    ...member,
    checked
  }))
}

const toggleInterviewerChecked = (memberId) => {
  interviewers.value = interviewers.value.map((member) => {
    const currentId = getMemberUserId(member) ?? member.id
    if (currentId !== memberId) return member
    return {
      ...member,
      checked: member.checked === false
    }
  })
}

const formatApplicantDateTime = (value) => {
  if (!value) return '-'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)

  const datePart = formatApplicantDate(date)
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${datePart} ${hour}:${minute}`
}

const applicantStatusLabelMap = {
  DOCUMENT_REVIEW: '서류 검토',
  FIRST_INTERVIEW: '1차 면접',
  SECOND_INTERVIEW: '2차 면접',
  OFFER_NEGOTIATION: '처우 협의',
  HIRED: '합격',
  PASSED: '합격',
  REJECTED: '불합격',
  FAILED: '불합격'
}

const applicantGenderLabelMap = {
  MALE: '남성',
  FEMALE: '여성',
  M: '남성',
  F: '여성'
}

const normalizeApplicantStatus = (status) => {
  if (!status) return '서류 검토'
  return applicantStatusLabelMap[status] || status
}

const normalizeApplicantGender = (gender) => {
  if (!gender) return '-'
  return applicantGenderLabelMap[gender] || gender
}

const parseApplicantJsonSafely = (value) => {
  if (typeof value !== 'string' || !value.trim()) return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const toApplicantAnswerList = (detail) => {
  const answerList = []
  const pushAnswer = (label, value) => {
    if (value == null || value === '') return
    answerList.push({ label, value: String(value) })
  }

  pushAnswer('간단 자기소개', detail?.shortBio ?? detail?.selfIntroduction)
  pushAnswer('포트폴리오 URL', detail?.portfolioUrl ?? detail?.portfolio)

  if (Array.isArray(detail?.answers)) {
    detail.answers.forEach((item, index) => {
      const label = item?.label ?? item?.question ?? `답변 ${index + 1}`
      const value = item?.value ?? item?.answer
      pushAnswer(label, value)
    })
  }

  const parsedFormFields = parseApplicantJsonSafely(detail?.formFields)
  if (Array.isArray(parsedFormFields)) {
    parsedFormFields.forEach((item, index) => {
      const label = item?.label ?? item?.question ?? `답변 ${index + 1}`
      const value = item?.value ?? item?.answer
      pushAnswer(label, value)
    })
  } else if (parsedFormFields && typeof parsedFormFields === 'object') {
    Object.entries(parsedFormFields).forEach(([label, value]) => {
      pushAnswer(label, value)
    })
  }

  if (detail?.answerMap && typeof detail.answerMap === 'object') {
    Object.entries(detail.answerMap).forEach(([label, value]) => {
      pushAnswer(label, value)
    })
  }

  return answerList
}

const toApplicantDetailModel = (detail) => {
  const files = Array.isArray(detail?.files) ? detail.files : []
  const primaryFile = files[0] || null
  const resumeFileId =
    detail?.resumeFileId ??
    detail?.resume?.fileId ??
    primaryFile?.fileId ??
    primaryFile?.id ??
    null
  const resumeUrl =
    detail?.resumeUrl ?? detail?.resumeDownloadUrl ?? detail?.resume?.url ?? primaryFile?.downloadUrl ?? null
  const resumeName =
    detail?.resumeFileName ??
    detail?.resumeName ??
    detail?.resume?.name ??
    primaryFile?.fileName ??
    (primaryFile ? '이력서 파일' : null)

  return {
    id: detail?.applicationId ?? detail?.applicantId ?? detail?.id ?? null,
    name: detail?.name ?? detail?.applicantName ?? '-',
    email: detail?.email ?? detail?.applicantEmail ?? '-',
    phone: detail?.phone ?? detail?.phoneNumber ?? '-',
    gender: normalizeApplicantGender(detail?.gender ?? detail?.sex),
    birthdate: formatApplicantDate(detail?.birthDate ?? detail?.birthdate) || '-',
    job: detail?.recruitmentTitle ?? recruitment.value.title ?? '-',
    status: normalizeApplicantStatus(detail?.status ?? detail?.applicationStatus ?? detail?.progressStatus),
    nextSchedule: formatApplicantDateTime(detail?.nextSchedule ?? detail?.nextInterviewAt ?? detail?.nextScheduleAt),
    appliedDate: formatApplicantDate(detail?.appliedAt ?? detail?.appliedDate ?? detail?.createdAt) || '-',
    answers: toApplicantAnswerList(detail),
    resume: resumeFileId || resumeUrl || resumeName
      ? { fileId: resumeFileId, name: resumeName, url: resumeUrl }
      : null
  }
}

const getApplicantStatusStyle = (status) => {
  const styles = {
    '서류 검토': 'border-sky-200 bg-sky-50 text-sky-700',
    '1차 면접': 'border-violet-200 bg-violet-50 text-violet-700',
    '2차 면접': 'border-violet-200 bg-violet-50 text-violet-700',
    '처우 협의': 'border-amber-200 bg-amber-50 text-amber-700',
    합격: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    불합격: 'border-rose-200 bg-rose-50 text-rose-700'
  }
  return styles[status] || 'border-slate-200 bg-slate-50 text-slate-700'
}

const schedules = computed(() => apiSchedules.value)
const automationTriggerOptions = [
  { label: '진입 시', value: 'ON_ENTER' }
]
const automationActionOptions = [
  { label: '이메일', value: 'EMAIL' }
]
const automationTriggerLabelMap = {
  ON_ENTER: '진입 시'
}
const automationActionLabelMap = {
  EMAIL: '이메일'
}
const stageTypeMeta = {
  DOCUMENT: { label: '서류', badge: 'bg-sky-100 text-sky-700 border-sky-200', column: 'border-sky-200 bg-sky-50/40' },
  INTERVIEW: { label: '면접', badge: 'bg-violet-100 text-violet-700 border-violet-200', column: 'border-violet-200 bg-violet-50/30' },
  TEST: { label: '과제', badge: 'bg-amber-100 text-amber-700 border-amber-200', column: 'border-amber-200 bg-amber-50/30' },
  OFFER: { label: '처우', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', column: 'border-emerald-200 bg-emerald-50/30' },
  PASS: { label: '합격', badge: 'bg-green-100 text-green-700 border-green-200', column: 'border-green-200 bg-green-50/40' },
  FAIL: { label: '불합격', badge: 'bg-rose-100 text-rose-700 border-rose-200', column: 'border-rose-200 bg-rose-50/40' }
}

// ...

const openInterviewDetail = (booking) => {
  const event =
    booking?.type
      ? booking
      : {
          id: booking.id,
          interviewScheduleId: booking.interviewScheduleId ?? booking.id,
          type: booking.entryType === 'BUSY' ? (booking.scheduleType || 'OTHERS') : 'INTERVIEW',
          title: booking.entryType === 'BUSY' ? getBookingDisplayTitle(booking) : getBookingPrimaryText(booking),
          description: booking.description || getBookingSummaryText(booking),
          date: booking.date,
          time: booking.isAllDay ? '종일' : booking.time,
          startTime: booking.startTime,
          endTime: booking.endTime,
          location: booking.location || '',
          ownerName: booking.interviewerName || getInterviewerName(booking.interviewerId),
          attendees: booking.attendees || [],
          applicantName: booking.entryType === 'BUSY' ? '' : booking.applicantName,
          isAllDay: booking.isAllDay === true,
          isBusy: booking.entryType === 'BUSY'
        }

  selectedInterview.value = event
  isInterviewDetailModalOpen.value = true
}

const ensureHrMemberForInterviewCreate = async () => {
  try {
    const response = await memberApi.getMyMember()
    return String(response?.data?.data?.memberType || '') === 'HR'
  } catch (error) {
    console.error('멤버 권한 조회 실패:', error)
    alert('권한 정보를 확인할 수 없습니다. 다시 시도해 주세요.')
    return false
  }
}

// --- Computed ---

const selectedDayTitle = computed(() => {
  if (!selectedDay.value) return ''
  return `${selectedDay.value.getFullYear()}년 ${selectedDay.value.getMonth() + 1}월 ${selectedDay.value.getDate()}일`
})

const selectedDayBookings = computed(() => {
  if (!selectedDay.value) return []
  return getBookingsForDay(selectedDay.value)
})

const selectedDayCalendarEvents = computed(() =>
  selectedDayBookings.value.map((booking) => ({
    id: booking.id,
    interviewScheduleId: booking.interviewScheduleId ?? booking.id,
    type: booking.entryType === 'BUSY' ? (booking.scheduleType || 'OTHERS') : 'INTERVIEW',
    title: booking.entryType === 'BUSY' ? getBookingDisplayTitle(booking) : getBookingPrimaryText(booking),
    description: booking.description || getBookingSummaryText(booking),
    date: booking.date,
    time: booking.isAllDay ? '종일' : booking.time,
    startTime: booking.startTime,
    endTime: booking.endTime,
    location: booking.location || '',
    ownerName: booking.interviewerName || getInterviewerName(booking.interviewerId),
    attendees: booking.attendees || [],
    applicantName: booking.entryType === 'BUSY' ? '' : booking.applicantName,
    isAllDay: booking.isAllDay === true,
    isBusy: booking.entryType === 'BUSY',
    color: getInterviewerColor(booking.interviewerId, booking.interviewerName)
  }))
)

const currentDayTitle = computed(() => {
  const d = calendarState.currentMonth
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
})

const currentWeekTitle = computed(() => {
  if (currentWeekDays.value.length === 0) return ''
  const start = currentWeekDays.value[0]
  const end = currentWeekDays.value[6]
  const startMonth = start.getMonth() + 1
  const endMonth = end.getMonth() + 1
  
  if (start.getFullYear() !== end.getFullYear()) {
     return `${start.getFullYear()}년 ${startMonth}월 ${start.getDate()}일 - ${end.getFullYear()}년 ${endMonth}월 ${end.getDate()}일`
  }
  if (startMonth !== endMonth) {
     return `${start.getFullYear()}년 ${startMonth}월 ${start.getDate()}일 - ${endMonth}월 ${end.getDate()}일`
  }
  return `${start.getFullYear()}년 ${startMonth}월 ${start.getDate()}일 - ${end.getDate()}일`
})

// --- Computed for Week View ---
const currentWeekDays = computed(() => {
  const curr = new Date(calendarState.currentMonth)
  const dayOfWeek = curr.getDay()
  const startDay = new Date(curr)
  startDay.setDate(curr.getDate() - dayOfWeek)

  const week = []
  for (let i = 0; i < 7; i++) {
    const next = new Date(startDay)
    next.setDate(startDay.getDate() + i)
    week.push(new Date(next))
  }
  return week
})

const toDateOnly = (value) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  date.setHours(0, 0, 0, 0)
  return date
}

const getFirstScheduleDateInVisibleMonth = (referenceDate = calendarState.currentMonth) => {
  const anchor = toDateOnly(referenceDate)
  if (!anchor) return null

  const targetYear = anchor.getFullYear()
  const targetMonth = anchor.getMonth()

  const candidates = schedules.value
    .map((schedule) => toDateOnly(schedule?.date))
    .filter(
      (date) =>
        date &&
        date.getFullYear() === targetYear &&
        date.getMonth() === targetMonth
    )
    .sort((a, b) => a.getTime() - b.getTime())

  return candidates[0] || null
}

const syncCalendarAnchorForDetailView = () => {
  if (currentView.value === 'MONTH') return

  const currentAnchor = toDateOnly(calendarState.currentMonth)
  const selectedAnchor = toDateOnly(selectedDay.value)
  const canUseSelectedAnchor =
    currentAnchor &&
    selectedAnchor &&
    currentAnchor.getFullYear() === selectedAnchor.getFullYear() &&
    currentAnchor.getMonth() === selectedAnchor.getMonth()

  const nextAnchor =
    (canUseSelectedAnchor ? selectedAnchor : null) ||
    getFirstScheduleDateInVisibleMonth(currentAnchor) ||
    currentAnchor

  if (!nextAnchor) return

  calendarState.currentMonth = new Date(nextAnchor)
  selectedDay.value = new Date(nextAnchor)
}

// --- Helper for Week View Styles ---
const getEventStyle = (booking) => {
  if (!booking.startTime || !booking.endTime) return {}
  const startHour = parseInt(booking.startTime.split(':')[0])
  const startMin = parseInt(booking.startTime.split(':')[1])
  const endHour = parseInt(booking.endTime.split(':')[0])
  const endMin = parseInt(booking.endTime.split(':')[1])

  const baseHour = 9
  const slotHeight = 60

  const top = ((startHour - baseHour) * slotHeight) + ((startMin / 60) * slotHeight)
  const durationHour = endHour - startHour
  const durationMin = endMin - startMin
  const height = Math.max((durationHour * slotHeight) + ((durationMin / 60) * slotHeight), 30)

  return {
    top: `${top}px`,
    height: `${height}px`
  }
}

// --- Applicants & Other Logic ---
const processes = computed(() =>
  [...applicantBoardColumns.value]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((column) => ({
      id: column.recruitmentProcessId,
      stageName: column.name,
      order: column.order ?? 0,
      stageType: column.stageType ?? ''
    }))
)

const canMoveApplicants = computed(() => memberType.value === 'HR')
const failProcess = computed(() =>
  processes.value.find((process) => process.stageType === 'FAIL') || null
)
const processOptions = computed(() => processes.value.map((process) => ({
  value: process.id,
  label: process.stageName
})))
const selectedRuleProcess = computed(() =>
  processes.value.find((process) => process.id === ruleModalProcessId.value) || null
)
const selectedProcessRules = computed(() =>
  automationRules.value.filter((rule) => rule.recruitmentProcessId === ruleModalProcessId.value)
)
const automationRuleCountsByProcess = computed(() => {
  const counts = {}

  automationRules.value.forEach((rule) => {
    const processId = Number(rule?.recruitmentProcessId)
    if (!Number.isFinite(processId)) return
    counts[processId] = (counts[processId] || 0) + 1
  })

  return counts
})
const selectedRuleStageType = computed(() => selectedRuleProcess.value?.stageType || '')
const filteredAutomationTemplates = computed(() => {
  const stageType = selectedRuleStageType.value
  if (!stageType) return automationTemplates.value

  return [...automationTemplates.value].sort((a, b) => {
    const aRecommended = Array.isArray(a.recommendedStageTypes) && a.recommendedStageTypes.includes(stageType)
    const bRecommended = Array.isArray(b.recommendedStageTypes) && b.recommendedStageTypes.includes(stageType)

    if (aRecommended === bRecommended) return 0
    return aRecommended ? -1 : 1
  })
})

const filteredApplicants = computed(() => {
  const query = applicantSearchQuery.value.trim().toLowerCase()
  if (!query) return applicants.value
  return applicants.value.filter(a => 
    a.name.toLowerCase().includes(query) || a.email.toLowerCase().includes(query)
  )
})

const getApplicantsByProcess = (pid) => filteredApplicants.value.filter(a => a.processId === pid)
const selectedApplicants = computed(() =>
  applicants.value.filter((applicant) => selectedApplicationIds.value.includes(applicant.applicationId))
)
const selectedApplicantCount = computed(() => selectedApplicationIds.value.length)
const selectedSourceProcessId = computed(() => selectedApplicants.value[0]?.processId ?? null)
const selectedSourceProcess = computed(() =>
  processes.value.find((process) => process.id === selectedSourceProcessId.value) || null
)
const bulkProcessOptions = computed(() =>
  processOptions.value.filter((option) => option.value !== selectedSourceProcessId.value)
)

const normalizeBoardApplicant = (application, processId) => {
  const tags = []
  const appliedDate = formatApplicantDate(application?.createdAt)

  if (application?.phone) tags.push(application.phone)
  if (appliedDate) tags.push(appliedDate)

  return {
    id: application?.applicationId ?? application?.id,
    applicationId: application?.applicationId ?? application?.id,
    applicantId: application?.applicantId ?? null,
    processId,
    name: application?.name ?? '-',
    email: application?.email ?? '-',
    phone: application?.phone ?? '',
    createdAt: application?.createdAt ?? null,
    hasInterview: false,
    tags
  }
}

const syncApplicantsFromColumns = (columns) => {
  applicants.value = columns.flatMap((column) =>
    (Array.isArray(column.applications) ? column.applications : []).map((application) =>
      normalizeBoardApplicant(application, column.recruitmentProcessId)
    )
  )

  const availableIds = new Set(applicants.value.map((applicant) => applicant.applicationId))
  selectedApplicationIds.value = selectedApplicationIds.value.filter((id) => availableIds.has(id))
}

const loadApplicantBoard = async () => {
  applicantBoardLoading.value = true
  applicantBoardError.value = ''

  try {
    const response = await applicationBoardApi.getBoard(jobId)
    const payload = applicationBoardApi.extractResponseData(response)
    const columns = Array.isArray(payload?.columns) ? payload.columns : []
    applicantBoardColumns.value = columns
    syncApplicantsFromColumns(columns)
    applicantBoardLoaded.value = true
  } catch (error) {
    applicantBoardColumns.value = []
    applicants.value = []
    applicantBoardError.value =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      '지원자 보드를 불러오지 못했습니다.'
  } finally {
    applicantBoardLoading.value = false
  }
}

const moveApplicantLocally = (applicationId, targetProcessId) => {
  const applicant = applicants.value.find((item) => item.applicationId === applicationId)
  if (applicant) {
    applicant.processId = targetProcessId
  }
}

const moveBoardColumnApplicantLocally = (applicationId, targetProcessId) => {
  const sourceColumn = applicantBoardColumns.value.find((column) =>
    Array.isArray(column.applications) &&
    column.applications.some((application) => (application?.applicationId ?? application?.id) === applicationId)
  )
  const targetColumn = applicantBoardColumns.value.find((column) => column.recruitmentProcessId === targetProcessId)

  if (!sourceColumn || !targetColumn) return null

  const sourceApplications = Array.isArray(sourceColumn.applications) ? [...sourceColumn.applications] : []
  const targetApplications = Array.isArray(targetColumn.applications) ? [...targetColumn.applications] : []
  const sourceIndex = sourceApplications.findIndex((application) => (application?.applicationId ?? application?.id) === applicationId)

  if (sourceIndex < 0) return null

  const [movedApplication] = sourceApplications.splice(sourceIndex, 1)
  targetApplications.unshift(movedApplication)

  sourceColumn.applications = sourceApplications
  targetColumn.applications = targetApplications

  return {
    sourceProcessId: sourceColumn.recruitmentProcessId,
    targetProcessId,
    movedApplication
  }
}

const restoreBoardColumnApplicantMove = (snapshot) => {
  if (!snapshot?.movedApplication) return

  const sourceColumn = applicantBoardColumns.value.find((column) => column.recruitmentProcessId === snapshot.sourceProcessId)
  const targetColumn = applicantBoardColumns.value.find((column) => column.recruitmentProcessId === snapshot.targetProcessId)

  if (!sourceColumn || !targetColumn) return

  const sourceApplications = Array.isArray(sourceColumn.applications) ? [...sourceColumn.applications] : []
  const targetApplications = Array.isArray(targetColumn.applications) ? [...targetColumn.applications] : []
  const targetIndex = targetApplications.findIndex((application) => (application?.applicationId ?? application?.id) === (snapshot.movedApplication?.applicationId ?? snapshot.movedApplication?.id))

  if (targetIndex >= 0) {
    targetApplications.splice(targetIndex, 1)
  }

  sourceApplications.unshift(snapshot.movedApplication)
  sourceColumn.applications = sourceApplications
  targetColumn.applications = targetApplications
}

const toggleApplicantSelection = (applicationId) => {
  if (!canMoveApplicants.value) return

  const applicant = applicants.value.find((item) => item.applicationId === applicationId)
  if (!applicant) return

  if (selectedApplicationIds.value.includes(applicationId)) {
    selectedApplicationIds.value = selectedApplicationIds.value.filter((id) => id !== applicationId)
    return
  }

  if (selectedSourceProcessId.value && applicant.processId !== selectedSourceProcessId.value) {
    return
  }

  selectedApplicationIds.value = [...selectedApplicationIds.value, applicationId]
}

const clearApplicantSelection = () => {
  selectedApplicationIds.value = []
  bulkTargetProcessId.value = ''
}

const moveApplicantToProcess = async (applicationId, targetProcessId, options = {}) => {
  const app = applicants.value.find((item) => item.applicationId === applicationId)
  if (!app || app.processId === targetProcessId) return

  const { reloadBoard = false } = options
  const previousProcessId = app.processId
  const boardMoveSnapshot = moveBoardColumnApplicantLocally(applicationId, targetProcessId)
  moveApplicantLocally(applicationId, targetProcessId)
  movingApplicationId.value = applicationId

  try {
    await applicationBoardApi.moveApplicationProcess(applicationId, targetProcessId)
    if (reloadBoard) {
      await loadApplicantBoard()
    }
  } catch (error) {
    restoreBoardColumnApplicantMove(boardMoveSnapshot)
    moveApplicantLocally(applicationId, previousProcessId)
    throw error
  } finally {
    movingApplicationId.value = null
  }
}

const rejectApplicantToFailProcess = async (applicationId) => {
  if (!failProcess.value?.id) {
    window.alert('불합격 프로세스가 없어 처리할 수 없습니다.')
    return
  }

  await moveApplicantToProcess(applicationId, failProcess.value.id)
}

const handleRejectApplicant = async (applicationId) => {
  try {
    await rejectApplicantToFailProcess(applicationId)
  } catch (error) {
    window.alert(
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      '불합격 처리에 실패했습니다.'
    )
  }
}

const summarizeBulkMoveResult = (results) => {
  const succeeded = results.filter((result) => result.status === 'fulfilled')
  const failed = results.filter((result) => result.status === 'rejected')

  if (failed.length === 0) {
    return {
      title: '이동 완료',
      message: `선택한 지원자 ${succeeded.length}명을 이동했습니다.`
    }
  }

  const failedNames = failed
    .map((result) => result.reason?.applicantName)
    .filter(Boolean)
    .slice(0, 3)
  const failedLabel = failedNames.length > 0
    ? `${failedNames.join(', ')}${failed.length > failedNames.length ? ` 외 ${failed.length - failedNames.length}명` : ''}`
    : `${failed.length}명`
  const firstErrorMessage = failed[0]?.reason?.message

  return {
    title: '일부 이동 실패',
    message: `이동 완료 ${succeeded.length}건, 실패 ${failed.length}건 (${failedLabel})${firstErrorMessage ? `\n사유: ${firstErrorMessage}` : ''}`
  }
}

const openBulkMoveResultModal = (results) => {
  const summary = summarizeBulkMoveResult(results)
  bulkMoveResultModal.value = {
    open: true,
    title: summary.title,
    message: summary.message
  }
}

const closeBulkMoveResultModal = () => {
  bulkMoveResultModal.value = {
    open: false,
    title: '',
    message: ''
  }
}

const bulkMoveSelectedApplicants = async (targetProcessId) => {
  if (!canMoveApplicants.value || bulkMoving.value) return

  const normalizedTargetProcessId = Number(targetProcessId)
  if (!normalizedTargetProcessId || selectedApplicants.value.length === 0) return

  bulkMoving.value = true
  let results = []

  try {
    results = await Promise.allSettled(
      selectedApplicants.value.map(async (applicant) => {
        try {
          await moveApplicantToProcess(applicant.applicationId, normalizedTargetProcessId, { reloadBoard: false })
          return applicant.applicationId
        } catch (error) {
          throw {
            applicantId: applicant.applicationId,
            applicantName: applicant.name,
            message:
              error?.response?.data?.error?.message ||
              error?.response?.data?.message ||
              '지원자 이동에 실패했습니다.'
          }
        }
      })
    )

    openBulkMoveResultModal(results)
  } finally {
    bulkMoving.value = false
    clearApplicantSelection()
  }
}

const bulkRejectApplicants = async () => {
  if (!failProcess.value?.id) {
    window.alert('불합격 프로세스를 찾지 못했습니다. 보드를 새로고침한 뒤 다시 시도해주세요.')
    return
  }

  await bulkMoveSelectedApplicants(failProcess.value.id)
}

const getStageTypeMeta = (stageType) => stageTypeMeta[stageType] || {
  label: stageType || '기타',
  badge: 'bg-slate-100 text-slate-700 border-slate-200',
  column: 'border-slate-200 bg-slate-100'
}

const openRuleModal = (processId, rule = null) => {
  ruleModalProcessId.value = processId
  openProcessMenuId.value = null
  automationError.value = ''

  if (rule) {
    startEditAutomationRule(rule)
    return
  }

  editingRuleId.value = null
  automationForm.value = {
    recruitmentProcessId: processId,
    triggerType: 'ON_ENTER',
    actionType: 'EMAIL',
    templateCode: ''
  }
}

const closeRuleModal = () => {
  ruleModalProcessId.value = null
  openProcessMenuId.value = null
  automationError.value = ''
  resetAutomationForm()
}

const resetAutomationForm = () => {
  automationForm.value = {
    recruitmentProcessId: processOptions.value[0]?.value ?? '',
    triggerType: 'ON_ENTER',
    actionType: 'EMAIL',
    templateCode: ''
  }
  editingRuleId.value = null
}

const startEditAutomationRule = (rule) => {
  const normalizedPayload = normalizeAutomationRulePayload(rule?.payload)

  ruleModalProcessId.value = rule.recruitmentProcessId ?? ruleModalProcessId.value
  editingRuleId.value = rule.ruleId
  automationForm.value = {
    recruitmentProcessId: rule.recruitmentProcessId ?? '',
    triggerType: rule.triggerType ?? 'ON_ENTER',
    actionType: rule.actionType ?? 'EMAIL',
    templateCode: normalizedPayload?.templateCode ?? ''
  }
}

const normalizeAutomationRulePayload = (payload) => {
  if (!payload) return {}

  if (typeof payload === 'string') {
    try {
      const parsed = JSON.parse(payload)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  }

  return typeof payload === 'object' ? payload : {}
}

const normalizeAutomationRule = (rule) => ({
  ...rule,
  payload: normalizeAutomationRulePayload(rule?.payload)
})

const getAutomationTriggerLabel = (triggerType) => automationTriggerLabelMap[triggerType] || triggerType || '-'

const getAutomationActionLabel = (actionType) => automationActionLabelMap[actionType] || actionType || '-'

const getAutomationTemplateMeta = (templateCode) => {
  const code = String(templateCode || '').trim()
  if (!code) return null

  return automationTemplates.value.find((template) => template.code === code) || null
}

const getAutomationTemplateLabel = (templateCode) => {
  const template = getAutomationTemplateMeta(templateCode)
  return template?.label || templateCode || '-'
}

const getAutomationTemplateDescription = (templateCode) => {
  const template = getAutomationTemplateMeta(templateCode)
  return template?.description || ''
}

const getAutomationRuleSummary = (rule) => {
  const templateCode = rule?.payload?.templateCode || ''
  const templateLabel = getAutomationTemplateLabel(templateCode)
  const templateDescription = getAutomationTemplateDescription(templateCode)

  return {
    triggerLabel: getAutomationTriggerLabel(rule?.triggerType),
    actionLabel: getAutomationActionLabel(rule?.actionType),
    templateCode,
    templateLabel,
    templateDescription
  }
}

const buildAutomationDuplicateRuleMessage = (baseMessage) => {
  const message = String(baseMessage || '')
  const guidance = '현재 서버에서 중복 규칙을 허용하지 않고 있습니다. 같은 단계의 기존 규칙을 수정하거나 삭제한 뒤 다시 시도해 주세요.'
  return message ? `${message} ${guidance}` : guidance
}

const isAutomationDuplicateRuleError = (error) => {
  const status = Number(error?.response?.status)
  const message = String(
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    ''
  ).toLowerCase()

  return status === 409 ||
    message.includes('duplicate') ||
    message.includes('already exists') ||
    message.includes('중복') ||
    message.includes('이미 존재')
}

const loadAutomationRules = async () => {
  if (!canMoveApplicants.value) return

  automationLoading.value = true
  automationError.value = ''

  try {
    const response = await automationRulesApi.getRecruitmentRules(jobId)
    const payload = automationRulesApi.extractResponseData(response)
    automationRules.value = Array.isArray(payload) ? payload.map(normalizeAutomationRule) : []
    if (!editingRuleId.value) {
      resetAutomationForm()
    }
  } catch (error) {
    automationRules.value = []
    automationError.value =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      '자동화 규칙을 불러오지 못했습니다.'
  } finally {
    automationLoading.value = false
  }
}

const loadAutomationTemplates = async () => {
  if (!canMoveApplicants.value) return

  automationTemplatesLoading.value = true

  try {
    const response = await automationTemplatesApi.getTemplates()
    const payload = automationTemplatesApi.extractResponseData(response)
    automationTemplates.value = Array.isArray(payload) ? payload : []
  } catch {
    automationTemplates.value = []
  } finally {
    automationTemplatesLoading.value = false
  }
}

const submitAutomationRule = async () => {
  if (!canMoveApplicants.value) return
  if (!automationForm.value.recruitmentProcessId || !automationForm.value.templateCode) {
    automationError.value = '프로세스와 템플릿 코드를 입력해주세요.'
    return
  }

  automationSaving.value = true
  automationError.value = ''

  const payload = {
    recruitmentProcessId: Number(automationForm.value.recruitmentProcessId),
    triggerType: automationForm.value.triggerType,
    actionType: automationForm.value.actionType,
    payload: {
      templateCode: automationForm.value.templateCode
    }
  }

  try {
    if (editingRuleId.value) {
      await automationRulesApi.updateRule(editingRuleId.value, payload)
    } else {
      await automationRulesApi.createRecruitmentRule(jobId, payload)
    }

    await loadAutomationRules()
    closeRuleModal()
  } catch (error) {
    const baseMessage =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      '자동화 규칙 저장에 실패했습니다.'

    automationError.value = isAutomationDuplicateRuleError(error)
      ? buildAutomationDuplicateRuleMessage(baseMessage)
      : baseMessage
  } finally {
    automationSaving.value = false
  }
}

const deleteAutomationRule = async (ruleId) => {
  if (!canMoveApplicants.value) return
  if (!window.confirm('이 자동화 규칙을 삭제할까요?')) return

  automationSaving.value = true
  automationError.value = ''

  try {
    await automationRulesApi.deleteRule(ruleId)
    if (editingRuleId.value === ruleId) {
      resetAutomationForm()
    }
    await loadAutomationRules()
  } catch (error) {
    automationError.value =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      '자동화 규칙 삭제에 실패했습니다.'
  } finally {
    automationSaving.value = false
  }
}

const copyRecruitmentLink = () => {
  const dummyLink = `https://careers.nexus.ai/jobs/${recruitment.value.id}`
  navigator.clipboard.writeText(dummyLink).then(() => {
    showCopyModal.value = true
  }).catch(err => {
    console.error('링크 복사 실패', err)
  })
}

const onDragStart = (evt, aid) => {
  if (!canMoveApplicants.value || movingApplicationId.value) {
    evt.preventDefault()
    return
  }

  draggingCardId.value = aid
  evt.dataTransfer.effectAllowed = 'move'
}

const stopBoardAutoScroll = () => {
  autoScrollDirection.value = 0

  if (autoScrollFrameId.value !== null) {
    cancelAnimationFrame(autoScrollFrameId.value)
    autoScrollFrameId.value = null
  }
}

const runBoardAutoScroll = () => {
  if (autoScrollDirection.value === 0) {
    autoScrollFrameId.value = null
    return
  }

  const container = applicantBoardScrollRef.value
  if (!container) {
    stopBoardAutoScroll()
    return
  }

  container.scrollLeft += autoScrollDirection.value * 18
  autoScrollFrameId.value = requestAnimationFrame(runBoardAutoScroll)
}

const updateBoardAutoScroll = (clientX) => {
  const container = applicantBoardScrollRef.value
  if (!container || !draggingCardId.value) {
    stopBoardAutoScroll()
    return
  }

  const rect = container.getBoundingClientRect()
  const edgeThreshold = 72
  let nextDirection = 0

  if (clientX <= rect.left + edgeThreshold) nextDirection = -1
  else if (clientX >= rect.right - edgeThreshold) nextDirection = 1

  if (nextDirection === autoScrollDirection.value) return

  autoScrollDirection.value = nextDirection

  if (nextDirection === 0) {
    stopBoardAutoScroll()
    return
  }

  if (autoScrollFrameId.value === null) {
    autoScrollFrameId.value = requestAnimationFrame(runBoardAutoScroll)
  }
}

const handleBoardDragOver = (evt) => {
  updateBoardAutoScroll(evt.clientX)
}

const handleColumnDragOver = (evt, processId) => {
  draggingOverColumnId.value = processId
  updateBoardAutoScroll(evt.clientX)
}

const onDragEnd = () => {
  draggingCardId.value = null
  draggingOverColumnId.value = null
  stopBoardAutoScroll()
}

const onDrop = async (evt, pid) => {
  const draggedApplicationId = draggingCardId.value
  draggingCardId.value = null
  draggingOverColumnId.value = null
  stopBoardAutoScroll()

  if (!draggedApplicationId) return

  const app = applicants.value.find((item) => item.applicationId === draggedApplicationId)
  if (!app || app.processId === pid) return

  if (!canMoveApplicants.value) {
    window.alert('지원자 이동 권한이 없습니다.')
    return
  }

  try {
    await moveApplicantToProcess(draggedApplicationId, pid)
  } catch (error) {
    window.alert(
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      '지원자 이동에 실패했습니다.'
    )
  }
}

onBeforeUnmount(() => {
  stopBoardAutoScroll()
})

const goInterview = async () => {
  const isHrMember = await ensureHrMemberForInterviewCreate()
  if (!isHrMember) {
    alert('면접 일정 생성은 인사담당자만 가능합니다.')
    return
  }

  router.push({
    path: '/recruitment/interview/select',
    query: { jobId: recruitment.value.id }
  })
}

// --- Calendar Logic ---
const goToday = () => { calendarState.currentMonth = new Date() }
const goPrev = () => {
  const d = new Date(calendarState.currentMonth)
  if (currentView.value === 'WEEK') d.setDate(d.getDate() - 7)
  else if (currentView.value === 'DAY') d.setDate(d.getDate() - 1)
  else d.setMonth(d.getMonth() - 1)
  calendarState.currentMonth = d
}
const goNext = () => {
  const d = new Date(calendarState.currentMonth)
  if (currentView.value === 'WEEK') d.setDate(d.getDate() + 7)
  else if (currentView.value === 'DAY') d.setDate(d.getDate() + 1)
  else d.setMonth(d.getMonth() + 1)
  calendarState.currentMonth = d
}

const isSameMonth = (d1, d2) => d1 && d2 && d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth()
const isSameDay = (d1, d2) => d1 && d2 && d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate()

const calendarDays = computed(() => {
  const curr = new Date(calendarState.currentMonth)
  const year = curr.getFullYear()
  const month = curr.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  
  const days = []
  const inputDate = new Date(firstDay)
  while (inputDate.getDay() > 0) {
    inputDate.setDate(inputDate.getDate() - 1)
    days.unshift(new Date(inputDate))
  }
  
  const currentMonthDays = []
  for (let i = 1; i <= lastDay.getDate(); i++) {
    currentMonthDays.push(new Date(year, month, i))
  }
  
  const totalDays = [...days, ...currentMonthDays]
  const remaining = 35 - totalDays.length
  
  const nextMonthDate = new Date(lastDay)
  for (let i = 1; i <= remaining; i++) {
    nextMonthDate.setDate(nextMonthDate.getDate() + 1)
    totalDays.push(new Date(nextMonthDate))
  }
  
  return totalDays
})

const getBookingsForDay = (date) => {
  if (!date || !schedules.value) return []
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return schedules.value.filter(s => s.date === dateStr).sort((a,b) => a.startTime.localeCompare(b.startTime))
}

const getInterviewerName = (id) => {
  if (!id) return '미지정'
  const targetId = toPositiveNumber(id)
  const emp = allEmployees.value.find((employee) => getMemberUserId(employee) === targetId)
  return emp ? emp.name : '미지정'
}

const interviewerColorById = computed(() =>
  new Map(
    interviewers.value
      .map((member) => [getMemberUserId(member), member.color])
      .filter(([id, color]) => Number.isFinite(id) && id > 0 && !!color)
  )
)

const interviewerColorByName = computed(() =>
  new Map(
    interviewers.value
      .flatMap((member) => {
        const candidates = [
          normalizeInterviewerColorKey(member?.displayName),
          normalizeInterviewerColorKey(member?.name)
        ].filter(Boolean)

        return candidates.map((candidate) => [candidate, member.color])
      })
      .filter(([name, color]) => !!name && !!color)
  )
)

const getInterviewerColor = (id, name = '') => {
  const targetId = toPositiveNumber(id)
  if (targetId && interviewerColorById.value.has(targetId)) {
    return interviewerColorById.value.get(targetId)
  }

  const candidateNames = getUniqueNames(splitNames(name))
    .map((candidate) => normalizeInterviewerColorKey(candidate))
    .filter(Boolean)

  for (const candidateName of candidateNames) {
    if (interviewerColorByName.value.has(candidateName)) {
      return interviewerColorByName.value.get(candidateName)
    }
  }

  if (targetId) {
    return getPaletteColor(targetId)
  }

  if (candidateNames.length > 0) {
    return getPaletteColor(hashString(candidateNames[0]))
  }

  return '#64748b'
}

const openDayDetail = (day) => {
  const normalizedDay = toDateOnly(day)
  if (normalizedDay) {
    selectedDay.value = normalizedDay
    calendarState.currentMonth = new Date(normalizedDay)
  }
  isInterviewDetailModalOpen.value = false
  isInterviewListModalOpen.value = true
}
const closeDayDetail = () => {
  selectedDay.value = null
  isInterviewListModalOpen.value = false
}
const toggleBooking = (id) => {
  if (expandedBookingIds.value.has(id)) expandedBookingIds.value.delete(id)
  else expandedBookingIds.value.add(id)
}

const handleInterviewDelete = (interviewId) => {
  // TODO: 실제 면접 삭제 API 호출
  // axios.delete(`/recruitment/interviews/${interviewId}`)
  isInterviewDetailModalOpen.value = false
  setTimeout(() => {
    alert('면접 일정이 삭제되었습니다.')
    // 실제 데이터에서 제거하는 로직은 생략 (Mock)
  }, 300)
}
const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const [hour, min] = timeStr.split(':').map(Number)
  const ampm = hour >= 12 ? '오후' : '오전'
  // 12 -> 12, 13 -> 1, 0 -> 12
  const formattedHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
  return `${ampm} ${formattedHour}:${String(min).padStart(2, '0')}`
}

const normalizeSchedule = (item) => {
  const startRaw =
    item?.scheduledAt ||
    item?.startDateTime ||
    item?.startDatetime ||
    item?.startAt ||
    item?.occurredAt

  if (!startRaw) return null

  const start = new Date(startRaw)
  if (Number.isNaN(start.getTime())) return null

  const duration = Number(item?.durationMinutes || 60)
  const endRaw = item?.endDateTime || item?.endDatetime || item?.endAt
  const end = endRaw ? new Date(endRaw) : new Date(start.getTime() + duration * 60000)

  const interviewerIds = Array.isArray(item?.interviewerIds) ? item.interviewerIds : []
  const interviewerId =
    Number(item?.interviewerUserId) ||
    Number(item?.interviewer?.userId) ||
    Number(item?.interviewerId) ||
    Number(item?.interviewer?.id) ||
    Number(interviewerIds[0]) ||
    null

  const interviewerName =
    item?.interviewerName ||
    item?.interviewer?.name ||
    (Array.isArray(item?.interviewers) && item.interviewers.map((interviewer) => interviewer?.name).filter(Boolean).join(', ')) ||
    ''

  const applicantName =
    item?.applicantName ||
    item?.applicant?.name ||
    (Array.isArray(item?.applicants) && item.applicants[0]?.name) ||
    '-'

  const interviewerNames = getUniqueNames(splitNames(interviewerName))
  const applicantNames = getUniqueNames(splitNames(applicantName))
  const showSelf =
    !!currentUserName.value &&
    interviewerNames.includes(currentUserName.value)
  const attendees = getUniqueNames([
    ...interviewerNames.filter((name) => !showSelf || name !== currentUserName.value),
    ...applicantNames
  ])

  return {
    id: item.id,
    recruitmentId: Number(item.recruitmentId || jobId),
    date: toYmd(start),
    startTime: toHm(start),
    endTime: toHm(end),
    time: `${formatTime(toHm(start))} - ${formatTime(toHm(end))}`,
    interviewerId,
    interviewerName,
    applicantName,
    title: item?.title || `${item?.round || ''} 면접`.trim() || '면접 일정',
    description: item?.description || item?.memo || item?.note || '',
    location: item?.location || '',
    attendees,
    showSelf
  }
}

const normalizeBusyScheduleEntry = (attendee, schedule) => {
  const start = new Date(schedule.startDateTime)
  if (Number.isNaN(start.getTime())) return null

  const end = new Date(schedule.endDateTime)
  const hasValidEnd = !Number.isNaN(end.getTime())
  const fallbackEnd = new Date(start.getTime())

  return {
    id: `busy-${attendee.attendeeId}-${schedule.scheduleId}`,
    recruitmentId: Number(jobId),
    date: toYmd(start),
    startTime: toHm(start),
    endTime: hasValidEnd ? toHm(end) : toHm(fallbackEnd),
    time: schedule.isAllDay ? '종일' : `${formatTime(toHm(start))} - ${formatTime(hasValidEnd ? toHm(end) : toHm(fallbackEnd))}`,
    interviewerId: attendee.attendeeId,
    interviewerName: attendee.attendeeName,
    applicantName: schedule.title,
    title: schedule.title,
    description: '',
    attendees: [],
    entryType: 'BUSY',
    isAllDay: schedule.isAllDay === true,
    scheduleType: schedule.type || '',
    interviewScheduleId: schedule.interviewScheduleId ?? null
  }
}

let interviewScheduleRequestId = 0
let interviewScheduleLoadingKey = ''

const loadInterviewSchedules = async () => {
  const yearMonth = toYearMonth(calendarState.currentMonth)
  const selectedIds = selectedInterviewerIds.value
  const loadKey = `${jobId}:${yearMonth}:${selectedIds.join(',')}`

  if (interviewScheduleLoadingKey === loadKey) {
    return
  }

  const requestId = ++interviewScheduleRequestId
  interviewScheduleLoadingKey = loadKey

  try {
    const raw = await recruitmentStore.fetchInterviewSchedules(jobId, yearMonth)
    const normalizedInterviewSchedules = Array.isArray(raw)
      ? raw.map(normalizeSchedule).filter(Boolean)
      : []
    const currentRecruitmentInterviewIds = new Set(
      normalizedInterviewSchedules
        .map((schedule) => Number(schedule.id))
        .filter((id) => Number.isFinite(id) && id > 0)
    )

    if (requestId !== interviewScheduleRequestId) {
      return
    }

    apiSchedules.value = normalizedInterviewSchedules

    if (selectedIds.length === 0) {
      return
    }

    try {
      const { startDate, endDate } = toMonthRange(calendarState.currentMonth)
      const availability = await loadBusySchedulesByMonth(
        startDate,
        endDate,
        selectedIds
      )
      const busySchedules = availability.flatMap((attendee) =>
        (Array.isArray(attendee.busySchedules) ? attendee.busySchedules : [])
          .filter((schedule) => {
            const interviewScheduleId = Number(schedule.interviewScheduleId)
            const isCurrentRecruitmentInterview =
              Number.isFinite(interviewScheduleId) &&
              interviewScheduleId > 0 &&
              currentRecruitmentInterviewIds.has(interviewScheduleId)

            return !isCurrentRecruitmentInterview
          })
          .map((schedule) => normalizeBusyScheduleEntry(attendee, schedule))
          .filter(Boolean)
      )

      if (requestId !== interviewScheduleRequestId) {
        return
      }

      apiSchedules.value = [...normalizedInterviewSchedules, ...busySchedules]
    } catch (availabilityError) {
      // 면접관 개인 일정 조회에 실패해도 공고 면접 일정은 그대로 보여준다.
      console.error('면접관 일정 조회 실패:', availabilityError)
    }
  } catch (error) {
    if (requestId === interviewScheduleRequestId) {
      console.error('면접 일정 조회 실패:', error)
      apiSchedules.value = []
    }
  } finally {
    if (interviewScheduleLoadingKey === loadKey) {
      interviewScheduleLoadingKey = ''
    }
  }
}

const loadRecruitmentDetail = async () => {
  if (!Number.isFinite(jobId) || jobId <= 0) {
    recruitmentDetail.value = null
    return
  }

  try {
    const response = await recruitmentApi.getRecruitmentDetail(jobId)
    recruitmentDetail.value = extractRecruitmentDetail(response)
  } catch (error) {
    recruitmentDetail.value = null
    console.error('채용 공고 상세 조회 실패:', error)
  }
}

watch(
  [() => toYearMonth(calendarState.currentMonth), () => selectedInterviewerKey.value],
  async () => {
    await loadInterviewSchedules()
  }
)

watch(
  () => currentView.value,
  () => {
    syncCalendarAnchorForDetailView()
  }
)

watch(
  schedules,
  () => {
    syncCalendarAnchorForDetailView()
  },
  { deep: true }
)

onMounted(async () => {
  if (!jobs.value.length) {
    await recruitmentStore.fetchRecruitments().catch((error) => {
      console.error('채용 공고 목록 조회 실패:', error)
    })
  }
  await Promise.all([
    organizationStore.loadOrganizations().catch((error) => {
      console.error('조직도 조회 실패:', error)
    }),
    loadRecruitmentDetail()
  ])
  memberApi
    .getMyMember()
    .then((res) => {
      memberType.value = res?.data?.data?.memberType || ''
    })
    .catch(() => {
      memberType.value = ''
    })

  await loadInterviewSchedules()
})

watch(activeTab, async (tab) => {
  if (tab !== 'APPLICANTS' || applicantBoardLoading.value) return
  await loadApplicantBoard()
})

watch(
  [activeTab, canMoveApplicants, processOptions],
  async ([tab, canMove]) => {
    if (tab !== 'APPLICANTS' || !canMove) return
    if (!automationRules.value.length && !automationLoading.value) {
      await loadAutomationRules()
    }
    if (!automationForm.value.recruitmentProcessId && processOptions.value.length > 0) {
      automationForm.value.recruitmentProcessId = processOptions.value[0].value
    }
  },
  { immediate: true }
)

watch(selectedSourceProcessId, (processId) => {
  if (!processId) {
    bulkTargetProcessId.value = ''
    return
  }

  if (Number(bulkTargetProcessId.value) === processId) {
    bulkTargetProcessId.value = ''
  }
})

watch(ruleModalProcessId, async (processId) => {
  if (!processId || !canMoveApplicants.value) return
  if (!automationRules.value.length && !automationLoading.value) {
    await loadAutomationRules()
  }
  if (!automationTemplates.value.length && !automationTemplatesLoading.value) {
    await loadAutomationTemplates()
  }
})

const getDayColor = (index) => {
  if (index === 0) return 'text-rose-500' // Sunday
  if (index === 6) return 'text-blue-500' // Saturday
  return 'text-slate-500'
}

const openApplicantDetailModal = async (app) => {
  if (!app?.applicationId || movingApplicationId.value === app.applicationId) return

  applicantDetailModalOpen.value = true
  applicantDetailLoading.value = true
  applicantDetailError.value = ''
  applicantDetail.value = null

  try {
    const response = await applicationBoardApi.getApplicationDetail(app.applicationId)
    const payload = applicationBoardApi.extractResponseData(response)
    const detail = payload?.application ?? payload?.item ?? payload

    if (!detail || typeof detail !== 'object') {
      throw new Error('지원자 정보를 찾을 수 없습니다.')
    }

    applicantDetail.value = toApplicantDetailModel(detail)
  } catch (error) {
    applicantDetailError.value =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error?.message ||
      '지원자 상세 정보를 불러오지 못했습니다.'
  } finally {
    applicantDetailLoading.value = false
  }
}

const closeApplicantDetailModal = () => {
  applicantDetailModalOpen.value = false
  applicantDetailLoading.value = false
  applicantDetailError.value = ''
  applicantDetail.value = null
  downloadingApplicantFileId.value = null
}

const handleApplicantResumeDownload = async () => {
  if (!applicantDetail.value?.resume) return

  const { resume } = applicantDetail.value

  if (!resume.fileId) {
    if (resume.url) {
      window.open(resume.url, '_blank', 'noopener,noreferrer')
    }
    return
  }

  downloadingApplicantFileId.value = resume.fileId

  try {
    const response = await applicationBoardApi.getApplicationFileDownloadPresign(resume.fileId)
    const payload = applicationBoardApi.extractResponseData(response)
    const downloadUrl = payload?.downloadUrl ?? payload?.url ?? payload?.presignedUrl ?? null

    if (!downloadUrl) {
      throw new Error('다운로드 URL을 받지 못했습니다.')
    }

    window.open(downloadUrl, '_blank', 'noopener,noreferrer')
  } catch (error) {
    applicantDetailError.value =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error?.message ||
      '첨부 파일 다운로드에 실패했습니다.'
  } finally {
    downloadingApplicantFileId.value = null
  }
}
</script>

<template>
  <div v-if="!recruitment.id" class="flex h-screen items-center justify-center bg-slate-50">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
      <p class="text-slate-500 font-bold">공고 정보를 불러오는 중입니다...</p>
    </div>
  </div>

  <div v-else class="relative flex min-h-[calc(100vh-4rem)] gap-4 overflow-hidden bg-[#f7faf9] px-4 pb-4 pt-0">
    <main class="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
      <section class="border-b border-slate-200 bg-white px-5 py-4">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="min-w-0">
            <button @click="router.push('/recruitment/home')" class="flex items-center text-sm font-bold text-slate-500 transition-colors hover:text-brand-600">
              <svg class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
              채용 홈으로
            </button>

            <div class="mt-3 flex flex-wrap items-center gap-2">
              <h1 class="text-2xl font-black tracking-tight text-slate-950">{{ recruitment.title }}</h1>
              <span class="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{{ recruitment.dday }}</span>
              <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">{{ recruitment.position }}</span>
            </div>

            <p class="mt-2 text-sm font-medium text-slate-500">
              {{ recruitment.leadGroupName }} · {{ recruitment.period }}
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">지원자 {{ recruitment.totalApplicants }}명</span>
            <span class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">면접관 {{ interviewers.length }}명</span>
            <button @click="copyRecruitmentLink" class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-brand-200 hover:text-brand-700">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              링크 복사
            </button>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-2">
          <span
            v-for="member in interviewers.slice(0, 3)"
            :key="getMemberUserId(member) ?? member.id"
            class="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
          >
            {{ member.displayName || getInterviewerLabel(member) }}
          </span>
        </div>
      </section>

      <!-- Header -->
      <header class="z-10 flex flex-none items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
        <div class="flex space-x-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
          <button @click="activeTab = 'CALENDAR'" class="px-4 py-1.5 text-sm font-bold rounded-md transition-all" :class="activeTab === 'CALENDAR' ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'">면접 일정</button>
          <button @click="activeTab = 'APPLICANTS'" class="px-4 py-1.5 text-sm font-bold rounded-md transition-all" :class="activeTab === 'APPLICANTS' ? 'bg-white text-slate-900' : 'text-slate-500 hover:text-slate-700'">지원자 관리</button>
        </div>
      </header>

      <!-- Calendar View (New Design) -->
      <div v-if="activeTab === 'CALENDAR'" class="flex-1 overflow-hidden p-5">
        <div class="flex h-full flex-col gap-4">
          <!-- Main Calendar Grid -->
          <div class="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-4">
            <div class="schedule-surface__head">
              <div>
                <h2 class="surface-title">
                  {{ calendarState.currentMonth.getFullYear() }}년 {{ calendarState.currentMonth.getMonth() + 1 }}월
                </h2>
                <p v-if="currentView === 'WEEK'" class="mt-1 text-[11px] font-bold text-brand-600">{{ currentWeekTitle }}</p>
                <p v-if="currentView === 'DAY'" class="mt-1 text-[11px] font-bold text-brand-600">{{ currentDayTitle }}</p>
              </div>

              <div class="surface-head-actions">
                <div class="view-switch">
                  <button
                    v-for="opt in viewOptions"
                    :key="opt.value"
                    type="button"
                    class="view-switch__button"
                    :class="{ 'view-switch__button--active': currentView === opt.value }"
                    @click="currentView = opt.value"
                  >
                    {{ opt.label }}
                  </button>
                </div>

                <div class="surface-head-nav">
                  <button type="button" class="icon-button" @click="goPrev">
                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button type="button" class="toolbar-button toolbar-button-subtle" @click="goToday">
                    {{ labels.todayMove }}
                  </button>
                  <button type="button" class="icon-button" @click="goNext">
                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                <button type="button" class="toolbar-button toolbar-button-primary" @click="goInterview">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4" />
                  </svg>
                  일정 생성
                </button>
              </div>
            </div>

            <div class="calendar-layout">
              <aside v-if="interviewers.length" class="calendar-filter-panel">
                <div class="calendar-filter-panel__head">
                  <h3 class="calendar-filter-panel__title">면접관</h3>
                  <p class="calendar-filter-panel__caption">일정 표시 대상 선택</p>
                </div>

                <div class="calendar-filter-panel__list">
                  <button
                    type="button"
                    class="calendar-filter-chip"
                    :class="{ 'calendar-filter-chip--active': allInterviewersChecked }"
                    @click="setAllInterviewersChecked(true)"
                  >
                    <span class="calendar-filter-chip__content">
                      <span class="calendar-filter-chip__dot calendar-filter-chip__dot--all"></span>
                      <span>전체 면접관</span>
                    </span>
                  </button>

                  <button
                    v-for="member in interviewers"
                    :key="getMemberUserId(member) ?? member.id"
                    type="button"
                    class="calendar-filter-chip"
                    :class="{ 'calendar-filter-chip--active': member.checked !== false }"
                    @click="toggleInterviewerChecked(getMemberUserId(member) ?? member.id)"
                  >
                    <span class="calendar-filter-chip__content">
                      <span class="calendar-filter-chip__dot" :style="{ backgroundColor: member.color }"></span>
                      <span>{{ member.displayName || getInterviewerLabel(member) }}</span>
                    </span>
                  </button>
                </div>
              </aside>

              <div class="calendar-layout__main">
                <!-- MONTH VIEW -->
                <template v-if="currentView === 'MONTH'">
                  <div class="month-weekdays">
                    <div v-for="(day, idx) in koDays" :key="day" class="month-weekdays__item" :class="getDayColor(idx)">
                      {{ day }}
                    </div>
                  </div>

                  <div class="month-grid">
                    <div
                      v-for="(day, index) in calendarDays"
                      :key="day ? day.toISOString() : `empty-${index}`"
                      class="month-cell"
                      :class="{
                        'month-cell--muted': !day || !isSameMonth(day, calendarState.currentMonth),
                        'month-cell--today': day && isSameDay(day, new Date()),
                        'month-cell--last': (index + 1) % 7 === 0
                      }"
                      @click="day && isSameMonth(day, calendarState.currentMonth) && openDayDetail(day)"
                    >
                      <div class="month-cell__head">
                        <span
                          v-if="day"
                          class="month-cell__day"
                          :class="{
                            'month-cell__day--today': isSameDay(day, new Date()),
                            'month-cell__day--sunday': day.getDay() === 0 && !isSameDay(day, new Date()),
                            'month-cell__day--saturday': day.getDay() === 6 && !isSameDay(day, new Date()),
                            'ring-1 ring-brand-600 text-brand-600': selectedDay && isSameDay(day, selectedDay) && !isSameDay(day, new Date()),
                            'opacity-0': !isSameMonth(day, calendarState.currentMonth)
                          }"
                        >
                          {{ day.getDate() }}
                        </span>
                        <span v-if="day && getBookingsForDay(day).length" class="month-cell__count">
                          {{ getBookingsForDay(day).length }}
                        </span>
                      </div>

                      <div v-if="day && isSameMonth(day, calendarState.currentMonth) && getBookingsForDay(day).length" class="month-cell__events">
                        <div
                          v-for="booking in getBookingsForDay(day).slice(0, 3)"
                          :key="booking.id"
                          class="month-event-chip"
                          :style="{
                            backgroundColor: `${getInterviewerColor(booking.interviewerId, booking.interviewerName)}18`,
                            color: getInterviewerColor(booking.interviewerId, booking.interviewerName)
                          }"
                          @click.stop="openInterviewDetail(booking)"
                        >
                          <span class="month-event-chip__time">{{ booking.startTime }}</span>
                          <span class="month-event-chip__title truncate">{{ getBookingPrimaryText(booking) }}</span>
                        </div>
                        <button
                          v-if="getBookingsForDay(day).length > 3"
                          class="month-cell__more"
                          @click.stop="openDayDetail(day)"
                        >
                          +{{ getBookingsForDay(day).length - 3 }}개 더 보기
                        </button>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- WEEK VIEW -->
                <template v-else-if="currentView === 'WEEK'">
                  <div class="flex flex-col h-full overflow-hidden">
                    <div class="sticky top-0 z-30 grid grid-cols-[60px_1fr] border-b border-slate-200 bg-slate-50/60">
                      <div class="border-r border-slate-200"></div>
                      <div class="grid grid-cols-7">
                        <div v-for="(day, idx) in currentWeekDays" :key="day.toISOString()"
                             class="group flex cursor-pointer flex-col items-center gap-1 border-r border-slate-200 py-3 text-center transition-colors hover:bg-slate-100 last:border-0"
                             @click="openDayDetail(day)">
                          <span class="text-[10px] font-black tracking-widest uppercase" :class="getDayColor(idx)">{{ koDays[idx] }}</span>
                          <span class="text-lg font-display font-bold leading-none w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                                :class="{
                                  'bg-brand-600 text-white': isSameDay(day, new Date()),
                                  'ring-1 ring-brand-600 text-brand-600': isSameDay(day, calendarState.currentMonth) && !isSameDay(day, new Date()),
                                  'text-slate-700 group-hover:text-brand-600': !isSameDay(day, new Date()) && !isSameDay(day, calendarState.currentMonth)
                                }">
                            {{ day.getDate() }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="flex flex-1 overflow-y-auto custom-scrollbar">
                      <div class="w-[60px] shrink-0 border-r border-slate-200 bg-slate-50/10">
                        <div v-for="time in timeSlots" :key="time" class="flex h-[60px] items-start justify-center border-b border-slate-200 pt-2 text-[10px] font-bold text-slate-500">
                          {{ time }}
                        </div>
                      </div>
                      <div class="flex-1 grid grid-cols-7 relative">
                        <div v-for="(day, dayIdx) in currentWeekDays" :key="dayIdx" class="group relative border-r border-slate-200 last:border-0">
                          <div v-for="time in timeSlots" :key="time" class="h-[60px] border-b border-slate-200 transition-colors hover:bg-slate-50/30"></div>

                          <div v-for="evt in getBookingsForDay(day)" :key="evt.id"
                               @click="openInterviewDetail(evt)"
                               class="absolute left-1 right-1 z-20 cursor-pointer overflow-hidden rounded-lg border-l-4 p-1.5 transition-transform hover:scale-[1.02]"
                               :style="{
                                 ...getEventStyle(evt),
                                 backgroundColor: `${getInterviewerColor(evt.interviewerId, evt.interviewerName)}`,
                                 borderColor: getInterviewerColor(evt.interviewerId, evt.interviewerName),
                                 color: '#fff'
                               }">
                            <div class="flex flex-col h-full justify-center">
                               <p class="text-[10px] font-extrabold truncate leading-tight">{{ getBookingPrimaryText(evt) }}</p>
                               <p class="text-[9px] font-medium truncate opacity-90">{{ getBookingSecondaryText(evt) }}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- DAY VIEW -->
                <template v-else>
                  <div class="flex-1 overflow-y-auto custom-scrollbar p-8">
                    <div class="space-y-4 max-w-3xl mx-auto">
                      <div v-if="getBookingsForDay(calendarState.currentMonth).length === 0" class="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/50 py-20">
                         <p class="text-sm font-bold text-slate-400">등록된 면접 일정이 없습니다.</p>
                      </div>

                      <div v-for="evt in getBookingsForDay(calendarState.currentMonth)" :key="evt.id"
                           @click="openInterviewDetail(evt)"
                           class="group flex cursor-pointer items-center gap-6 rounded-xl border border-slate-200 bg-white p-5 transition-all hover:border-brand-300">
                        <div class="w-20 text-center shrink-0 border-r-2 border-slate-100 pr-4">
                          <span class="block text-xl font-black text-slate-800 tracking-tighter">{{ evt.time }}</span>
                        </div>

                        <div class="flex-1 min-w-0">
                          <span class="inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest mb-1"
                                :style="{
                                  backgroundColor: `${getInterviewerColor(evt.interviewerId, evt.interviewerName)}20`,
                                  color: getInterviewerColor(evt.interviewerId, evt.interviewerName)
                                }">
                            {{ evt.interviewerName || getInterviewerName(evt.interviewerId) }}
                          </span>
                          <h4 class="text-lg font-bold text-slate-900 group-hover:text-brand-600 transition-colors leading-snug">{{ getBookingDisplayTitle(evt) }}</h4>
                          <p class="text-sm text-slate-500 mt-1 font-medium">{{ getBookingSummaryText(evt) }}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Applicants List View (Existing) -->
      <div
        v-else
        class="flex-1 overflow-hidden p-5"
      >
        <div
          ref="applicantBoardScrollRef"
          class="applicant-surface flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5"
          @dragover.prevent="handleBoardDragOver"
        >
        <div class="schedule-surface__head applicant-surface__head">
          <div>
            <h2 class="surface-title">지원자 관리</h2>
            <p class="mt-1 text-[11px] font-bold text-brand-600">
              총 {{ applicants.length }}명 · {{ processes.length }}단계
            </p>
          </div>

          <div class="surface-head-actions">
            <div class="applicant-search-field">
              <span class="applicant-search-field__icon">
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                v-model="applicantSearchQuery"
                type="text"
                placeholder="지원자 이름/이메일 검색"
                class="applicant-search-field__input"
              >
            </div>
          </div>
        </div>

        <div v-if="applicantBoardLoading" class="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50/70 px-10">
          <p class="text-sm font-bold text-slate-500">지원자 보드를 불러오는 중입니다.</p>
        </div>

        <div v-else-if="applicantBoardError" class="flex h-full items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-10">
          <p class="text-sm font-bold text-rose-600">{{ applicantBoardError }}</p>
        </div>

        <div v-else-if="processes.length === 0" class="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-10">
          <p class="text-sm font-bold text-slate-500">표시할 전형 프로세스가 없습니다.</p>
        </div>

        <div v-else class="min-h-0 flex-1 overflow-x-auto overflow-y-hidden pb-2 custom-scrollbar">
          <div class="applicant-board-scroll flex h-full min-w-max gap-4">
            <div 
            v-for="process in processes" :key="process.id"
            class="flex h-full min-h-[32rem] w-72 flex-col rounded-2xl border border-slate-200 bg-slate-50/55"
            @dragover.prevent="handleColumnDragOver($event, process.id)"
            @drop="onDrop($event, process.id)"
            :class="[getStageTypeMeta(process.stageType).column, {'ring-2 ring-brand-300': draggingOverColumnId === process.id}]"
          >
            <div class="flex-none rounded-t-2xl border-b border-slate-200 bg-white px-3.5 py-3 flex items-center justify-between">
              <div>
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="text-sm font-bold text-slate-700">{{ process.stageName }}</h3>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold border" :class="getStageTypeMeta(process.stageType).badge">
                    {{ getStageTypeMeta(process.stageType).label }}
                  </span>
                </div>
              </div>
              <div class="flex items-center gap-2 relative">
                <span class="bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-slate-500">{{ getApplicantsByProcess(process.id).length }}</span>
                <span
                  v-if="canMoveApplicants"
                  class="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-bold text-violet-700"
                >
                  규칙 {{ automationRuleCountsByProcess[process.id] || 0 }}
                </span>
                <button
                  v-if="canMoveApplicants"
                  type="button"
                  class="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-brand-700 hover:border-brand-200 flex items-center justify-center"
                  @click.stop="openProcessMenuId = openProcessMenuId === process.id ? null : process.id"
                >
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.6" d="M12 5v14m7-7H5" />
                  </svg>
                </button>
                <div
                  v-if="openProcessMenuId === process.id"
                  class="absolute right-0 top-10 z-20 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-[0_18px_40px_-24px_rgba(15,23,42,0.35)]"
                >
                  <button
                    type="button"
                    class="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
                    @click="openRuleModal(process.id)"
                  >
                    자동화 규칙 관리
                  </button>
                </div>
              </div>
            </div>
            <div class="flex-1 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar">
              <div v-for="app in getApplicantsByProcess(process.id)" :key="app.id"
                   :draggable="canMoveApplicants && movingApplicationId !== app.applicationId" @dragstart="onDragStart($event, app.applicationId)" @dragend="onDragEnd"
                   class="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 transition-all hover:border-brand-300 hover:shadow-[0_16px_30px_-24px_rgba(15,23,42,0.45)] active:cursor-grabbing"
                   :class="{
                     'opacity-50 border-dashed': draggingCardId === app.applicationId,
                     'cursor-not-allowed opacity-70': !canMoveApplicants,
                     'pointer-events-none opacity-60': movingApplicationId === app.applicationId
                   }"
                   @click="openApplicantDetailModal(app)">
                <div v-if="canMoveApplicants" class="mb-2 flex items-center justify-between gap-2">
                  <label class="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                    <input
                      type="checkbox"
                      class="h-3.5 w-3.5 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                      :checked="selectedApplicationIds.includes(app.applicationId)"
                      :disabled="bulkMoving || movingApplicationId === app.applicationId || (!!selectedSourceProcessId && selectedSourceProcessId !== app.processId && !selectedApplicationIds.includes(app.applicationId))"
                      @click.stop
                      @change="toggleApplicantSelection(app.applicationId)"
                    >
                    선택
                  </label>
                  <button
                    type="button"
                    class="rounded-lg border px-2 py-1 text-[10px] font-bold transition-colors"
                    :class="app.processId === failProcess?.id || movingApplicationId === app.applicationId
                      ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400'
                      : 'border-rose-200 bg-rose-50 text-rose-700 hover:border-rose-300 hover:bg-rose-100'"
                    :disabled="app.processId === failProcess?.id || movingApplicationId === app.applicationId"
                    @click.stop="handleRejectApplicant(app.applicationId)"
                  >
                    불합격
                  </button>
                </div>
                <div class="flex items-start justify-between gap-2 mb-1.5">
                  <span class="text-sm font-bold text-slate-900 leading-5">{{ app.name }}</span>
                  <div v-if="app.hasInterview" class="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700">면접</div>
                </div>
                <p class="mb-2 truncate text-[11px] font-medium text-slate-500">{{ app.email }}</p>
                <div v-if="app.tags?.length" class="flex flex-wrap gap-1">
                  <span
                    v-for="tag in app.tags.slice(0, 2)"
                    :key="tag"
                    class="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600"
                  >
                    {{ tag }}
                  </span>
                  <span
                    v-if="app.tags.length > 2"
                    class="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-500"
                  >
                    +{{ app.tags.length - 2 }}
                  </span>
                </div>
              </div>
              <div
                v-if="getApplicantsByProcess(process.id).length === 0"
                class="flex h-full min-h-[10rem] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/70 px-4"
              >
                <p class="text-[11px] font-bold text-slate-400">지원자 없음</p>
              </div>
            </div>
            </div>
          </div>

          <div v-if="!canMoveApplicants" class="flex items-start">
            <div class="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700">
              HR 멤버만 지원자를 다른 프로세스로 이동할 수 있습니다.
            </div>
          </div>
          <div v-else-if="false" class="flex items-start">
            <div class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
              FAIL 단계가 없어 불합격 처리를 사용할 수 없습니다.
            </div>
          </div>
        </div>
        </div>

        <div
          v-if="canMoveApplicants && selectedApplicantCount > 0"
          class="pointer-events-none fixed bottom-6 left-1/2 z-30 w-[min(860px,calc(100vw-2rem))] -translate-x-1/2"
        >
          <div class="pointer-events-auto rounded-xl border border-slate-200 bg-white/95 px-5 py-4 backdrop-blur">
            <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div class="flex items-center gap-3">
                <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white">
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-bold text-slate-900">{{ selectedApplicantCount }}명 선택됨</p>
                  <p class="text-xs font-medium text-slate-500">
                    {{ selectedSourceProcess ? `${selectedSourceProcess.stageName} 단계에서 선택 중` : '선택한 지원자를 원하는 단계로 한 번에 이동합니다.' }}
                  </p>
                </div>
              </div>

              <div class="flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  v-model="bulkTargetProcessId"
                  class="min-w-[180px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800"
                >
                  <option value="">이동할 단계 선택</option>
                  <option v-for="option in bulkProcessOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
                <button
                  type="button"
                  class="rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                  :disabled="!bulkTargetProcessId || bulkMoving"
                  @click="bulkMoveSelectedApplicants(bulkTargetProcessId)"
                >
                  단계 이동
                </button>
                <button
                  type="button"
                  class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700 disabled:opacity-50"
                  :disabled="bulkMoving"
                  @click="bulkRejectApplicants"
                >
                  불합격 처리
                </button>
                <button
                  type="button"
                  class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600"
                  :disabled="bulkMoving"
                  @click="clearApplicantSelection"
                >
                  선택 해제
                </button>
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="bulkMoveResultModal.open"
          class="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm"
          @click.self="closeBulkMoveResultModal"
        >
          <div class="w-full max-w-md rounded-xl border border-slate-200 bg-white">
            <div class="border-b border-slate-200 px-6 py-5">
              <p class="text-xs font-bold tracking-[0.2em] text-slate-400">RESULT</p>
              <h3 class="mt-1 text-xl font-bold text-slate-900">{{ bulkMoveResultModal.title }}</h3>
            </div>
            <div class="px-6 py-6">
              <p class="whitespace-pre-line text-sm leading-6 text-slate-600">{{ bulkMoveResultModal.message }}</p>
              <button
                type="button"
                class="mt-5 w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white"
                @click="closeBulkMoveResultModal"
              >
                확인
              </button>
            </div>
          </div>
        </div>

        <div v-if="false && canMoveApplicants" class="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <div class="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 class="text-sm font-bold text-slate-900">Automation Rules</h3>
              <p class="text-xs text-slate-500 mt-1">프로세스 진입 시 실행될 이메일 규칙을 관리합니다.</p>
            </div>
            <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-1">HR</span>
          </div>

          <div v-if="automationError" class="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
            {{ automationError }}
          </div>

          <div class="grid gap-5 xl:grid-cols-[320px_1fr]">
            <form class="space-y-3" @submit.prevent="submitAutomationRule">
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">프로세스</label>
                <select v-model="automationForm.recruitmentProcessId" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <option value="">선택하세요</option>
                  <option v-for="option in processOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">트리거</label>
                <select v-model="automationForm.triggerType" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <option v-for="option in automationTriggerOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">액션</label>
                <select v-model="automationForm.actionType" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                  <option v-for="option in automationActionOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-bold text-slate-600 mb-1">Template Code</label>
                <input v-model="automationForm.templateCode" type="text" placeholder="DOCUMENT_PASS" class="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
              </div>
              <div class="flex gap-2">
                <button type="submit" :disabled="automationSaving" class="flex-1 rounded-xl bg-slate-900 text-white px-3 py-2 text-sm font-bold disabled:opacity-60">
                  {{ editingRuleId ? '규칙 수정' : '규칙 추가' }}
                </button>
                <button v-if="editingRuleId" type="button" @click="resetAutomationForm" class="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600">
                  취소
                </button>
              </div>
            </form>

            <div>
              <div v-if="automationLoading" class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
                자동화 규칙을 불러오는 중입니다.
              </div>

              <div v-else-if="automationRules.length === 0" class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-bold text-slate-500">
                등록된 자동화 규칙이 없습니다.
              </div>

              <div v-else class="space-y-3">
                <article v-for="rule in automationRules" :key="rule.ruleId" class="rounded-xl border border-slate-200 p-4">
                  <div class="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p class="text-sm font-bold text-slate-900">{{ processes.find((process) => process.id === rule.recruitmentProcessId)?.stageName || `Process #${rule.recruitmentProcessId}` }}</p>
                      <p class="text-[11px] text-slate-500 font-medium">{{ rule.triggerType }} -> {{ rule.actionType }}</p>
                    </div>
                    <div class="flex gap-2">
                      <button @click="startEditAutomationRule(rule)" class="text-xs font-bold text-brand-600">수정</button>
                      <button @click="deleteAutomationRule(rule.ruleId)" class="text-xs font-bold text-rose-600">삭제</button>
                    </div>
                  </div>
                  <p class="text-xs text-slate-600">
                    templateCode: <span class="font-bold text-slate-800">{{ rule.payload?.templateCode || '-' }}</span>
                  </p>
                </article>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>

    <!-- 모달: 면접관 수정 -->
    <div v-if="ruleModalProcessId" class="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-sm" @click.self="closeRuleModal">
      <div class="bg-white rounded-2xl w-[760px] max-w-[96vw] max-h-[85vh] overflow-hidden flex flex-col border border-slate-200 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.5)]">
        <div class="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-bold text-slate-500 mb-1">AUTOMATION</p>
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-xl font-bold text-slate-900">{{ selectedRuleProcess?.stageName || '프로세스' }}</h3>
              <span class="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-[11px] font-bold text-violet-700">
                규칙 {{ selectedProcessRules.length }}개
              </span>
            </div>
          </div>
          <button @click="closeRuleModal" class="w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 flex items-center justify-center">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 grid gap-6 lg:grid-cols-[320px_1fr]">
          <form class="space-y-3 automation-form" @submit.prevent="submitAutomationRule">
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">프로세스</label>
              <select v-model="automationForm.recruitmentProcessId" class="automation-select w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option value="">선택하세요</option>
                <option v-for="option in processOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">트리거</label>
              <select v-model="automationForm.triggerType" class="automation-select w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option v-for="option in automationTriggerOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">액션</label>
              <select v-model="automationForm.actionType" class="automation-select w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option v-for="option in automationActionOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-600 mb-1">Template Code</label>
              <select v-model="automationForm.templateCode" class="automation-select w-full rounded-xl border border-slate-200 px-3 py-2 text-sm">
                <option value="">선택하세요</option>
                <option
                  v-for="template in filteredAutomationTemplates"
                  :key="template.code"
                  :value="template.code"
                >
                  {{ template.label }} ({{ template.code }})
                </option>
              </select>
              <p
                v-if="automationForm.templateCode && getAutomationTemplateDescription(automationForm.templateCode)"
                class="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-5 text-slate-500"
              >
                {{ getAutomationTemplateDescription(automationForm.templateCode) }}
              </p>
            </div>
            <div v-if="automationError" class="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
              {{ automationError }}
            </div>
            <div class="flex gap-2">
              <button type="submit" :disabled="automationSaving" class="flex-1 rounded-xl bg-slate-900 text-white px-3 py-2.5 text-sm font-bold disabled:opacity-60">
                {{ editingRuleId ? '규칙 수정' : '규칙 추가' }}
              </button>
              <button
                v-if="editingRuleId"
                type="button"
                @click="openRuleModal(ruleModalProcessId)"
                class="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600"
              >
                새 규칙으로 전환
              </button>
              <button type="button" @click="closeRuleModal" class="rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600">
                닫기
              </button>
            </div>
          </form>

          <div>
            <div v-if="automationLoading || automationTemplatesLoading" class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-500">
              자동화 규칙을 불러오는 중입니다.
            </div>
            <div v-else-if="selectedProcessRules.length === 0" class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-bold text-slate-500">
              이 단계에 연결된 규칙이 없습니다. 첫 번째 규칙을 추가해 보세요.
            </div>
            <div v-else class="space-y-3">
              <article v-for="rule in selectedProcessRules" :key="rule.ruleId" class="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                        {{ getAutomationRuleSummary(rule).triggerLabel }}
                      </span>
                      <span class="inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700">
                        {{ getAutomationRuleSummary(rule).actionLabel }}
                      </span>
                    </div>
                    <p class="mt-3 text-sm font-bold text-slate-900">{{ getAutomationRuleSummary(rule).templateLabel }}</p>
                    <p class="mt-1 text-xs font-medium text-slate-500">템플릿 코드: {{ getAutomationRuleSummary(rule).templateCode || '-' }}</p>
                    <p v-if="getAutomationRuleSummary(rule).templateDescription" class="mt-2 text-xs leading-5 text-slate-500">
                      {{ getAutomationRuleSummary(rule).templateDescription }}
                    </p>
                  </div>
                  <div class="flex gap-2">
                    <button type="button" @click="openRuleModal(rule.recruitmentProcessId, rule)" class="text-xs font-bold text-brand-600">수정</button>
                    <button type="button" @click="deleteAutomationRule(rule.ruleId)" class="text-xs font-bold text-rose-600">삭제</button>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 모달: 링크 복사 성공 -->
    <Transition name="fade">
      <div v-if="showCopyModal" class="fixed inset-0 z-[70] flex items-center justify-center" role="dialog">
        <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="showCopyModal = false"></div>

        <div class="relative bg-white rounded-xl w-[400px] max-w-[90%] p-6 transform transition-all scale-100 border border-slate-200">
          <div class="flex flex-col items-center text-center">
            <div class="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 mb-4">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>

            <h3 class="text-xl font-bold text-slate-900 mb-2">링크 복사 완료</h3>
            <p class="text-slate-500 text-sm mb-6 leading-relaxed">
              채용 공고 링크가 클립보드에 복사되었습니다.<br>
              원하는 곳에 붙여넣어 공유해 보세요.
            </p>

            <button
                @click="showCopyModal = false"
                class="w-full py-2.5 px-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all"
            >
              확인
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <div
      v-if="applicantDetailModalOpen"
      class="fixed inset-0 z-[71] flex items-center justify-center bg-slate-950/35 px-4 backdrop-blur-sm"
      @click.self="closeApplicantDetailModal"
    >
      <div class="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_90px_-45px_rgba(15,23,42,0.55)]">
        <button
          type="button"
          class="absolute right-6 top-6 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-700"
          @click="closeApplicantDetailModal"
        >
          <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div class="flex-1 overflow-y-auto px-6 py-6">
          <div v-if="applicantDetailLoading" class="flex min-h-[16rem] items-center justify-center">
            <p class="text-sm font-bold text-slate-500">지원자 상세 정보를 불러오는 중입니다.</p>
          </div>

          <div v-else-if="applicantDetailError" class="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-center">
            <p class="text-sm font-bold text-rose-600">{{ applicantDetailError }}</p>
          </div>

          <template v-else-if="applicantDetail">
            <div class="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
              <div class="flex flex-wrap items-start justify-between gap-4">
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-3">
                    <h4 class="text-2xl font-black tracking-tight text-slate-950">{{ applicantDetail.name }}</h4>
                    <span
                      class="rounded-full border px-3 py-1 text-xs font-bold"
                      :class="getApplicantStatusStyle(applicantDetail.status)"
                    >
                      {{ applicantDetail.status }}
                    </span>
                  </div>
                  <p class="mt-2 text-sm font-medium text-slate-500">{{ applicantDetail.job }}</p>
                </div>

                <button
                  v-if="applicantDetail.resume"
                  type="button"
                  class="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-brand-200 hover:text-brand-700"
                  :disabled="downloadingApplicantFileId === applicantDetail.resume.fileId"
                  @click="handleApplicantResumeDownload"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  {{ downloadingApplicantFileId === applicantDetail.resume.fileId ? '다운로드 준비 중' : '이력서 다운로드' }}
                </button>
              </div>

              <div class="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <div v-if="applicantDetail.email && applicantDetail.email !== '-'" class="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p class="text-[11px] font-bold text-slate-400">이메일</p>
                  <p class="mt-1 break-all text-sm font-bold text-slate-900">{{ applicantDetail.email }}</p>
                </div>
                <div v-if="applicantDetail.phone && applicantDetail.phone !== '-'" class="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p class="text-[11px] font-bold text-slate-400">연락처</p>
                  <p class="mt-1 text-sm font-bold text-slate-900">{{ applicantDetail.phone }}</p>
                </div>
                <div v-if="applicantDetail.gender && applicantDetail.gender !== '-'" class="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p class="text-[11px] font-bold text-slate-400">성별</p>
                  <p class="mt-1 text-sm font-bold text-slate-900">{{ applicantDetail.gender }}</p>
                </div>
                <div v-if="applicantDetail.birthdate && applicantDetail.birthdate !== '-'" class="rounded-xl border border-slate-200 bg-white px-4 py-3">
                  <p class="text-[11px] font-bold text-slate-400">생년월일</p>
                  <p class="mt-1 text-sm font-bold text-slate-900">{{ applicantDetail.birthdate }}</p>
                </div>
              </div>
            </div>

            <div v-if="applicantDetail.answers.length > 0" class="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
              <div class="flex items-center justify-between gap-3">
                <h4 class="text-lg font-black tracking-tight text-slate-950">지원서 답변</h4>
                <span class="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                  {{ applicantDetail.answers.length }}개
                </span>
              </div>

              <div class="mt-4 space-y-4">
                <div
                  v-for="(answer, index) in applicantDetail.answers"
                  :key="`${answer.label}-${index}`"
                  class="rounded-xl border border-slate-200 bg-slate-50/65 p-4"
                >
                  <p class="text-sm font-bold text-slate-800">{{ answer.label }}</p>
                  <p class="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{{ answer.value }}</p>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div class="border-t border-slate-200 px-6 py-4">
          <div class="flex justify-end">
            <button
              type="button"
              class="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-800"
              @click="closeApplicantDetailModal"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>

    <ScheduleListModal
      :isOpen="isInterviewListModalOpen"
      :date="selectedDay ? toYmd(selectedDay) : ''"
      :events="selectedDayCalendarEvents"
      @close="closeDayDetail"
      @add="goInterview"
      @edit="openInterviewDetail"
    />

    <ScheduleDetailDrawer
      :is-open="isInterviewDetailModalOpen"
      :event="selectedInterview || {}"
      :show-actions="false"
      @close="isInterviewDetailModalOpen = false"
    />

  </div>
</template>

<style scoped>
@import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');

.schedule-surface__head {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: start;
  column-gap: 1rem;
  row-gap: 0.5rem;
  padding: 0 0 0.75rem;
}

.surface-title {
  font-size: 1.3rem;
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 1;
  color: rgb(15, 23, 42);
}

.surface-head-actions {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-left: auto;
  align-self: start;
}

.surface-head-nav {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.view-switch {
  display: inline-flex;
  gap: 0.15rem;
  padding: 0.15rem;
  border-radius: 8px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.92);
}

.view-switch__button {
  border-radius: 6px;
  padding: 0.5rem 0.9rem;
  font-size: 0.75rem;
  font-weight: 900;
  color: rgb(100, 116, 139);
  transition: all 0.18s ease;
}

.view-switch__button--active {
  background: rgb(20, 184, 166);
  color: white;
}

.toolbar-button,
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border-radius: 8px;
  font-size: 0.78rem;
  font-weight: 900;
  transition: all 0.18s ease;
}

.toolbar-button {
  padding: 0.72rem 0.95rem;
}

.icon-button {
  height: 2.1rem;
  width: 2.1rem;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.96);
  color: rgb(71, 85, 105);
}

.icon-button:hover {
  border-color: rgba(15, 118, 110, 0.28);
  color: rgb(15, 118, 110);
}

.toolbar-button-primary {
  border: 1px solid rgba(15, 118, 110, 0.92);
  background: rgb(15, 118, 110);
  color: white;
}

.toolbar-button-subtle {
  border: 1px solid rgba(20, 184, 166, 0.22);
  background: white;
  color: rgb(15, 118, 110);
}

.toolbar-button-primary:hover,
.toolbar-button-subtle:hover {
  filter: saturate(1.04);
}

.calendar-layout {
  display: flex;
  min-height: 0;
  flex: 1;
  gap: 1rem;
}

.calendar-layout__main {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.calendar-filter-panel {
  width: 220px;
  flex-shrink: 0;
  align-self: stretch;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 16px;
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.78), rgba(255, 255, 255, 0.96));
  padding: 1rem;
}

.calendar-filter-panel__head {
  padding-bottom: 0.9rem;
  margin-bottom: 0.9rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

.calendar-filter-panel__title {
  font-size: 0.82rem;
  font-weight: 900;
  color: rgb(15, 23, 42);
}

.calendar-filter-panel__caption {
  margin-top: 0.25rem;
  font-size: 0.72rem;
  font-weight: 700;
  color: rgb(100, 116, 139);
}

.calendar-filter-panel__list {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.calendar-filter-chip {
  width: 100%;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.96);
  padding: 0.72rem 0.85rem;
  font-size: 0.77rem;
  font-weight: 800;
  text-align: left;
  color: rgb(100, 116, 139);
  transition: all 0.18s ease;
}

.calendar-filter-chip__content {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
}

.calendar-filter-chip__dot {
  width: 0.72rem;
  height: 0.72rem;
  flex-shrink: 0;
  border-radius: 9999px;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.85);
}

.calendar-filter-chip__dot--all {
  background: linear-gradient(135deg, #0f766e 0%, #2563eb 28%, #7c3aed 52%, #ea580c 76%, #db2777 100%);
}

.calendar-filter-chip:hover {
  border-color: rgba(148, 163, 184, 0.8);
  color: rgb(51, 65, 85);
}

.calendar-filter-chip--active {
  border-color: rgba(20, 184, 166, 0.22);
  background: rgba(240, 253, 250, 0.95);
  color: rgb(15, 118, 110);
}

.month-weekdays {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(248, 250, 252, 0.52);
}

.month-weekdays__item {
  padding: 0.75rem 0;
  text-align: center;
  font-size: 0.68rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.month-grid {
  display: grid;
  flex: 1;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  grid-template-rows: repeat(5, minmax(118px, 1fr));
  border-top: 1px solid rgba(226, 232, 240, 0.88);
  border-left: 1px solid rgba(226, 232, 240, 0.88);
}

.month-cell {
  position: relative;
  min-height: 118px;
  border-right: 1px solid rgba(226, 232, 240, 0.84);
  border-bottom: 1px solid rgba(226, 232, 240, 0.84);
  padding: 0.75rem 0.7rem 0.65rem;
  transition: background 0.18s ease;
  cursor: pointer;
}

.month-cell:hover {
  background: rgba(248, 250, 252, 0.74);
}

.month-cell--muted {
  background: rgba(248, 250, 252, 0.42);
  cursor: default;
}

.month-cell--today {
  background: linear-gradient(180deg, rgba(240, 253, 250, 0.88), rgba(255, 255, 255, 0.9));
}

.month-cell--last {
  border-right: 0;
}

.month-cell__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.55rem;
}

.month-cell__day {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 1.75rem;
  min-width: 1.75rem;
  border-radius: 8px;
  font-size: 0.82rem;
  font-weight: 900;
  color: rgb(51, 65, 85);
}

.month-cell__day--today {
  background: rgb(20, 184, 166);
  border-radius: 9999px;
  color: white;
}

.month-cell__day--sunday {
  color: rgb(244, 63, 94);
}

.month-cell__day--saturday {
  color: rgb(99, 102, 241);
}

.month-cell__count {
  font-size: 0.65rem;
  font-weight: 900;
  color: rgb(100, 116, 139);
}

.month-cell__events {
  display: flex;
  flex-direction: column;
  gap: 0.32rem;
}

.month-event-chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  width: 100%;
  height: 1.75rem;
  padding: 0 0.55rem;
  border-radius: 4px;
  border: 0;
  border-left: 2px solid currentColor;
  font-size: 0.68rem;
  text-align: left;
  overflow: hidden;
}

.month-event-chip__time {
  flex-shrink: 0;
  font-weight: 900;
}

.month-event-chip__title {
  color: rgb(31, 41, 55);
  font-weight: 700;
}

.month-cell__more {
  padding-left: 0.15rem;
  font-size: 0.66rem;
  font-weight: 800;
  color: rgb(100, 116, 139);
}

.applicant-surface {
  background:
    linear-gradient(180deg, rgba(248, 250, 252, 0.76), rgba(255, 255, 255, 0.96));
}

.applicant-surface__head {
  padding-bottom: 1rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid rgba(226, 232, 240, 0.9);
}

.applicant-board-scroll {
  align-items: flex-start;
  width: max-content;
  min-height: 100%;
}

.applicant-search-field {
  position: relative;
  min-width: 260px;
}

.applicant-search-field__icon {
  position: absolute;
  left: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: rgb(148, 163, 184);
  pointer-events: none;
}

.applicant-search-field__input {
  width: 100%;
  height: 2.75rem;
  border-radius: 0.9rem;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.96);
  padding: 0 0.95rem 0 2.4rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: rgb(30, 41, 59);
  transition: all 0.18s ease;
}

.applicant-search-field__input::placeholder {
  color: rgb(148, 163, 184);
}

.applicant-search-field__input:focus {
  outline: none;
  border-color: rgba(20, 184, 166, 0.75);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
}

.automation-select,
.automation-form input {
  appearance: none;
  background: #ffffff;
  color: rgb(15, 23, 42);
  border-color: rgb(226, 232, 240);
}

.automation-select:focus,
.automation-form input:focus {
  outline: none;
  border-color: rgb(20, 184, 166);
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
}

.automation-select option {
  color: rgb(15, 23, 42);
  background: #ffffff;
}

@media (max-width: 1024px) {
  .schedule-surface__head {
    grid-template-columns: 1fr;
  }

  .surface-head-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
    margin-left: 0;
  }

  .applicant-search-field {
    width: 100%;
    min-width: 0;
  }

  .calendar-layout {
    flex-direction: column;
  }

  .calendar-filter-panel {
    width: 100%;
  }

  .calendar-filter-panel__list {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .calendar-filter-chip {
    width: auto;
  }
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out forwards;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

