import api from './index'

const extractResponseData = (response) => {
  const body = response?.data
  if (body == null) return null
  return body?.data ?? body
}

export const automationTemplatesApi = {
  getTemplates() {
    return api.get('/automation-templates')
  },

  extractResponseData
}
