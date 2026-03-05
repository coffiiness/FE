import api from './index'

export const meetingRoomApi = {
  list() {
    return api.get('/meeting-rooms')
  },
  create(data) {
    return api.post('/meeting-rooms', data)
  },
  update(id, data) {
    return api.put(`/meeting-rooms/${id}`, data)
  },
  remove(id) {
    return api.delete(`/meeting-rooms/${id}`)
  }
}

