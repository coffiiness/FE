import api from './index'

const buildAvailabilityParams = ({
  from,
  meetingRoomIds = [],
  interviewerIds = [],
  applicantIds = []
}) => {
  const params = new URLSearchParams()
  params.append('from', from)
  meetingRoomIds
    .filter((id) => Number.isFinite(Number(id)))
    .forEach((id) => params.append('meetingRoomIds', String(id)))
  interviewerIds
    .filter((id) => Number.isFinite(Number(id)))
    .forEach((id) => params.append('interviewerIds', String(id)))
  applicantIds
    .filter((id) => Number.isFinite(Number(id)))
    .forEach((id) => params.append('applicantIds', String(id)))
  return params
}

const extractResponseData = (response) => {
  const body = response?.data
  if (body == null) return null
  return body?.data ?? body
}

export const interviewApi = {
  getAvailability(payload) {
    return api.get('/interviews/availability', {
      params: buildAvailabilityParams(payload)
    })
  },
  getPendingApplicants(recruitmentId) {
    return api.get('/interviews/pending-applicants', {
      params: { recruitmentId }
    })
  },
  create(payload) {
    return api.post('/interviews', payload)
  },
  extractResponseData
}
