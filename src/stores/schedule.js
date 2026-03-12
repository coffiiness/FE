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
    const hasMidnightRange =
      String(item.startTime || '') === '00:00' &&
      String(item.endTime || '') === '00:00'
    const isAllDay = item.isAllDay === true || item.allDay === true || hasMidnightRange
    const isBusy = item.isBusy ?? item.busy ?? true
    return {
      id: item.id,
      title: item.title,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      type: item.type,
      description: item.description || '',
      roomId: item.roomId,
      interviewScheduleId: item.interviewScheduleId ?? null,
      isAllDay,
      isBusy,
      time: isAllDay ? '종일' : `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`
    }
  }

  const normalizeScheduleDetail = (item) => ({
    ...normalizeSchedule(item),
    location: item.location || '',
    ownerName: item.ownerName || '',
    attendeeIds: Array.isArray(item.attendeeIds)
      ? item.attendeeIds.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0)
      : [],
    attendees: Array.isArray(item.attendees)
      ? item.attendees.filter((name) => typeof name === 'string' && name.trim())
      : [],
    applicantName: item.applicantName || ''
  })

  const normalizeBusySchedule = (item) => ({
    scheduleId: Number(item?.scheduleId),
    title: String(item?.title || '').trim() || '제목 없음',
    startDateTime: item?.startDateTime || '',
    endDateTime: item?.endDateTime || '',
    isAllDay: item?.isAllDay === true,
    type: item?.type || '',
    interviewScheduleId: item?.interviewScheduleId ?? null
  })

  const normalizeAttendeeAvailability = (item) => ({
    attendeeId: Number(item?.attendeeId),
    attendeeName: String(item?.attendeeName || '').trim() || '이름 없는 사용자',
    busySchedules: Array.isArray(item?.busySchedules)
      ? item.busySchedules.map(normalizeBusySchedule)
      : []
  })

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

  const getAttendeeAvailability = async (date, attendeeIds = []) => {
    await ensureWorkspaceId()

    const normalizedAttendeeIds = [...new Set(
      attendeeIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    )]

    if (!date || normalizedAttendeeIds.length === 0) {
      return []
    }

    const res = await scheduleApi.getAvailability({ date, attendeeIds: normalizedAttendeeIds })
    const data = res.data?.data || res.data || null
    const attendeeAvailabilities = Array.isArray(data?.attendeeAvailabilities)
      ? data.attendeeAvailabilities
      : []

    return attendeeAvailabilities.map(normalizeAttendeeAvailability)
  }

  const getAttendeeAvailabilityRange = async (startDate, endDate, attendeeIds = []) => {
    await ensureWorkspaceId()

    const normalizedAttendeeIds = [...new Set(
      attendeeIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    )]

    if (!startDate || !endDate || normalizedAttendeeIds.length === 0) {
      return []
    }

    const extractAvailability = (res) => {
      const data = res.data?.data || res.data || null
      const attendeeAvailabilities = Array.isArray(data?.attendeeAvailabilities)
        ? data.attendeeAvailabilities
        : []

      return attendeeAvailabilities.map(normalizeAttendeeAvailability)
    }

    try {
      const res = await scheduleApi.getAvailabilityRange({
        startDate,
        endDate,
        attendeeIds: normalizedAttendeeIds
      })

      return extractAvailability(res)
    } catch (error) {
      const start = new Date(`${startDate}T00:00:00`)
      const end = new Date(`${endDate}T00:00:00`)

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
        throw error
      }

      const merged = new Map()
      const cursor = new Date(start)

      while (cursor <= end) {
        const year = cursor.getFullYear()
        const month = String(cursor.getMonth() + 1).padStart(2, '0')
        const day = String(cursor.getDate()).padStart(2, '0')
        const date = `${year}-${month}-${day}`
        const daily = await getAttendeeAvailability(date, normalizedAttendeeIds)

        daily.forEach((attendee) => {
          const current = merged.get(attendee.attendeeId) || {
            attendeeId: attendee.attendeeId,
            attendeeName: attendee.attendeeName,
            busySchedules: []
          }

          current.busySchedules.push(...attendee.busySchedules)
          merged.set(attendee.attendeeId, current)
        })

        cursor.setDate(cursor.getDate() + 1)
      }

      return [...merged.values()].map((attendee) => ({
        ...attendee,
        busySchedules: attendee.busySchedules.filter((schedule, index, schedules) =>
          index === schedules.findIndex((candidate) =>
            candidate.scheduleId === schedule.scheduleId &&
            candidate.startDateTime === schedule.startDateTime &&
            candidate.endDateTime === schedule.endDateTime
          )
        )
      }))
    }
  }

  const getScheduleDetail = async (scheduleId) => {
    await ensureWorkspaceId()
    const res = await scheduleApi.getScheduleDetail(scheduleId)
    const data = res.data?.data || res.data || null
    return data ? normalizeScheduleDetail(data) : null
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
    getAttendeeAvailability,
    getAttendeeAvailabilityRange,
    getScheduleDetail,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    addSchedule,
    addScheduleLocal: addSchedule
  }
})
