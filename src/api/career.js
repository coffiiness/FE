import api from './index'

export const careerApi = {
    /**
     * 채용 중인 회사 목록 조회 (Public)
     * GET /api/v1/careers
     * @returns List<CareerCompanyResponse> { workspaceId, companyName, employeeScale, openCount }
     */
    getCompanies(search) {
        return api.get('/careers', { params: { search: search || undefined } })
    },

    /**
     * 특정 회사의 채용 공고 목록 조회 (Public)
     * GET /api/v1/careers/{workspaceId}
     * @returns List<CareerRecruitmentResponse> { recruitmentId, title, careerType, targetCount, minExperienceYears, maxExperienceYears, startDate, endDate }
     */
    getRecruitments(workspaceId, search) {
        return api.get(`/careers/${workspaceId}`, { params: { search: search || undefined } })
    }
}
