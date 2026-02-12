import api from './index'

export const authApi = {
  signup(data) {
    return api.post('/users/signup', data)
  },
  login(data) {
    return api.post('/users/login', data)
  },
  getMe() {
    return api.get('/users/me')
  },
  deleteMe() {
    return api.delete('/users/me')
  }
}
