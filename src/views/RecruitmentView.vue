<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRecruitmentStore } from '@/stores/recruitment'
import { storeToRefs } from 'pinia'
import { useOrganizationStore } from '@/stores/organization'
import { recruitmentApi } from '@/api/recruitment'
import { memberApi } from '@/api/member'
import { useAuth } from '@/composables/useAuth'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

import InterviewDetailModal from '@/components/recruitment/InterviewDetailModal.vue'
import WeeklyInterviewListModal from '@/components/recruitment/WeeklyInterviewListModal.vue'

const router = useRouter()
const store = useRecruitmentStore()
const organizationStore = useOrganizationStore()
const { user } = useAuth()
const { jobs, loading } = storeToRefs(store)
const { organizations, allMembers } = storeToRefs(organizationStore)

const weeklyInterviewSchedules = ref([])
const memberType = ref('')

// --- 페이지 진입 시 API 호출 ---
onMounted(async () => {
  const [recruitmentsResult, weeklySchedulesResult, organizationsResult, memberResult] = await Promise.allSettled([
    store.fetchRecruitments(),
    fetchWeeklyInterviewSchedules(),
    organizationStore.loadOrganizations({ force: true }),
    memberApi.getMyMember()
  ])

  if (recruitmentsResult.status === 'rejected') {
    console.error('채용 공고 목록 조회 실패:', recruitmentsResult.reason)
  }

  if (weeklySchedulesResult.status === 'rejected') {
    console.error('이번 주 면접 일정 조회 실패:', weeklySchedulesResult.reason)
  }

  if (organizationsResult.status === 'rejected') {
    console.error('조직도 조회 실패:', organizationsResult.reason)
  }

  if (memberResult.status === 'fulfilled') {
    memberType.value = memberResult.value?.data?.data?.memberType || ''
  } else {
    console.error('멤버 정보 조회 실패:', memberResult.reason)
  }
})

// --- BE 응답 → UI 필드 변환 헬퍼 ---
const getDday = (recruitmentStatus, startDate, endDate) => {
  const now = new Date()
  now.setHours(0, 0, 0, 0)

  if (recruitmentStatus === 'CLOSED') {
    return { text: '\uB9C8\uAC10', value: -1, detail: null }
  }

  if (recruitmentStatus === 'DRAFT') {
    if (!startDate) {
      return { text: '\uAC8C\uC2DC \uC804', value: 999, detail: null }
    }

    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    const diffToStart = Math.ceil((start - now) / (1000 * 60 * 60 * 24))

    return {
      text: '\uAC8C\uC2DC \uC804',
      value: 999,
      detail: diffToStart > 0 ? `${diffToStart}\uC77C \uD6C4 \uC2DC\uC791` : null
    }
  }

  if (!endDate) return { text: '-', value: 99, detail: null }

  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return { text: '\uB9C8\uAC10', value: diffDays, detail: null }
  return { text: `D-${diffDays}`, value: diffDays, detail: null }
}

const getDisplayStatus = (recruitmentStatus, endDate) => {
  if (recruitmentStatus === 'CLOSED') return 'closed'
  if (recruitmentStatus === 'DRAFT') return 'pending'

  if (recruitmentStatus === 'OPEN') {
    if (!endDate) return 'active'

    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const end = new Date(endDate)
    end.setHours(0, 0, 0, 0)

    const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
    if (diffDays <= 0) return 'closed'
    if (diffDays <= 3) return 'urgent'
    return 'active'
  }

  return 'pending'
}

const getCareerText = (job) => {
  if (job.careerType === 'NEW') return '신입'
  if (job.careerType === 'EXPERIENCED') {
    const min = job.minExperienceYears
    const max = job.maxExperienceYears
    if (min && max) return `경력 ${min}~${max}년`
    if (min) return `경력 ${min}년 이상`
    return '경력'
  }
  return '경력 무관'
}

const toPositiveNumber = (value) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : null
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

const normalizeDisplayName = (value) => {
  const text = String(value || '').trim()
  if (!text || text === '?' || text === '알 수 없음') return ''
  return text
}

const isPipelineStage = (stage) => {
  const stageName = String(stage?.stageName || stage?.step || '').trim()
  return stageName !== '불합격' && stageName !== '탈락'
}

// 목록 단계 바에서 최종 합격 단계를 항상 마지막에 보이도록 정규화한다.
const normalizePipelineStages = (stages) => {
  const visibleStages = (Array.isArray(stages) ? stages : []).filter(isPipelineStage)
  const passStage = visibleStages.find((stage) => String(stage?.stageName || stage?.step || '').trim() === '최종 합격')
  const nonPassStages = visibleStages.filter((stage) => String(stage?.stageName || stage?.step || '').trim() !== '최종 합격')

  if (passStage) {
    return [...nonPassStages, passStage]
  }

  return [...nonPassStages, { stageName: '최종 합격', applicantCount: 0 }]
}

const currentUserId = computed(() => toPositiveNumber(user.value?.id))
const currentUserName = computed(() => normalizeDisplayName(user.value?.name))
const canManageRecruitment = computed(() => memberType.value === 'HR')

const resolveTeamName = (job) => {
  return (
    normalizeDisplayName(job.leadGroupName) ||
    normalizeDisplayName(job.leadTeamName) ||
    normalizeDisplayName(job.team) ||
    getTeamNameById(job.leadGroupId ?? job.leadTeamId ?? job.teamId) ||
    '부서 미지정'
  )
}

const resolveInterviewerNames = (job) => {
  const names = []
  const addName = (candidate) => {
    const normalized = normalizeDisplayName(candidate)
    if (!normalized) return
    if (!names.includes(normalized)) names.push(normalized)
  }

  const memberNameById = new Map(
    getAllMembers()
      .map((member) => [toPositiveNumber(member.userId ?? member.id ?? member.memberId), normalizeDisplayName(member.name)])
      .filter(([id, name]) => id && name)
  )

  const addId = (idCandidate) => {
    const id = toPositiveNumber(idCandidate)
    if (!id) return
    addName(memberNameById.get(id))
  }

  const assignees = Array.isArray(job.assignees) ? job.assignees : []
  const explicitIds = Array.isArray(job.interviewerIds) ? job.interviewerIds : []
  const interviewers = Array.isArray(job.interviewers) ? job.interviewers : []

  explicitIds.forEach((id) => addId(id))

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

  return names
}

const formatDateParam = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toYmd = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toHm = (date) => {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const splitNames = (value) => {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

// 이름 목록을 화면 표시용으로 정리하고 중복을 제거한다.
const getUniqueNames = (values) => {
  return values
    .map((value) => normalizeDisplayName(value))
    .filter((name, index, names) => name && names.indexOf(name) === index)
}

// 현재 로그인 사용자가 이번 면접의 면접관인지 판단한다.
const isCurrentUserInterviewer = (item, interviewerNames) => {
  const interviewerUserId = toPositiveNumber(item?.interviewerUserId)
  if (currentUserId.value && interviewerUserId && currentUserId.value === interviewerUserId) {
    return true
  }

  if (!currentUserName.value) return false
  return interviewerNames.includes(currentUserName.value)
}

const normalizeWeeklySchedule = (item) => {
  const start = item?.startAt ? new Date(item.startAt) : null
  if (!(start instanceof Date) || Number.isNaN(start.getTime())) {
    return null
  }

  const end = item?.endAt ? new Date(item.endAt) : new Date(start.getTime())
  const interviewerNames = getUniqueNames(splitNames(item?.interviewerName))
  const applicantNames = getUniqueNames(splitNames(item?.applicantName))
  const showSelf = isCurrentUserInterviewer(item, interviewerNames)
  const attendees = getUniqueNames([
    ...interviewerNames.filter((name) => !showSelf || name !== currentUserName.value),
    ...applicantNames
  ])

  const locationParts = [String(item?.location || '').trim(), String(item?.description || '').trim()]
    .filter(Boolean)

  return {
    id: item.id,
    recruitmentId: toPositiveNumber(item?.recruitmentId),
    title: String(item?.title || '').trim() || '면접 일정',
    applicantName: String(item?.applicantName || '').trim(),
    date: toYmd(start),
    startTime: toHm(start),
    endTime: toHm(end),
    time: `${toHm(start)} - ${toHm(end)}`,
    location: locationParts.join(' · '),
    description: String(item?.description || '').trim(),
    showSelf,
    attendees
  }
}

const fetchWeeklyInterviewSchedules = async () => {
  const today = new Date()
  const response = await recruitmentApi.getWeeklyInterviewSchedules(formatDateParam(today))
  const data = response?.data?.data || []

  weeklyInterviewSchedules.value = Array.isArray(data)
    ? data.map(normalizeWeeklySchedule).filter(Boolean)
    : []

  return weeklyInterviewSchedules.value
}

// --- 상태 관리 ---
const activeMenuId = ref(null) // 드롭다운 메뉴 상태
const expandedRecruitmentIds = ref(new Set())
const showDeleteModal = ref(false) // 삭제 모달 상태
const showCopyModal = ref(false) // 링크 복사 성공 모달 상태
const deleteTargetId = ref(null) // 삭제할 공고 ID 저장
const deleting = ref(false) // 삭제 진행 상태
const publishingRecruitmentId = ref(null)
const noticeModal = ref({
  show: false,
  title: '알림',
  message: '',
  type: 'info',
  confirmText: '확인',
  showCancel: false,
  onConfirm: null
})

const ensureHrRecruitmentAction = (message) => {
  if (memberType.value === 'HR') {
    return true
  }

  openNoticeModal({
    title: '권한 없음',
    message,
    type: 'warning'
  })
  return false
}

// --- 면접 일정 관련 상태 ---
const showWeeklyModal = ref(false)
const showDetailModal = ref(false)
const selectedInterview = ref(null)

// --- 데이터 (Computed) ---
const weeklySchedules = computed(() => weeklyInterviewSchedules.value)

const stats = computed(() => {
  const activeJobsCount = jobs.value.filter(j => j.status === 'OPEN').length
  const interviewsThisWeek = weeklySchedules.value.length
  const urgentJobsCount = jobs.value.filter((job) =>
    getDisplayStatus(job.status, job.endDate) === 'urgent'
  ).length

  return [
    {
      label: '진행 중인 공고',
      value: activeJobsCount,
      unit: '건',
      tone: 'slate',
      helper: activeJobsCount > 0 ? '현재 게시 중인 공고를 빠르게 확인합니다.' : '게시 중인 공고가 없습니다.'
    },
    {
      label: '이번 주 면접 예정',
      value: interviewsThisWeek,
      unit: '건',
      tone: 'brand',
      helper: interviewsThisWeek > 0 ? '주간 면접 일정을 바로 열어 확인합니다.' : '이번 주 예정된 면접이 없습니다.',
      onClick: () => { showWeeklyModal.value = true }
    },
    {
      label: '마감 임박 공고',
      value: urgentJobsCount,
      unit: '건',
      tone: 'rose',
      helper: urgentJobsCount > 0 ? '곧 마감되는 공고를 우선 점검합니다.' : '지금은 마감 임박 공고가 없습니다.',
      onClick: () => {
        statusFilter.value = statusFilter.value === '마감 임박' ? '전체 상태' : '마감 임박'
      }
    }
  ]
})

const openInterviewDetail = (schedule) => {
  selectedInterview.value = schedule
  showDetailModal.value = true
  // showWeeklyModal.value = false // Keep weekly list open behind? Or close? User said "reuse modal", implies standard detailed view. 
  // Stacking modals is okay if z-index is managed. 
  // Let's close weekly modal for cleaner UX on mobile, or keep it. 
  // Actually, let's keep it open so user can go back easily by closing detail.
}

// ... existing code ...

const isInterviewerModalOpen = ref(false)
// ...
const expandedDepts = ref(new Set())
const expandedTeams = ref(new Set())

// --- Helper Functions ---
const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'text-brand-700 bg-brand-50 border-brand-200'
    case 'urgent': return 'text-rose-700 bg-rose-50 border-rose-200 animate-pulse'
    case 'closed': return 'text-slate-600 bg-slate-100 border-slate-200'
    case 'pending': return 'text-amber-700 bg-amber-50 border-amber-200'
    default: return 'text-slate-600'
  }
}

const getStatusValueColor = (status) => {
  switch (status) {
    case 'active': return 'text-brand-700'
    case 'urgent': return 'text-rose-600'
    case 'closed': return 'text-slate-500'
    case 'pending': return 'text-amber-600'
    default: return 'text-slate-900'
  }
}

const toggleMenu = (id) => {
  if (activeMenuId.value === id) {
    activeMenuId.value = null
  } else {
    activeMenuId.value = id
  }
}

const openNoticeModal = ({
  title = '알림',
  message = '',
  type = 'info',
  confirmText = '확인',
  showCancel = false,
  onConfirm = null
} = {}) => {
  noticeModal.value = { show: true, title, message, type, confirmText, showCancel, onConfirm }
}

const closeNoticeModal = () => {
  noticeModal.value = { ...noticeModal.value, show: false, onConfirm: null }
}

const handleNoticeConfirm = () => {
  const onConfirm = noticeModal.value.onConfirm
  closeNoticeModal()
  if (typeof onConfirm === 'function') onConfirm()
}

const goToDetail = (id) => {
  router.push(`/recruitment/jobs/${id}`)
}

const isRecruitmentExpanded = (recruitmentId) => expandedRecruitmentIds.value.has(recruitmentId)

const toggleRecruitmentExpanded = (recruitmentId) => {
  const nextExpandedIds = new Set(expandedRecruitmentIds.value)

  if (nextExpandedIds.has(recruitmentId)) {
    nextExpandedIds.delete(recruitmentId)
  } else {
    nextExpandedIds.add(recruitmentId)
  }

  expandedRecruitmentIds.value = nextExpandedIds
}

// 1. 삭제 버튼 클릭 시 모달 열기
const openDeleteModal = (id) => {
  if (!ensureHrRecruitmentAction('채용 공고 삭제는 인사담당자만 가능합니다.')) {
    return
  }
  deleteTargetId.value = id
  showDeleteModal.value = true
  activeMenuId.value = null // 열려있는 메뉴 닫기
}

// 2. 모달 닫기
const closeDeleteModal = () => {
  showDeleteModal.value = false
  deleteTargetId.value = null
}

const requestPublishRecruitment = (job) => {
  if (!ensureHrRecruitmentAction('채용 공고 게시는 인사담당자만 가능합니다.')) {
    return
  }
  openNoticeModal({
    title: '즉시 게시',
    message: '이 공고를 지금 바로 게시하시겠습니까? 게시 후에는 기본 정보 수정이 제한됩니다.',
    type: 'info',
    confirmText: '즉시 게시',
    showCancel: true,
    onConfirm: async () => {
      await publishRecruitment(job.id)
    }
  })
  activeMenuId.value = null
}

const publishRecruitment = async (recruitmentId) => {
  if (!recruitmentId || publishingRecruitmentId.value) return

  publishingRecruitmentId.value = recruitmentId
  try {
    await store.publishRecruitment(recruitmentId)
    await store.fetchRecruitments()
    openNoticeModal({
      title: '게시 완료',
      message: '채용 공고가 즉시 게시되었습니다.',
      type: 'success'
    })
  } catch (err) {
    const message =
      err?.response?.data?.error?.message ||
      err?.response?.data?.message ||
      '채용 공고 게시 중 오류가 발생했습니다.'
    openNoticeModal({
      title: '게시 실패',
      message,
      type: 'warning'
    })
  } finally {
    publishingRecruitmentId.value = null
  }
}

// 3. 실제 삭제 수행
const confirmDelete = async () => {
  if (!ensureHrRecruitmentAction('채용 공고 삭제는 인사담당자만 가능합니다.')) {
    return
  }
  if (!deleteTargetId.value || deleting.value) return

  deleting.value = true
  try {
    await store.deleteRecruitment(deleteTargetId.value)
    closeDeleteModal()
  } catch (err) {
    const message = err?.response?.data?.message || '채용 공고 삭제 중 오류가 발생했습니다.'
    alert(message)
  } finally {
    deleting.value = false
  }
}

const goToCreateRecruitment = () => {
  if (!ensureHrRecruitmentAction('채용 공고 생성은 인사담당자만 가능합니다.')) {
    return
  }
  router.push('/recruitment/create')
}

const goToEditRecruitment = (jobId) => {
  if (!ensureHrRecruitmentAction('채용 공고 수정은 인사담당자만 가능합니다.')) {
    return
  }
  router.push(`/recruitment/jobs/${jobId}/edit`)
}

const resetFilters = () => {
  searchQuery.value = ''
  statusFilter.value = '전체 상태'
  sortBy.value = '최신순'
}

// --- 검색 및 필터링 로직 ---
const searchQuery = ref('')
const statusFilter = ref('전체 상태')
const sortBy = ref('최신순')

const filteredJobs = computed(() => {
  let result = jobs.value.map(job => {
    const dday = getDday(job.status, job.startDate, job.endDate)
    const funnel = normalizePipelineStages(job.stages).map(s => ({
      step: s.stageName,
      count: s.applicantCount || 0,
      active: (s.applicantCount || 0) > 0
    }))
    const interviewers = resolveInterviewerNames(job)
    return {
      ...job,
      dday: dday.text,
      ddayValue: dday.value,
      ddayDetail: dday.detail || null,
      displayStatus: getDisplayStatus(job.status, job.endDate),
      team: resolveTeamName(job),
      position: getCareerText(job),
      funnel,
      interviewers,
      interviewerPreview: interviewers.slice(0, 4),
      interviewerCount: interviewers.length,
      stageCount: funnel.length,
      applicantTotal: funnel.reduce((total, step) => total + step.count, 0)
    }
  })

  // 1. 검색어 필터링
  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter(job => 
      job.title.toLowerCase().includes(query) ||
      job.team.toLowerCase().includes(query) ||
      job.position.toLowerCase().includes(query) ||
      job.interviewers.some(intr => intr.toLowerCase().includes(query))
    )
  }

  // 2. 상태 필터링
  if (statusFilter.value !== '전체 상태') {
    const statusMap = {
      '진행 중': 'active',
      '마감 임박': 'urgent',
      '종료됨': 'closed',
      '게시 전': 'pending'
    }
    const targetStatus = statusMap[statusFilter.value]
    result = result.filter(job => job.displayStatus === targetStatus)
  }

  // 3. 정렬
  if (sortBy.value === '최신순') {
    result.sort((a, b) => new Date(b.endDate || 0) - new Date(a.endDate || 0))
  } else if (sortBy.value === '지원자순') {
    result.sort((a, b) => b.applicantTotal - a.applicantTotal)
  } else if (sortBy.value === '마감일순') {
    result.sort((a, b) => a.ddayValue - b.ddayValue)
  }

  return result
})

const memberRoleLabel = computed(() => (canManageRecruitment.value ? '인사담당자' : '공고 참여자'))

const heroDescription = computed(() => (
  canManageRecruitment.value
    ? '공고 생성부터 게시, 면접관 배정, 마감 임박 대응까지 채용 운영 흐름을 한 화면에서 빠르게 정리합니다.'
    : '내가 연결된 공고와 이번 주 면접 일정을 기준으로 필요한 채용 흐름만 빠르게 확인할 수 있습니다.'
))

const visibleRecruitmentCount = computed(() => filteredJobs.value.length)

const pendingRecruitmentCount = computed(() => jobs.value.filter((job) => job.status === 'DRAFT').length)

const nextDeadlineJob = computed(() => {
  const candidates = filteredJobs.value
    .filter((job) => ['active', 'urgent', 'pending'].includes(job.displayStatus) && Number.isFinite(job.ddayValue))
    .slice()
    .sort((a, b) => a.ddayValue - b.ddayValue)

  return candidates[0] || null
})

const activeFilters = computed(() => {
  const filters = []

  if (searchQuery.value.trim()) {
    filters.push({ label: '검색', value: searchQuery.value.trim() })
  }

  if (statusFilter.value !== '전체 상태') {
    filters.push({ label: '상태', value: statusFilter.value })
  }

  if (sortBy.value !== '최신순') {
    filters.push({ label: '정렬', value: sortBy.value })
  }

  return filters
})

const isFilterApplied = computed(() => {
  return Boolean(searchQuery.value.trim()) || statusFilter.value !== '전체 상태'
})

const showEmptyState = computed(() => !loading.value && filteredJobs.value.length === 0)

const emptyState = computed(() => {
  if (isFilterApplied.value) {
    return {
      title: '조건에 맞는 채용 공고가 없습니다.',
      description: '검색어나 상태 필터를 다시 조정하면 다른 채용 공고를 확인할 수 있습니다.',
      actionText: '필터 초기화',
      action: resetFilters
    }
  }

  if (canManageRecruitment.value) {
    return {
      title: '아직 등록된 채용 공고가 없습니다.',
      description:
        '첫 채용 공고를 등록하면 이 공간에서 공고 현황과 이번 주 면접 일정을 함께 관리할 수 있습니다.',
      actionText: '새 공고 만들기',
      action: goToCreateRecruitment
    }
  }

  return {
    title: '현재 확인할 수 있는 채용 공고가 없습니다.',
    description:
      '담당 조직, 참조 조직, 또는 등록된 면접관으로 연결된 채용 공고만 이 화면에 표시됩니다.',
    actionText: '',
    action: null
  }
})

// --- 링크 복사 및 면접관 설정 기능 ---
const editingJob = ref(null)
const interviewerSearchQuery = ref('')
const savingInterviewers = ref(false)
const interviewerFallbackMap = ref({})

const toggleDept = (deptId) => {
  if (expandedDepts.value.has(deptId)) expandedDepts.value.delete(deptId)
  else expandedDepts.value.add(deptId)
}

const toggleTeam = (teamId) => {
  if (expandedTeams.value.has(teamId)) expandedTeams.value.delete(teamId)
  else expandedTeams.value.add(teamId)
}

const getMemberUserId = (member) => {
  const id = toPositiveNumber(member?.userId ?? member?.id ?? member?.memberId)
  return id || null
}

const filteredOrganizations = computed(() => {
  const query = interviewerSearchQuery.value.trim().toLowerCase()
  if (!query) return organizations.value

  return organizations.value
    .map((dept) => ({
      ...dept,
      teams: (dept.teams || [])
        .map((team) => ({
          ...team,
          members: (team.members || []).filter((member) =>
            String(member?.name || '').toLowerCase().includes(query) ||
            String(member?.position || '').toLowerCase().includes(query)
          )
        }))
        .filter((team) => team.members.length > 0)
    }))
    .filter((dept) => dept.teams.length > 0)
})

const selectedInterviewerDetails = computed(() => {
  if (!editingJob.value) return []

  return editingJob.value.selectedInterviewerIds.map((id) => {
    const numericId = Number(id)
    const member = allMembers.value.find((item) => getMemberUserId(item) === numericId)
    return member || interviewerFallbackMap.value[numericId] || { id: numericId, userId: numericId, name: '알 수 없음', position: '', teamName: '' }
  })
})

const copyLink = () => {
  let workspaceId = localStorage.getItem('workspaceId')

  if (!workspaceId) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}')
      workspaceId = user?.workspaceId ?? user?.workspace?.workspaceId ?? user?.workspace?.id ?? null
    } catch (_) {
      workspaceId = null
    }
  }

  if (!workspaceId) {
    alert('워크스페이스 정보를 찾을 수 없습니다.')
    return
  }

  const link = `${window.location.origin}/careers/${workspaceId}`
  navigator.clipboard.writeText(link).then(() => {
    showCopyModal.value = true
    activeMenuId.value = null
  }).catch(err => {
    console.error('링크 복사 실패:', err)
  })
}

const addInterviewerId = (target, value) => {
  const interviewerId = toPositiveNumber(value)
  if (!interviewerId || target.includes(interviewerId)) return
  target.push(interviewerId)
}

const resolveSelectedInterviewerIds = (job) => {
  const interviewerIds = []

  ;(Array.isArray(job?.interviewerIds) ? job.interviewerIds : []).forEach((id) =>
    addInterviewerId(interviewerIds, id)
  )

  ;(Array.isArray(job?.assignees) ? job.assignees : []).forEach((assignee) =>
    addInterviewerId(interviewerIds, assignee?.userId ?? assignee?.id)
  )

  ;(Array.isArray(job?.interviewers) ? job.interviewers : []).forEach((interviewer) => {
    if (typeof interviewer === 'object') {
      addInterviewerId(interviewerIds, interviewer?.userId ?? interviewer?.id)
      return
    }

    const matchedInterviewer = allMembers.value.find(
      (member) => member.name === normalizeDisplayName(interviewer)
    )
    addInterviewerId(interviewerIds, getMemberUserId(matchedInterviewer))
  })

  return interviewerIds
}

const buildInterviewerFallbackMap = (job) => {
  const nextFallbackMap = {}
  const setFallback = (candidate) => {
    const userId = toPositiveNumber(candidate?.userId ?? candidate?.id ?? candidate?.memberId)
    const name = normalizeDisplayName(candidate?.name ?? candidate?.memberName ?? candidate?.interviewerName)
    if (!userId || !name) return
    nextFallbackMap[userId] = {
      id: userId,
      userId,
      name,
      position: '',
      teamName: ''
    }
  }

  ;(Array.isArray(job?.assignees) ? job.assignees : []).forEach((assignee) => {
    setFallback(assignee)
  })

  ;(Array.isArray(job?.interviewers) ? job.interviewers : []).forEach((interviewer) => {
    if (typeof interviewer !== 'object' || interviewer === null) return
    setFallback(interviewer)
  })

  return nextFallbackMap
}

const isSelectedInterviewer = (interviewerId) => {
  const normalizedId = toPositiveNumber(interviewerId)
  if (!normalizedId || !editingJob.value) return false
  return editingJob.value.selectedInterviewerIds.includes(normalizedId)
}

const openInterviewerModal = async (job) => {
  if (!ensureHrRecruitmentAction('면접관 설정은 인사담당자만 가능합니다.')) {
    return
  }
  try {
    await organizationStore.loadOrganizations({ force: true })
  } catch (error) {
    console.error('면접관 조직도 조회 실패:', error)
    openNoticeModal({
      title: '설정 오류',
      message: '면접관 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
      type: 'warning'
    })
    return
  }

  interviewerFallbackMap.value = buildInterviewerFallbackMap(job)
  editingJob.value = {
    id: job.id,
    title: job.title,
    selectedInterviewerIds: resolveSelectedInterviewerIds(job)
  }
  expandedDepts.value = new Set()
  expandedTeams.value = new Set()
  isInterviewerModalOpen.value = true
  interviewerSearchQuery.value = ''
  activeMenuId.value = null
}

const closeInterviewerModal = () => {
  isInterviewerModalOpen.value = false
  editingJob.value = null
  interviewerFallbackMap.value = {}
  interviewerSearchQuery.value = ''
}

const toggleInterviewerAssignment = (interviewerId) => {
  if (!editingJob.value) return
  const normalizedId = toPositiveNumber(interviewerId)
  if (!normalizedId) return
  const index = editingJob.value.selectedInterviewerIds.indexOf(normalizedId)
  if (index === -1) {
    editingJob.value.selectedInterviewerIds.push(normalizedId)
  } else {
    editingJob.value.selectedInterviewerIds.splice(index, 1)
  }
}

const removeInterviewer = (interviewerId) => {
  if (!editingJob.value) return
  const normalizedId = toPositiveNumber(interviewerId)
  if (!normalizedId) return
  const index = editingJob.value.selectedInterviewerIds.indexOf(normalizedId)
  if (index !== -1) {
    editingJob.value.selectedInterviewerIds.splice(index, 1)
  }
}

const saveInterviewers = async () => {
  if (!ensureHrRecruitmentAction('면접관 설정은 인사담당자만 가능합니다.')) {
    return
  }
  if (!editingJob.value || savingInterviewers.value) return
  if (editingJob.value.selectedInterviewerIds.length === 0) {
    openNoticeModal({
      title: '설정 확인',
      message: '면접관은 최소 1명 이상 선택해주세요.',
      type: 'warning'
    })
    return
  }

  savingInterviewers.value = true
  try {
    await store.updateRecruitmentInterviewers(
      editingJob.value.id,
      editingJob.value.selectedInterviewerIds
    )
    closeInterviewerModal()
  } catch (err) {
    const message = err?.response?.data?.message || '면접관 설정 저장 중 오류가 발생했습니다.'
    openNoticeModal({
      title: '설정 오류',
      message,
      type: 'warning'
    })
  } finally {
    savingInterviewers.value = false
  }
}
</script>


<template>
  <div class="relative space-y-6 p-2 animate-fade-in-up">
    <div
      v-if="activeMenuId !== null"
      class="fixed inset-0 z-10 cursor-default"
      @click="activeMenuId = null"
    ></div>

    <section class="rounded-[24px] border border-brand-100 bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.16),_transparent_42%),linear-gradient(135deg,_rgba(255,255,255,0.98),_rgba(240,253,250,0.94))] p-4">
      <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div class="min-w-0">
          <div class="flex flex-wrap items-center gap-2">
            <h1 class="text-[1.7rem] font-bold tracking-tight text-slate-950 sm:text-[1.9rem]">채용 홈</h1>
            <span class="inline-flex items-center rounded-full border border-white/80 bg-white/75 px-3 py-1 text-xs font-semibold text-slate-600">
              {{ canManageRecruitment ? '인사담당자' : '공고 참여자' }}
            </span>
          </div>

          <p class="mt-1.5 text-[13px] text-slate-500">
            전체 {{ jobs.length }}개 · 현재 {{ visibleRecruitmentCount }}개 표시
            <template v-if="nextDeadlineJob">
              · 다음 마감 {{ nextDeadlineJob.title }} {{ nextDeadlineJob.dday }}
            </template>
          </p>
        </div>

        <button
          v-if="canManageRecruitment"
          type="button"
          class="inline-flex items-center gap-2 rounded-2xl border border-brand-200 bg-white px-3.5 py-2 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          @click="goToCreateRecruitment"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          새 공고
        </button>
      </div>

      <div class="mt-3 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        <div class="rounded-[20px] border border-white/80 bg-white/75 px-4 py-2.5">
          <p class="text-xs font-semibold text-slate-500">진행 중 공고</p>
          <div class="mt-1.5 flex items-baseline gap-1">
            <span class="text-[1.7rem] font-bold text-slate-950">{{ stats[0]?.value ?? 0 }}</span>
            <span class="text-sm text-slate-400">건</span>
          </div>
        </div>

        <div class="rounded-[20px] border border-white/80 bg-white/75 px-4 py-2.5">
          <p class="text-xs font-semibold text-slate-500">게시 대기</p>
          <div class="mt-1.5 flex items-baseline gap-1">
            <span class="text-[1.7rem] font-bold text-slate-950">{{ pendingRecruitmentCount }}</span>
            <span class="text-sm text-slate-400">건</span>
          </div>
        </div>

        <button
          type="button"
          class="rounded-[20px] border border-white/80 bg-white/75 px-4 py-2.5 text-left transition-colors hover:border-brand-200 hover:bg-white"
          @click="showWeeklyModal = true"
        >
          <p class="text-xs font-semibold text-slate-500">이번 주 면접</p>
          <div class="mt-1.5 flex items-baseline gap-1">
            <span class="text-[1.7rem] font-bold text-brand-700">{{ stats[1]?.value ?? 0 }}</span>
            <span class="text-sm text-slate-400">건</span>
          </div>
        </button>

        <button
          type="button"
          class="rounded-[20px] border border-white/80 bg-white/75 px-4 py-2.5 text-left transition-colors hover:border-rose-200 hover:bg-white"
          @click="statusFilter === '마감 임박' ? statusFilter = '전체 상태' : statusFilter = '마감 임박'"
        >
          <p class="text-xs font-semibold text-slate-500">마감 임박</p>
          <div class="mt-1.5 flex items-baseline gap-1">
            <span class="text-[1.7rem] font-bold text-rose-600">{{ stats[2]?.value ?? 0 }}</span>
            <span class="text-sm text-slate-400">건</span>
          </div>
        </button>
      </div>
    </section>

    <section class="rounded-[24px] border border-slate-200 bg-white p-4">
      <div class="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 class="text-lg font-bold text-slate-950">채용 공고</h2>
        </div>

        <div class="flex flex-wrap items-center gap-2 text-sm">
          <span class="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">전체 {{ jobs.length }}개</span>
          <span class="rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700">현재 {{ visibleRecruitmentCount }}개 표시</span>
        </div>
      </div>

      <div class="mt-4 grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="공고명, 부서명 또는 담당자 검색..."
            class="w-full rounded-[20px] border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <select
            v-model="statusFilter"
            class="rounded-[20px] border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-700 transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option>전체 상태</option>
            <option>진행 중</option>
            <option>마감 임박</option>
            <option>게시 전</option>
            <option>종료됨</option>
          </select>

          <select
            v-model="sortBy"
            class="rounded-[20px] border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-700 transition-all focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option>최신순</option>
            <option>지원자순</option>
            <option>마감일순</option>
          </select>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-2">
        <span
          v-if="activeFilters.length === 0"
          class="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500"
        >
          필터가 적용되지 않았습니다.
        </span>

        <span
          v-for="filter in activeFilters"
          :key="`${filter.label}-${filter.value}`"
          class="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
        >
          {{ filter.label }} · {{ filter.value }}
        </span>

        <button
          v-if="isFilterApplied"
          type="button"
          class="ml-auto inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-200 hover:text-brand-700"
          @click="resetFilters"
        >
          필터 초기화
        </button>
      </div>
    </section>

    <div
      v-if="showEmptyState"
      class="rounded-[28px] border border-dashed border-slate-300 bg-white px-8 py-16 text-center"
    >
      <div class="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <svg class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 17v-6m3 6V7m3 10v-3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 class="mb-2 text-xl font-bold text-slate-900">{{ emptyState.title }}</h3>
      <p class="mx-auto max-w-xl text-sm leading-relaxed text-slate-500">
        {{ emptyState.description }}
      </p>
      <button
        v-if="emptyState.action"
        type="button"
        class="mt-6 inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700"
        @click="emptyState.action && emptyState.action()"
      >
        {{ emptyState.actionText }}
      </button>
    </div>

    <div v-else class="space-y-4">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-slate-950">채용 카드</h3>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="job in filteredJobs"
          :key="job.id"
          class="group relative rounded-[26px] border border-slate-200 bg-white p-5 transition-colors duration-200 hover:border-brand-300"
          :class="{ 'z-20 border-brand-300 ring-1 ring-brand-100': activeMenuId === job.id }"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 flex-1 cursor-pointer" @click="goToDetail(job.id)">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  :class="['inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold', getStatusColor(job.displayStatus)]"
                  :title="job.ddayDetail || ''"
                >
                  {{ job.dday }}
                  <span v-if="job.ddayDetail" class="ml-1 text-[10px] font-normal opacity-75">{{ job.ddayDetail }}</span>
                </span>
                <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{{ job.team }}</span>
                <span class="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">{{ job.position }}</span>
              </div>

              <div class="mt-4">
                <h3 class="truncate text-xl font-bold text-slate-950 transition-colors group-hover:text-brand-700">{{ job.title }}</h3>
                <p class="mt-2 text-sm leading-6 text-slate-500">
                  면접관 {{ job.interviewerCount }}명 · 채용 단계 {{ job.stageCount }}개 · 지원자 {{ job.applicantTotal }}명
                </p>
              </div>
            </div>

            <div class="relative flex self-stretch flex-col items-end justify-between pb-1">
              <button
                type="button"
                class="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                @click.stop="toggleMenu(job.id)"
              >
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>

              <div
                v-if="activeMenuId === job.id"
                class="absolute right-0 top-9 z-30 w-48 origin-top-right rounded-2xl border border-slate-200 bg-white py-1 animate-fade-in-down"
              >
                <button
                  v-if="canManageRecruitment && job.status === 'DRAFT'"
                  type="button"
                  :disabled="publishingRecruitmentId === job.id"
                  class="flex w-full items-center px-4 py-2.5 text-left text-sm font-medium text-brand-700 transition-colors hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-60"
                  @click.stop="requestPublishRecruitment(job)"
                >
                  <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.868v4.264a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  {{ publishingRecruitmentId === job.id ? '게시 중...' : '즉시 게시' }}
                </button>

                <button
                  type="button"
                  class="flex w-full items-center px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-700"
                  @click.stop="goToEditRecruitment(job.id)"
                >
                  <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                  공고 수정
                </button>

                <button
                  type="button"
                  class="flex w-full items-center px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-700"
                  @click.stop="copyLink(job.id)"
                >
                  <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
                  </svg>
                  링크 복사
                </button>

                <button
                  type="button"
                  class="flex w-full items-center px-4 py-2.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-50 hover:text-brand-700"
                  @click.stop="openInterviewerModal(job)"
                >
                  <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                  면접관 설정
                </button>

                <div class="my-1 border-t border-slate-100"></div>

                <button
                  type="button"
                  class="flex w-full items-center px-4 py-2.5 text-left text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50"
                  @click.stop="openDeleteModal(job.id)"
                >
                  <svg class="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                  공고 삭제
                </button>
              </div>

              <button
                type="button"
                class="inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold text-slate-500 transition-colors hover:text-brand-700"
                @click.stop="toggleRecruitmentExpanded(job.id)"
              >
                {{ isRecruitmentExpanded(job.id) ? '접기' : '펼쳐보기' }}
                <svg
                  class="h-3.5 w-3.5 transition-transform duration-200"
                  :class="{ 'rotate-90': isRecruitmentExpanded(job.id) }"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          <div v-if="isRecruitmentExpanded(job.id)" class="mt-4 space-y-3 border-t border-slate-100 pt-4">
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                <p class="text-xs font-semibold text-slate-500">담당 면접관</p>
                <p class="mt-2 line-clamp-2 text-sm leading-6 text-slate-700">
                  {{ job.interviewerCount > 0 ? job.interviewers.join(' · ') : '배정된 면접관이 없습니다.' }}
                </p>
              </div>

              <div class="rounded-2xl border border-slate-200 bg-slate-50/80 p-3.5">
                <p class="text-xs font-semibold text-slate-500">현재 상태</p>
                <p :class="['mt-3 text-sm font-semibold', getStatusValueColor(job.displayStatus)]">{{ job.dday }}</p>
              </div>
            </div>

            <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <p class="text-sm font-semibold text-slate-900">채용 단계</p>
                  <p class="mt-1 text-xs text-slate-500">{{ job.stageCount }}단계 · 지원자 {{ job.applicantTotal }}명</p>
                </div>
                <button
                  type="button"
                  class="text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800"
                  @click="goToDetail(job.id)"
                >
                  상세 보기
                </button>
              </div>

              <div class="grid gap-3 px-4 py-4">
                <div
                  v-for="(step, sIdx) in job.funnel"
                  :key="`${job.id}-step-${sIdx}`"
                  class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3"
                >
                  <span
                    class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                    :class="step.active ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-500'"
                  >
                    {{ sIdx + 1 }}
                  </span>

                  <div class="min-w-0">
                    <div class="flex items-center justify-between gap-3">
                      <p class="truncate text-sm font-medium text-slate-700">{{ step.step }}</p>
                      <span class="text-xs font-semibold text-slate-400">{{ step.count }}명</span>
                    </div>
                    <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        class="h-full rounded-full transition-all"
                        :class="step.active ? 'bg-brand-500' : 'bg-slate-200'"
                        :style="{ width: step.count > 0 ? '100%' : '32%' }"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex items-center justify-end border-t border-slate-100 pt-4">
              <button
                type="button"
                class="inline-flex items-center gap-1 text-xs font-bold text-slate-500 transition-colors hover:text-brand-700"
                @click="goToDetail(job.id)"
              >
                관리하기
                <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  </div>

  <WeeklyInterviewListModal
    :show="showWeeklyModal"
    :schedules="weeklySchedules"
    @close="showWeeklyModal = false"
    @click-schedule="openInterviewDetail"
  />

  <InterviewDetailModal
    :show="showDetailModal"
    :event="selectedInterview"
    @close="showDetailModal = false"
  />



  <Transition name="fade">
    <div v-if="showDeleteModal" class="fixed inset-0 z-50 flex items-center justify-center" role="dialog">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="closeDeleteModal"></div>

      <div class="relative w-[400px] max-w-[90%] scale-100 transform rounded-[24px] border border-slate-200 bg-white p-6 transition-all">

        <div class="flex flex-col items-center text-center">
          <div class="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 mb-4">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>

          <h3 class="text-xl font-bold text-slate-900 mb-2">공고 삭제</h3>
          <p class="text-slate-500 text-sm mb-6 leading-relaxed">
            정말로 이 공고를 삭제하시겠습니까?<br>
            삭제된 데이터는 <span class="text-rose-500 font-bold">복구할 수 없습니다.</span>
          </p>

          <div class="flex gap-3 w-full">
            <button
                @click="closeDeleteModal"
                class="flex-1 py-2.5 px-4 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors"
            >
              취소
            </button>
            <button
                @click="confirmDelete"
                class="flex-1 rounded-xl bg-rose-500 px-4 py-2.5 font-bold text-white transition-colors hover:bg-rose-600"
            >
              삭제하기
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 모달: 링크 복사 성공 -->
  <Transition name="fade">
    <div v-if="showCopyModal" class="fixed inset-0 z-50 flex items-center justify-center" role="dialog">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="showCopyModal = false"></div>

      <div class="relative w-[400px] max-w-[90%] scale-100 transform rounded-[24px] border border-slate-200 bg-white p-6 transition-all">
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
              class="w-full rounded-xl bg-slate-900 px-4 py-2.5 font-bold text-white transition-colors hover:bg-slate-800"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- 모달: 면접관 수정 -->
  <Transition name="fade">
    <div v-if="isInterviewerModalOpen" class="fixed inset-0 z-50 flex items-center justify-center" role="dialog">
      <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" @click="closeInterviewerModal"></div>

      <div class="relative flex max-h-[85vh] w-[720px] max-w-[95%] flex-col overflow-hidden rounded-[24px] border border-slate-200 bg-white animate-fade-in-up">
        <div class="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h3 class="text-xl font-bold text-slate-900">담당 면접관 수정</h3>
            <p class="text-xs text-slate-500 mt-1">{{ editingJob?.title }} 공고의 면접관을 배정합니다.</p>
          </div>
          <button @click="closeInterviewerModal" class="text-slate-400 hover:text-slate-600 transition-colors">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div class="px-6 pt-6 overflow-y-auto custom-scrollbar">
          <div v-if="selectedInterviewerDetails.length > 0" class="mb-4 flex flex-wrap gap-2 rounded-xl border border-brand-100 bg-brand-50/50 p-3">
            <div
              v-for="member in selectedInterviewerDetails"
              :key="getMemberUserId(member) ?? member.id"
              class="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-sm text-slate-700"
            >
              <span class="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-[11px] font-bold">
                {{ member.name.substring(0, 1) }}
              </span>
              <span class="font-medium">{{ member.name }}</span>
              <button @click="removeInterviewer(getMemberUserId(member) ?? member.id)" type="button" class="ml-0.5 text-slate-400 hover:text-rose-500 transition-colors">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <span class="text-xs text-brand-600 font-bold self-center ml-1">{{ selectedInterviewerDetails.length }}명 선택</span>
          </div>

          <div class="relative mb-3">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input v-model="interviewerSearchQuery" type="text" placeholder="이름 또는 직책으로 검색..."
                   class="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder-slate-400 transition-all focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
          </div>

          <div class="max-h-[400px] overflow-y-auto rounded-xl border border-slate-200 bg-white">
            <div v-for="dept in filteredOrganizations" :key="dept.id">
              <button @click="toggleDept(dept.id)" type="button"
                      class="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 transition-colors">
                <div class="flex items-center gap-2">
                  <svg :class="['w-4 h-4 text-slate-400 transition-transform duration-200', expandedDepts.has(dept.id) ? 'rotate-90' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <svg class="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span class="text-sm font-bold text-slate-700">{{ dept.name }}</span>
                </div>
                <span class="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                  {{ dept.teams.reduce((sum, team) => sum + team.members.length, 0) }}명
                </span>
              </button>

              <div v-if="expandedDepts.has(dept.id)">
                <div v-for="team in dept.teams" :key="team.id">
                  <button @click="toggleTeam(team.id)" type="button"
                          class="w-full flex items-center justify-between pl-8 pr-4 py-2.5 hover:bg-slate-50 border-b border-slate-100 transition-colors">
                    <div class="flex items-center gap-2">
                      <svg :class="['w-3.5 h-3.5 text-slate-400 transition-transform duration-200', expandedTeams.has(team.id) ? 'rotate-90' : '']" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <svg class="w-3.5 h-3.5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span class="text-sm font-medium text-slate-600">{{ team.name }}</span>
                    </div>
                    <span class="text-[10px] text-slate-400 font-medium">{{ team.members.length }}명</span>
                  </button>

                  <div v-if="expandedTeams.has(team.id)">
                    <button
                      v-for="member in team.members"
                      :key="getMemberUserId(member) ?? member.id"
                      @click="toggleInterviewerAssignment(getMemberUserId(member))"
                      type="button"
                      class="w-full flex items-center pl-14 pr-4 py-2.5 border-b border-slate-50 transition-all text-left"
                      :class="isSelectedInterviewer(getMemberUserId(member)) ? 'bg-brand-50' : 'hover:bg-slate-50'"
                    >
                      <div
                        class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 transition-colors"
                        :class="isSelectedInterviewer(getMemberUserId(member)) ? 'bg-brand-500 text-white' : 'bg-slate-100 text-slate-600'"
                      >
                        {{ member.name.substring(0, 1) }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-slate-700">{{ member.name }}</p>
                        <p class="text-[11px] text-slate-400">{{ member.position }}</p>
                      </div>
                      <div v-if="isSelectedInterviewer(getMemberUserId(member))">
                        <svg class="w-5 h-5 text-brand-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                        </svg>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-if="filteredOrganizations.length === 0" class="p-8 text-center text-sm text-slate-400">
              <svg class="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              검색 결과가 없습니다.
            </div>
          </div>
        </div>

        <div class="p-6 border-t border-slate-100 flex gap-3">
          <button @click="closeInterviewerModal" class="flex-1 py-2.5 px-4 bg-white border border-slate-300 rounded-xl text-slate-700 font-bold hover:bg-slate-50 transition-colors">
            취소
          </button>
          <button
              @click="saveInterviewers"
              :disabled="savingInterviewers"
              class="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
            {{ savingInterviewers ? '저장 중...' : '저장하기' }}
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <ConfirmModal
    :show="noticeModal.show"
    :title="noticeModal.title"
    :message="noticeModal.message"
    :confirm-text="noticeModal.confirmText"
    :type="noticeModal.type"
    :show-cancel="noticeModal.showCancel"
    @confirm="handleNoticeConfirm"
    @cancel="closeNoticeModal"
  />
</template>

<style scoped>
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-10px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.animate-fade-in-up {
  animation: fadeInUp 0.6s ease-out forwards;
}

.animate-fade-in-down {
  animation: fadeInDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

/* Modal Transition */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 20px; }
.custom-scrollbar:hover::-webkit-scrollbar-thumb { background-color: #94a3b8; }
</style>
