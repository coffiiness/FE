import api from './index'

export const reportApi = {
  getKpi() {
    return api.get('/reports/kpi')
  },
  getPipeline(months = 6) {
    return api.get('/reports/pipeline', { params: { months } })
  },
  getRecruitmentPerformance() {
    return api.get('/reports/recruitment-performance')
  },
  getInterviewReport() {
    return api.get('/reports/interview')
  },
  getAutomationReport() {
    return api.get('/reports/automation')
  }
}

export default reportApi
