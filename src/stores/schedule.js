import { defineStore } from 'pinia'
import { ref } from 'vue'

import scheduleData from '@/data/schedule.json'
import roomsData from '@/data/rooms.json'
import organizationData from '@/data/organization.json'

export const useScheduleStore = defineStore('schedule_v2', () => {
  // [유틸] 오늘 날짜 구하기 (YYYY-MM-DD)
  const getToday = () => {
    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // [유틸] 오늘 기준 N일 후 날짜 구하기 (데이터 생성용)
  const getRelativeDate = (offset) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 유틸: 시간 포맷팅 (13:00 -> 오후 1:00)
  const formatTime = (timeStr) => {
    if (!timeStr) return ''
    const [hour, min] = timeStr.split(':').map(Number)
    const ampm = hour >= 12 ? '오후' : '오전'
    const formattedHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour)
    return `${ampm} ${formattedHour}:${String(min).padStart(2, '0')}`
  }

  // Helper: Find Room Name by ID
  const getRoomName = (roomId) => {
    const room = roomsData.find(r => r.id === roomId)
    return room ? room.name : '지정된 장소 없음'
  }

  // Helper: Find Member Details by IDs
  const getAllMembers = () => {
    const members = []
    organizationData.forEach(dept => {
      dept.teams.forEach(team => {
        members.push(...team.members)
      })
    })
    return members
  }

  const allMembers = getAllMembers()

  const getAttendeeDetails = (attendeeIds) => {
    if (!attendeeIds || attendeeIds.length === 0) return []
    return attendeeIds.map(id => {
      const member = allMembers.find(m => m.id === id)
      if (member) {
        return `${member.name} (${member.position})`
      }
      return `Unknown (${id})`
    })
  }

  // JSON 데이터의 dayOffset을 실제 날짜로 변환하여 초기화
  const initialSchedules = scheduleData.map(item => ({
    ...item,
    date: getRelativeDate(item.dayOffset),
    time: `${formatTime(item.startTime)} - ${formatTime(item.endTime)}`,
    location: item.roomId ? getRoomName(item.roomId) : (item.location || '지정된 장소 없음'),
    attendees: item.attendeeIds ? getAttendeeDetails(item.attendeeIds) : (item.attendees || [])
  }))

  const schedules = ref(initialSchedules)

  const addSchedule = (schedule) => {
    const formattedTimeStr = `${formatTime(schedule.startTime)} - ${formatTime(schedule.endTime)}`

    schedules.value.push({
      type: 'OTHERS', // 기본값
      ...schedule,
      time: formattedTimeStr,
      id: Date.now()
    })
  }

  const updateSchedule = (updatedSchedule) => {
    const index = schedules.value.findIndex(s => s.id === updatedSchedule.id)
    if (index !== -1) {
      const formattedTimeStr = `${formatTime(updatedSchedule.startTime)} - ${formatTime(updatedSchedule.endTime)}`
      schedules.value[index] = {
        ...updatedSchedule,
        time: formattedTimeStr
      }
    }
  }

  const deleteSchedule = (id) => {
    schedules.value = schedules.value.filter(s => s.id !== id)
  }

  return { schedules, addSchedule, updateSchedule, deleteSchedule, getToday }
})
