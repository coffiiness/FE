import axios from 'axios'
import router from '@/router'
import { clearGoogleCalendarCache } from '@/utils/googleCalendarSession'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const workspaceId = localStorage.getItem('workspaceId')
    // This global, authenticated self lookup resolves membership independently of stale tenant cache.
    const isMembershipLookup = config.method === 'get' && config.url === '/users/me/workspace'
    if (workspaceId && !isMembershipLookup) {
      config.headers['X-Tenant-ID'] = workspaceId
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status

    // Mutating requests and one-time OAuth codes must never be replayed here.
    // Membership conflicts are handled explicitly by each screen.

    if (status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('workspaceId')
      clearGoogleCalendarCache()
      router.push('/login')
    }

    return Promise.reject(error)
  }
)

export default api
