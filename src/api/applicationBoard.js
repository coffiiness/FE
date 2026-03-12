import api from './index'

const extractResponseData = (response) => {
  const body = response?.data
  if (body == null) return null
  return body?.data ?? body
}

export const applicationBoardApi = {
  getApplications(params = {}) {
    return api.get('/applications', { params })
  },

  getApplicationDetail(applicationId) {
    return api.get(`/applications/${applicationId}`)
  },

  getApplicationFileDownloadPresign(fileId) {
    return api.get(`/application-files/${fileId}/presign-download`)
  },

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
