import api from './index'

const extractResponseData = (response) => {
  const body = response?.data
  if (body == null) return null
  return body?.data ?? body
}

export const applicationBoardApi = {
  getBoard(recruitmentId) {
    return api.get('/applications/board', {
      params: { recruitmentId }
    })
  },

  moveApplicationProcess(applicationId, recruitmentProcessId) {
    return api.patch(`/applications/${applicationId}/process`, {
      recruitmentProcessId
    })
  },

  extractResponseData
}
