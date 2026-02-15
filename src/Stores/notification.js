import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const formatDisplayDate = (date) => {
  const month = date.toLocaleString('en-US', { month: 'short' })
  const day = String(date.getDate()).padStart(2, '0')
  return { month, day }
}

export const useNotificationStore = defineStore('notification', () => {
  const STORAGE_KEY = 'calfit.notifications'
  const ENABLE_PERSIST = false
  const defaultNotifications = [
    {
      id: 1,
      type: 'request',
      title: '면접 일정 확인 요청',
      dateRaw: '2024-02-07',
      timeRange: '13:00 - 14:30',
      displayDate: { month: 'Feb', day: '07' },
      applicant: '박지수',
      location: '5층 회의실 A',
      requester: '김인사',
      memo: '지원자 포트폴리오를 사전에 확인해 주세요.',
      recruitmentTitle: '2024 상반기 백엔드 개발자 공개채용',
      recruitmentStage: '면접',
      scheduleId: 101,
      timeAgo: '10분 전',
      read: true,
      createdAt: 1707284400000
    },
    {
      id: 5,
      type: 'request',
      title: '면접 일정 확인 요청',
      dateRaw: '2024-02-12',
      timeRange: '09:30 - 10:00',
      displayDate: { month: 'Feb', day: '12' },
      applicant: '정하늘',
      location: '온라인(Teams)',
      requester: '오인사',
      memo: '직무 과제 제출 여부 확인 부탁드립니다.',
      recruitmentTitle: '2024 상반기 백엔드 개발자 공개채용',
      recruitmentStage: '면접',
      scheduleId: 106,
      timeAgo: '어제',
      read: false,
      createdAt: 1707739800000
    },
    {
      id: 3,
      type: 'alert',
      status: 'success',
      title: '면접 일정 확정',
      content: '지원자 이혜린님의 면접 일정이 최종 확정되었습니다.',
      timeAgo: '어제',
      read: true,
      createdAt: 1707198000000,
      scheduleId: 101
    }
  ]

  const containsCorruptedText = (value) => {
    if (typeof value === 'string') {
      return value.includes('�') || value.includes('쨌')
    }
    if (Array.isArray(value)) {
      return value.some(containsCorruptedText)
    }
    if (value && typeof value === 'object') {
      return Object.values(value).some(containsCorruptedText)
    }
    return false
  }

  const loadFromStorage = () => {
    if (!ENABLE_PERSIST) return null
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) return null
      if (containsCorruptedText(parsed)) return null
      return parsed
    } catch {
      return null
    }
  }

  const notifications = ref(loadFromStorage() ?? defaultNotifications)
  const acceptedSchedules = ref([])

  if (notifications.value.length === 0) {
    notifications.value = [...defaultNotifications]
  }

  const hasRequest = notifications.value.some((n) => n.type === 'request')
  if (!hasRequest) {
    notifications.value = [...defaultNotifications, ...notifications.value]
  }

  const requestNotifications = computed(() =>
    notifications.value.filter((n) => n.type === 'request')
  )

  const requestCount = computed(() => requestNotifications.value.length)

  const unreadCount = computed(() =>
    notifications.value.filter((n) => !n.read).length
  )

  const sortedNotifications = computed(() => {
    return [...notifications.value].sort((a, b) => {
      const aTime = typeof a.createdAt === 'number' ? a.createdAt : 0
      const bTime = typeof b.createdAt === 'number' ? b.createdAt : 0
      return bTime - aTime
    })
  })

  const dismissedInAll = ref(new Set())

  const filteredAllNotifications = computed(() => {
    return sortedNotifications.value.filter(
      (n) => !dismissedInAll.value.has(n.id)
    )
  })

  const sortedRequestNotifications = computed(() => {
    return [...requestNotifications.value].sort((a, b) => {
      const aTime = typeof a.createdAt === 'number' ? a.createdAt : 0
      const bTime = typeof b.createdAt === 'number' ? b.createdAt : 0
      return bTime - aTime
    })
  })

  const dismissedFromDropdown = ref(new Set())

  const dropdownNotifications = computed(() => {
    return sortedNotifications.value.filter(
      (n) => !dismissedFromDropdown.value.has(n.id)
    )
  })

  const respondToRequest = (id, decision) => {
    const target = notifications.value.find(
      (n) => n.id === id && n.type === 'request'
    )
    if (!target) return null

    notifications.value = notifications.value.filter((n) => n.id !== id)

    const now = new Date()
    const status = decision === 'accept' ? 'success' : 'danger'
    const actionLabel = decision === 'accept' ? '수락' : '거절'
    const newAlert = {
      id: Date.now(),
      type: 'alert',
      status,
      title: `일정 ${actionLabel} 완료`,
      content: `지원자 ${target.applicant}님의 면접 일정 요청을 ${actionLabel}했습니다.`,
      timeAgo: '방금 전',
      read: true,
      displayDate: formatDisplayDate(now),
      createdAt: now.getTime(),
      scheduleId: target.scheduleId
    }

    notifications.value.unshift(newAlert)

    if (decision === 'accept' && target.scheduleId) {
      const [startTimeRaw, endTimeRaw] = (target.timeRange || '').split('-')
      const startTime = startTimeRaw ? startTimeRaw.trim() : ''
      const endTime = endTimeRaw ? endTimeRaw.trim() : ''
      const scheduleExists = acceptedSchedules.value.some(
        (s) => s.id === target.scheduleId
      )
      if (!scheduleExists) {
        acceptedSchedules.value.push({
          id: target.scheduleId,
          type: 'INTERVIEW',
          title: `면접: ${target.applicant}`,
          date: target.dateRaw,
          startTime,
          endTime,
          description: target.memo
            ? `${target.location} · ${target.memo}`
            : target.location,
          time: `${startTime} - ${endTime}`
        })
      }
    }

    return newAlert
  }

  const dismissFromDropdown = (id) => {
    dismissedFromDropdown.value = new Set(dismissedFromDropdown.value)
    dismissedFromDropdown.value.add(id)
  }

  const clearDropdownDismissed = () => {
    dismissedFromDropdown.value = new Set(
      sortedNotifications.value.map((n) => n.id)
    )
  }

  const dismissFromAll = (id) => {
    dismissedInAll.value = new Set(dismissedInAll.value)
    dismissedInAll.value.add(id)
  }

  const clearAllDismissed = () => {
    dismissedInAll.value = new Set(sortedNotifications.value.map((n) => n.id))
  }

  const toggleRead = (id) => {
    notifications.value = notifications.value.map((n) =>
      n.id === id ? { ...n, read: !n.read } : n
    )
  }

  const markRead = (id) => {
    notifications.value = notifications.value.map((n) =>
      n.id === id ? { ...n, read: true } : n
    )
  }

  const markAllRead = () => {
    notifications.value = notifications.value.map((n) => ({
      ...n,
      read: true
    }))
  }

  watch(
    notifications,
    (value) => {
      if (!ENABLE_PERSIST) return
      if (typeof window === 'undefined') return
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    },
    { deep: true }
  )

  return {
    notifications,
    requestNotifications,
    sortedNotifications,
    sortedRequestNotifications,
    filteredAllNotifications,
    acceptedSchedules,
    requestCount,
    unreadCount,
    respondToRequest,
    dropdownNotifications,
    dismissFromDropdown,
    clearDropdownDismissed,
    dismissFromAll,
    clearAllDismissed,
    toggleRead,
    markRead,
    markAllRead
  }
})
