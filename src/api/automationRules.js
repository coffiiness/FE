import api from './index'

const extractResponseData = (response) => {
  const body = response?.data
  if (body == null) return null
  return body?.data ?? body
}

export const automationRulesApi = {
  getRecruitmentRules(recruitmentId) {
    return api.get(`/recruitments/${recruitmentId}/automation-rules`)
  },

  createRecruitmentRule(recruitmentId, payload) {
    return api.post(`/recruitments/${recruitmentId}/automation-rules`, payload)
  },

  updateRule(ruleId, payload) {
    return api.put(`/automation-rules/${ruleId}`, payload)
  },

  deleteRule(ruleId) {
    return api.delete(`/automation-rules/${ruleId}`)
  },

  extractResponseData
}
