import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { notificationApi } from '@/api/notification'

export const NOTIFICATION_FILTERS = [
  { label: '전체', value: 'ALL' },
  { label: '공지사항', value: 'ANNOUNCEMENT' },
  { label: '면접', value: 'INTERVIEW' },
  { label: '시스템', value: 'SYSTEM' }
]

const DEFAULT_DROPDOWN_SIZE = 5
const DEFAULT_PAGE_SIZE = 20
const SSE_RETRY_DELAY = 3000

const pad = (value) => String(value).padStart(2, '0')

const toDate = (value) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const getFilterValue = (item) => {
  const targetType = String(item?.targetType || '').toUpperCase()
  const type = String(item?.type || '').toUpperCase()

  if (targetType === 'ANNOUNCEMENT' || type.startsWith('ANNOUNCEMENT')) {
    return 'ANNOUNCEMENT'
  }
  if (targetType.startsWith('INTERVIEW') || type.startsWith('INTERVIEW')) {
    return 'INTERVIEW'
  }
  return 'SYSTEM'
}

export const formatNotificationTimeAgo = (value) => {
  const date = toDate(value)
  if (!date) return '-'

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))

  if (diffMinutes < 1) return '방금 전'
  if (diffMinutes < 60) return `${diffMinutes}분 전`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}시간 전`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 7) return `${diffDays}일 전`

  return formatNotificationDateTime(value)
}

export const formatNotificationDateTime = (value) => {
  const date = toDate(value)
  if (!date) return '-'

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export const buildNotificationFallbackRoute = (item) => {
  if (item?.targetType === 'ANNOUNCEMENT') return '/dashboard'
  if (String(item?.targetType || '').startsWith('INTERVIEW')) return '/recruitment/interview/response'
  return '/notifications'
}

const normalizeNotification = (item = {}) => ({
  id: item.id,
  type: item.type || '',
  title: item.title || '',
  content: item.content || '',
  targetType: item.targetType || '',
  targetId: item.targetId ?? null,
  actionUrl: item.actionUrl || null,
  isRead: Boolean(item.isRead),
  readAt: item.readAt || null,
  createdAt: item.createdAt || null,
  filterType: getFilterValue(item)
})

const extractContents = (response) => {
  const data = response?.data?.data
  return {
    contents: Array.isArray(data?.contents) ? data.contents.map(normalizeNotification) : [],
    hasNext: Boolean(data?.hasNext)
  }
}

const parseSseChunk = (chunk) => {
  const lines = chunk.split(/\r?\n/)
  const event = { type: 'message', data: '' }

  for (const line of lines) {
    if (!line || line.startsWith(':')) continue

    if (line.startsWith('event:')) {
      event.type = line.slice(6).trim() || 'message'
      continue
    }

    if (line.startsWith('data:')) {
      const value = line.slice(5).trim()
      event.data = event.data ? `${event.data}\n${value}` : value
    }
  }

  return event
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  const dropdownNotifications = ref([])
  const unreadCountValue = ref(0)
  const acceptedSchedules = ref([])
  const activeFilter = ref('ALL')
  const hasNext = ref(false)
  const currentPage = ref(0)
  const pageSize = ref(DEFAULT_PAGE_SIZE)
  const initialized = ref(false)
  const loadingList = ref(false)
  const loadingDropdown = ref(false)
  const isMarkingAllRead = ref(false)
  const isRemovingAll = ref(false)
  const isDropdownOpen = ref(false)
  const isNotificationPageActive = ref(false)
  const isStreamConnected = ref(false)

  let streamAbortController = null
  let streamReconnectTimer = null

  const unreadCount = computed(() => unreadCountValue.value)

  const fetchUnreadCount = async () => {
    const response = await notificationApi.getUnreadCount()
    unreadCountValue.value = Number(response?.data?.data?.unreadCount || 0)
    return unreadCountValue.value
  }

  const fetchDropdownNotifications = async ({ size = DEFAULT_DROPDOWN_SIZE, type } = {}) => {
    loadingDropdown.value = true
    try {
      const response = await notificationApi.getUnreadList({
        page: 0,
        size,
        ...(type ? { type } : {})
      })
      const { contents } = extractContents(response)
      dropdownNotifications.value = contents
      return contents
    } finally {
      loadingDropdown.value = false
    }
  }

  const fetchNotifications = async ({
    page = 0,
    size = pageSize.value,
    filter = activeFilter.value,
    append = false
  } = {}) => {
    loadingList.value = true
    try {
      const response = await notificationApi.getList({
        page,
        size,
        ...(filter !== 'ALL' ? { type: filter } : {})
      })
      const { contents, hasNext: next } = extractContents(response)

      notifications.value = append ? [...notifications.value, ...contents] : contents
      currentPage.value = page
      pageSize.value = size
      activeFilter.value = filter
      hasNext.value = next

      return contents
    } finally {
      loadingList.value = false
    }
  }

  const fetchNextNotifications = async () => {
    if (!hasNext.value || loadingList.value) return []
    return fetchNotifications({
      page: currentPage.value + 1,
      size: pageSize.value,
      filter: activeFilter.value,
      append: true
    })
  }

  const initialize = async () => {
    if (initialized.value) return
    await Promise.all([fetchUnreadCount(), fetchDropdownNotifications()])
    startNotificationStream()
    initialized.value = true
  }

  const refreshVisibleData = async () => {
    await fetchUnreadCount()

    const tasks = []

    if (isDropdownOpen.value) {
      tasks.push(fetchDropdownNotifications())
    }

    if (isNotificationPageActive.value) {
      tasks.push(fetchNotifications({
        page: 0,
        size: Math.max(pageSize.value, (currentPage.value + 1) * pageSize.value),
        filter: activeFilter.value
      }))
    }

    if (tasks.length > 0) {
      await Promise.all(tasks)
    }
  }

  const handleStreamEvent = async (event) => {
    if (event.type !== 'notification-created') return

    try {
      await refreshVisibleData()
    } catch (error) {
      console.error('알림 SSE 후 재조회 실패:', error)
    }
  }

  const stopNotificationStream = () => {
    if (streamReconnectTimer) {
      clearTimeout(streamReconnectTimer)
      streamReconnectTimer = null
    }

    if (streamAbortController) {
      streamAbortController.abort()
      streamAbortController = null
    }

    isStreamConnected.value = false
  }

  const scheduleReconnect = () => {
    if (streamReconnectTimer) return

    streamReconnectTimer = setTimeout(() => {
      streamReconnectTimer = null
      startNotificationStream()
    }, SSE_RETRY_DELAY)
  }

  const startNotificationStream = async () => {
    if (typeof window === 'undefined') return
    if (streamAbortController) return

    const accessToken = localStorage.getItem('accessToken')
    const workspaceId = localStorage.getItem('workspaceId')

    if (!accessToken || !workspaceId) return

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'
    const streamUrl = `${baseUrl}/notifications/stream`

    streamAbortController = new AbortController()

    try {
      const response = await fetch(streamUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Tenant-ID': workspaceId,
          Accept: 'text/event-stream'
        },
        signal: streamAbortController.signal
      })

      if (!response.ok || !response.body) {
        throw new Error(`SSE connection failed: ${response.status}`)
      }

      isStreamConnected.value = true

      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''

        for (const part of parts) {
          const parsed = parseSseChunk(part)
          await handleStreamEvent(parsed)
        }
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        console.error('알림 SSE 연결 실패:', error)
        scheduleReconnect()
      }
    } finally {
      isStreamConnected.value = false
      streamAbortController = null
    }
  }

  const setDropdownOpen = (value) => {
    isDropdownOpen.value = Boolean(value)
  }

  const setNotificationPageActive = (value) => {
    isNotificationPageActive.value = Boolean(value)
  }

  const syncReadState = (id) => {
    notifications.value = notifications.value.map((item) =>
      item.id === id ? { ...item, isRead: true, readAt: item.readAt || new Date().toISOString() } : item
    )
    const target = dropdownNotifications.value.find((item) => item.id === id)
    if (target && !target.isRead) {
      dropdownNotifications.value = dropdownNotifications.value.filter((item) => item.id !== id)
      unreadCountValue.value = Math.max(0, unreadCountValue.value - 1)
    }
  }

  const markRead = async (id) => {
    const existing = notifications.value.find((item) => item.id === id) ||
      dropdownNotifications.value.find((item) => item.id === id)

    if (existing?.isRead) return

    await notificationApi.markRead(id)
    syncReadState(id)
  }

  const markAllRead = async () => {
    if (isMarkingAllRead.value) return

    isMarkingAllRead.value = true
    try {
      await notificationApi.markAllRead()
      notifications.value = notifications.value.map((item) => ({
        ...item,
        isRead: true,
        readAt: item.readAt || new Date().toISOString()
      }))
      dropdownNotifications.value = []
      unreadCountValue.value = 0
    } finally {
      isMarkingAllRead.value = false
    }
  }

  const removeNotification = async (id) => {
    const listTarget = notifications.value.find((item) => item.id === id)
    const dropdownTarget = dropdownNotifications.value.find((item) => item.id === id)

    await notificationApi.remove(id)

    notifications.value = notifications.value.filter((item) => item.id !== id)
    dropdownNotifications.value = dropdownNotifications.value.filter((item) => item.id !== id)

    if ((listTarget && !listTarget.isRead) || (dropdownTarget && !dropdownTarget.isRead)) {
      unreadCountValue.value = Math.max(0, unreadCountValue.value - 1)
    }
  }

  const removeAllNotifications = async () => {
    if (isRemovingAll.value) return

    isRemovingAll.value = true
    try {
      await notificationApi.removeAll()
      notifications.value = []
      dropdownNotifications.value = []
      unreadCountValue.value = 0
      hasNext.value = false
      currentPage.value = 0
    } finally {
      isRemovingAll.value = false
    }
  }

  return {
    notifications,
    dropdownNotifications,
    acceptedSchedules,
    unreadCount,
    activeFilter,
    hasNext,
    currentPage,
    pageSize,
    initialized,
    loadingList,
    loadingDropdown,
    isMarkingAllRead,
    isRemovingAll,
    isStreamConnected,
    fetchUnreadCount,
    fetchDropdownNotifications,
    fetchNotifications,
    fetchNextNotifications,
    initialize,
    startNotificationStream,
    stopNotificationStream,
    setDropdownOpen,
    setNotificationPageActive,
    markRead,
    markAllRead,
    removeNotification,
    removeAllNotifications
  }
})
