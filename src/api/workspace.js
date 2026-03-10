import api from './index'

export const workspaceApi = {
  createWorkspace(data) {
    return api.post('/workspaces', data)
  },
  getMyWorkspace() {
    return api.get('/users/me/workspace')
  }
}
