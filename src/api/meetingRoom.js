import api from './index'

export const meetingRoomApi = {
  list() {
    return api.get('/meeting-rooms')
  },
  listReservations(params) {
    return api.get('/meeting-rooms/reservations', { params })
  },
  reserve(meetingRoomId, data) {
    return api.post(`/meeting-rooms/${meetingRoomId}/reservations`, data)
  },
  cancelReservation(meetingRoomId, reservationId) {
    return api.delete(`/meeting-rooms/${meetingRoomId}/reservations/${reservationId}`)
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
