import api from './index'

export const memberApi = {
  getMembers() {
    return api.get('/members')
  },
  getMyMember() {
    return api.get('/members/me')
  },
  updateMember(memberId, memberType) {
    return api.patch(`/members/${memberId}`, { memberType })
  },
  removeMember(memberId) {
    return api.delete(`/members/${memberId}`)
  },
  assignGroup(memberId, groupId) {
    return api.patch(`/members/${memberId}/group`, { groupId })
  },
  leaveGroup(memberId) {
    return api.delete(`/members/${memberId}/group`)
  },
}
