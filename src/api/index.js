import axios from 'axios'
import router from '@/router'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
})

let workspaceRefreshPromise = null

const refreshWorkspaceId = async () => {
  const token = localStorage.getItem('accessToken')
  if (!token) return null

  if (!workspaceRefreshPromise) {
    workspaceRefreshPromise = axios
      .get(`${api.defaults.baseURL}/users/me/workspace`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then((res) => res?.data?.data?.workspaceId || null)
      .catch(() => null)
      .finally(() => {
        workspaceRefreshPromise = null
      })
  }

  const workspaceId = await workspaceRefreshPromise
  if (workspaceId) {
    localStorage.setItem('workspaceId', workspaceId)
  }
  return workspaceId
}

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    const workspaceId = localStorage.getItem('workspaceId')
    if (workspaceId) {
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
  async (error) => {
    const status = error.response?.status
    const originalRequest = error.config || {}
    const requestUrl = String(originalRequest.url || '')

    const isAuthRoute =
      requestUrl.includes('/users/login') ||
      requestUrl.includes('/users/signup')

    const isWorkspaceDiscoveryRoute = requestUrl.includes('/users/me/workspace')

    if (
      status === 400 &&
      !isAuthRoute &&
      !isWorkspaceDiscoveryRoute &&
      !originalRequest._workspaceRetried &&
      localStorage.getItem('accessToken')
    ) {
      const refreshedWorkspaceId = await refreshWorkspaceId()
      if (refreshedWorkspaceId) {
        originalRequest._workspaceRetried = true
        originalRequest.headers = originalRequest.headers || {}
        originalRequest.headers['X-Tenant-ID'] = refreshedWorkspaceId
        return api.request(originalRequest)
      }
    }

    if (status === 400 && !isAuthRoute && !isWorkspaceDiscoveryRoute) {
      const message = String(error.response?.data?.error?.message || '')
      const workspaceContextError = /workspace|tenant|member/i.test(message)

      if (workspaceContextError) {
        localStorage.removeItem('workspaceId')

        let user = {}
        try {
          user = JSON.parse(localStorage.getItem('user') || '{}')
        } catch (_) {
          user = {}
        }

        if (user.role !== 'ADMIN' && router.currentRoute.value?.path !== '/workspace/create') {
          router.push('/workspace/create')
        }
      }
    }

    if (status === 401) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      localStorage.removeItem('user')
      localStorage.removeItem('workspaceId')
      router.push('/login')
    }

    return Promise.reject(error)
  }
)

export default api
