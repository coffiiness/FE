import api from './index'

export const invitationApi = {
  createInvitation(workspaceId, data) {
    return api.post(`/workspaces/${workspaceId}/invitations`, data)
  },
  getInvitation(token) {
    return api.get(`/invitations/${token}`)
  },
  acceptInvitation(token) {
    return api.post(`/invitations/${token}/accept`)
  },
}
