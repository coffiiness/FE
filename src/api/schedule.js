import api from './index'

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
     * 일정 상세 조회
     * GET /api/v1/schedules/{scheduleId}
     */
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
