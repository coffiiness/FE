import applicantApi from './applicantClient'

export const applicantAuthApi = {
  signup(workspaceId, data) {
    return applicantApi.post(`/workspaces/${workspaceId}/applicants/signup`, data)
  },
  login(workspaceId, data) {
    return applicantApi.post(`/workspaces/${workspaceId}/applicants/login`, data)
  }
}
