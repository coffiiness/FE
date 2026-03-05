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
    }
}
