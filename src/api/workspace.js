import axios from 'axios'
import api from './index'

export const workspaceApi = {
  createWorkspace(data) {
    return api.post('/workspaces', data)
  },
  getMyWorkspace() {
    const token = localStorage.getItem('accessToken')
    const headers = {
      'Content-Type': 'application/json'
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return axios.get(`${api.defaults.baseURL}/users/me/workspace`, { headers })
  }
}
