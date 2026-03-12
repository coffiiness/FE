import api from './index'

const buildAvailabilityParams = ({ date, attendeeIds = [] }) => {
  const params = new URLSearchParams()
  params.append('date', date)
  attendeeIds
    .filter((id) => Number.isFinite(Number(id)) && Number(id) > 0)
    .forEach((id) => params.append('attendeeIds', String(id)))
  return params
}

const buildAvailabilityRangeParams = ({ startDate, endDate, attendeeIds = [] }) => {
  const params = new URLSearchParams()
  params.append('startDate', startDate)
  params.append('endDate', endDate)
  attendeeIds
    .filter((id) => Number.isFinite(Number(id)) && Number(id) > 0)
    .forEach((id) => params.append('attendeeIds', String(id)))
  return params
}

export const scheduleApi = {
  /**
   * 일정 생성
   * POST /api/v1/schedules
   */
  createSchedule(data) {
    return api.post('/schedules', data)
  },

  /**
   * 기간별 일정 목록 조회
   * GET /api/v1/schedules?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd
   */
  getSchedules(startDate, endDate) {
    return api.get('/schedules', { params: { startDate, endDate } })
  },

  /**
   * 참석자 일정 현황 조회
   * GET /api/v1/schedules/availability?date=yyyy-MM-dd&attendeeIds=1&attendeeIds=2
   */
  getAvailability(payload) {
    return api.get('/schedules/availability', {
      params: buildAvailabilityParams(payload)
    })
  },

  /**
   * 일정 상세 조회
   * GET /api/v1/schedules/{scheduleId}
   */
  /**
   * 참석자 기간별 일정 현황 조회
   * GET /api/v1/schedules/availability/range?startDate=yyyy-MM-dd&endDate=yyyy-MM-dd&attendeeIds=1&attendeeIds=2
   */
  getAvailabilityRange(payload) {
    return api.get('/schedules/availability/range', {
      params: buildAvailabilityRangeParams(payload)
    })
  },

  getScheduleDetail(scheduleId) {
    return api.get(`/schedules/${scheduleId}`)
  },

  /**
   * 일정 수정
   * PUT /api/v1/schedules/{scheduleId}
   */
  updateSchedule(scheduleId, data) {
    return api.put(`/schedules/${scheduleId}`, data)
  },

  /**
   * 일정 삭제
   * DELETE /api/v1/schedules/{scheduleId}
   */
  deleteSchedule(scheduleId) {
    return api.delete(`/schedules/${scheduleId}`)
  }
}