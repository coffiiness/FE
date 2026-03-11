import api from './index'

export const announcementBoardApi = {
  list() {
    return api.get('/announcement-boards')
  },
  detail(id) {
    return api.get(`/announcement-boards/${id}`)
  },
  create(data) {
    return api.post('/announcement-boards', data)
  },
  update(id, data) {
    return api.put(`/announcement-boards/${id}`, data)
  },
  remove(id) {
    return api.delete(`/announcement-boards/${id}`)
  }
}

