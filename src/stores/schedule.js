import { defineStore } from 'pinia'
import { ref } from 'vue'
import { scheduleApi } from '@/api/schedule'
import { workspaceApi } from '@/api/workspace'

export const useScheduleStore = defineStore('schedule_v2', () => {
  const ensureWorkspaceId = async ({ forceRefresh = false } = {}) => {
    const currentWorkspaceId = localStorage.getItem('workspaceId')
    if (!forceRefresh && currentWorkspaceId) {
      return currentWorkspaceId
    }

    try {
      const workspaceResponse = await workspaceApi.getMyWorkspace()
      const resolvedWorkspaceId = workspaceResponse?.data?.data?.workspaceId || null
      if (resolvedWorkspaceId) {
        localStorage.setItem('workspaceId', resolvedWorkspaceId)
        return resolvedWorkspaceId
      }
    } catch (_) {
      // fall through to workspace check below
    }

    if (!forceRefresh && currentWorkspaceId) {
      return currentWorkspaceId
    }

    localStorage.removeItem('workspaceId')
    throw new Error('Workspace is missing. Create or join a workspace first.')
  }

  const getToday = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hour, min] = timeStr.split(':').map(Number)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
    return `${ampm} ${formattedHour}:${String(min).padStart(2, '0')}`
  }

  const schedules = ref([])
  const loading = ref(false)
  const error = ref(null)

  const normalizeSchedule = (item) => {
    const isAllDay = item.isAllDay === true
    return {
      id: item.id,
      title: item.title,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      type: item.type,
      description: item.description || '',
      roomId: item.roomId,
      isAllDay,
      isBusy: item.isBusy !== false,
      time: isAllDay ? '종일' : `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`
    }
  }

  const buildRequest = (formData) => {
    const toDateTime = (date, timeValue) => {
      if (!timeValue) return null
      const parts = String(timeValue).split(':')
      if (parts.length >= 3) {
        return `${date}T${parts[0]}:${parts[1]}:${parts[2]}`
      }
      return `${date}T${parts[0]}:${parts[1]}:00`
    }

    const addOneDay = (date) => {
      const next = new Date(`${date}T00:00:00`)
      next.setDate(next.getDate() + 1)
      const year = next.getFullYear()
      const month = String(next.getMonth() + 1).padStart(2, '0')
      const day = String(next.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    const isAllDay = formData.isAllDay === true
    const startDateTime = isAllDay ? `${formData.date}T00:00:00` : toDateTime(formData.date, formData.startTime)
    const endDateTime = isAllDay
      ? `${addOneDay(formData.date)}T00:00:00`
      : toDateTime(formData.date, formData.endTime)

    return {
      title: formData.title,
      description: formData.description || '',
      type: formData.type,
      startTime: startDateTime,
      endTime: endDateTime,
      isAllDay,
      roomId: formData.roomId || null,
      isBusy: formData.isBusy !== false,
      attendeeIds: formData.attendeeIds || []
    }
  }

  const fetchSchedules = async (startDate, endDate) => {
    loading.value = true
    error.value = null
    try {
      await ensureWorkspaceId()
      const res = await scheduleApi.getSchedules(startDate, endDate)
      const data = res.data?.data || res.data || []
      schedules.value = Array.isArray(data)
        ? data.map(normalizeSchedule)
        : []
    } catch (err) {
      console.error('Failed to fetch schedules:', err)
      error.value = err
      schedules.value = []
    } finally {
      loading.value = false
    }
  }

  const createSchedule = async (formData) => {
    await ensureWorkspaceId()
    const request = buildRequest(formData)
    await scheduleApi.createSchedule(request)
  }

  const updateSchedule = async (scheduleId, formData) => {
    await ensureWorkspaceId()
    const request = buildRequest(formData)
    await scheduleApi.updateSchedule(scheduleId, request)
  }

  const deleteSchedule = async (scheduleId) => {
    await ensureWorkspaceId()
    await scheduleApi.deleteSchedule(scheduleId)
  }

  const addSchedule = (schedule) => {
    schedules.value.push(normalizeSchedule(schedule))
  }

  return {
    schedules,
    loading,
    error,
    getToday,
    formatTime,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    addSchedule,
    addScheduleLocal: addSchedule
  }
})
