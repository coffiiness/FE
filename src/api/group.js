import api from './index'

export const groupApi = {
  getGroups() {
    return api.get('/groups')
  },
  createGroup(data) {
    return api.post('/groups', data)
  },
  updateGroup(groupId, data) {
    return api.patch(`/groups/${groupId}`, data)
  },
  deleteGroup(groupId) {
    return api.delete(`/groups/${groupId}`)
  },
}
