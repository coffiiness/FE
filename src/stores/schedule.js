import { defineStore } from 'pinia'
import { ref } from 'vue'
import { scheduleApi } from '@/api/schedule'

export const useScheduleStore = defineStore('schedule_v2', () => {

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
    const ampm = hour >= 12 ? '오후' : '오전'
    const formattedHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
    return `${ampm} ${formattedHour}:${String(min).padStart(2, '0')}`
  }

  const schedules = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * BE 응답 → FE 내부 형식 변환
   * BE: { id, title, date("yyyy-MM-dd"), startTime("HH:mm"), endTime("HH:mm"), type, description, roomId, isBusy }
   */
  const normalizeSchedule = (item) => {
    return {
      id: item.id,
      title: item.title,
      date: item.date,
      startTime: item.startTime,
      endTime: item.endTime,
      type: item.type,
      description: item.description || '',
      roomId: item.roomId,
      isBusy: item.isBusy,
      time: `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`
    }
  }

  /**
   * FE form → BE request 변환
   * FE: { title, date("yyyy-MM-dd"), startTime("HH:mm"), endTime("HH:mm"), type, description, attendeeIds }
   * BE: { title, description, type, startTime(LocalDateTime), endTime(LocalDateTime), isAllDay, roomId, isBusy, attendeeIds }
   */
  const buildRequest = (formData) => {
    const startDateTime = `${formData.date}T${formData.startTime}:00`
    const endDateTime = `${formData.date}T${formData.endTime}:00`

    return {
      title: formData.title,
      description: formData.description || '',
      type: formData.type,
      startTime: startDateTime,
      endTime: endDateTime,
      isAllDay: false,
      roomId: formData.roomId || null,
      isBusy: formData.isBusy !== undefined ? formData.isBusy : true,
      attendeeIds: formData.attendeeIds || []
    }
  }

  const fetchSchedules = async (startDate, endDate) => {
    loading.value = true
    error.value = null
    try {
      const res = await scheduleApi.getSchedules(startDate, endDate)
      const data = res.data?.data || res.data || []
      schedules.value = Array.isArray(data)
        ? data.map(normalizeSchedule)
        : []
    } catch (err) {
      console.error('일정 조회 실패:', err)
      error.value = err
      schedules.value = []
    } finally {
      loading.value = false
    }
  }

  const createSchedule = async (formData) => {
    const request = buildRequest(formData)
    await scheduleApi.createSchedule(request)
  }

  const updateSchedule = async (scheduleId, formData) => {
    const request = buildRequest(formData)
    await scheduleApi.updateSchedule(scheduleId, request)
  }

  const deleteSchedule = async (scheduleId) => {
    await scheduleApi.deleteSchedule(scheduleId)
  }

  const addScheduleLocal = (schedule) => {
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
    addScheduleLocal
  }
})
