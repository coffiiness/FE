import api from './index'

export const notificationApi = {
  getUnreadCount() {
    return api.get('/notifications/unread-count')
  },
  getUnreadList(params = {}) {
    return api.get('/notifications/unread', { params })
  },
  getList(params = {}) {
    return api.get('/notifications', { params })
  },
  markRead(notificationId) {
    return api.patch(`/notifications/${notificationId}/read`)
  },
  markAllRead() {
    return api.patch('/notifications/read-all')
  },
  remove(notificationId) {
    return api.delete(`/notifications/${notificationId}`)
  },
  removeAll() {
    return api.delete('/notifications')
  }
}
