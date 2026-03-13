import api from './index'

export const recruitmentApi = {
    /**
     * 채용 공고 생성
     * POST /api/v1/recruitments
     */
    createRecruitment(data) {
        return api.post('/recruitments', data)
    },

    /**
     * 채용 공고 목록 조회
     * GET /api/v1/recruitments
     * @param {Object} params - { recruitmentStatus, page, size }
     */
    getRecruitments(params = {}) {
        return api.get('/recruitments', { params })
    },

    /**
     * 채용 공고 상세 조회
     * GET /api/v1/recruitments/{recruitmentId}
     */
    getRecruitmentDetail(recruitmentId) {
        return api.get(`/recruitments/${recruitmentId}`)
    },

    /**
     * 채용 공고 월별 면접 일정 조회
     * GET /api/v1/recruitments/{recruitmentId}/interview-schedules
     * @param {number} recruitmentId
     * @param {string} yearMonth - "2026-03" 형식
     */
    getInterviewSchedules(recruitmentId, yearMonth) {
        return api.get(`/recruitments/${recruitmentId}/interview-schedules`, {
            params: { yearMonth }
        })
    },

    /**
     * 이번 주 면접 일정 조회
     * GET /api/v1/recruitments/weekly-interview-schedules
     * @param {string} date - "2026-03-12" 형식
     */
    getWeeklyInterviewSchedules(date) {
        return api.get('/recruitments/weekly-interview-schedules', {
            params: { date }
        })
    },

    /**
     * 채용 공고 수정
     * PUT /api/v1/recruitments/{recruitmentId}
     */
    updateRecruitment(recruitmentId, data) {
        return api.put(`/recruitments/${recruitmentId}`, data)
    },

    /**
     * 채용 공고 면접관만 수정
     * PATCH /api/v1/recruitments/{recruitmentId}/interviewers
     */
    updateRecruitmentInterviewers(recruitmentId, interviewerIds) {
        return api.patch(`/recruitments/${recruitmentId}/interviewers`, {
            interviewerIds
        })
    },

    /**
     * DRAFT 채용 공고 즉시 게시
     * PATCH /api/v1/recruitments/{recruitmentId}/publish
     */
    publishRecruitment(recruitmentId) {
        return api.patch(`/recruitments/${recruitmentId}/publish`)
    },

    /**
     * 채용 공고 삭제
     * DELETE /api/v1/recruitments/{recruitmentId}
     */
    deleteRecruitment(recruitmentId) {
        return api.delete(`/recruitments/${recruitmentId}`)
    }
}
