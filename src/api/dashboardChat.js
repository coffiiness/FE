import api from '@/api'

export const dashboardChatApi = {
  getMessages() {
    return api.get('/dashboard-chat/messages')
  },

  createMessage(payload) {
    return api.post('/dashboard-chat/messages', payload)
  }
}
