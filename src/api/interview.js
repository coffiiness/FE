import api from './index'

const buildAvailabilityParams = ({ from, meetingRoomIds = [], interviewerIds = [] }) => {
  const params = new URLSearchParams()
  params.append('from', from)
  meetingRoomIds
    .filter((id) => Number.isFinite(Number(id)))
    .forEach((id) => params.append('meetingRoomIds', String(id)))
  interviewerIds
    .filter((id) => Number.isFinite(Number(id)))
    .forEach((id) => params.append('interviewerIds', String(id)))
  return params
}

export const interviewApi = {
  getAvailability(payload) {
    return api.get('/interviews/availability', {
      params: buildAvailabilityParams(payload)
    })
  },
  create(payload) {
    return api.post('/interviews', payload)
  }
}
