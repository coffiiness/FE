import axios from 'axios'
import router from '@/router'
import {
  clearApplicantWorkspaceId,
  getApplicantWorkspaceId
} from '@/utils/applicantWorkspace'

const resolveBaseUrl = () => {
  const rawBase =
    import.meta.env.VITE_PUBLIC_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    'http://localhost:8080'

  const normalized = rawBase
    .replace(/\/api\/public\/v1\/?$/, '')
    .replace(/\/api\/v1\/?$/, '')

  return `${normalized}/api/v1`
}

const applicantApi = axios.create({
  baseURL: resolveBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
})

applicantApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('applicantAccessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => Promise.reject(error)
)

applicantApi.interceptors.response.use(
  (response) => {
    if (response?.data?.result === 'ERROR') {
      const error = new Error(
        response.data?.error?.message || '요청 처리에 실패했습니다.'
      )
      error.response = response
      return Promise.reject(error)
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      const workspaceId = getApplicantWorkspaceId()
      localStorage.removeItem('applicantAccessToken')
      localStorage.removeItem('applicant')
      clearApplicantWorkspaceId()
      const redirect = router.currentRoute.value?.fullPath || '/'
      router.push({
        path: workspaceId ? `/careers/${workspaceId}/login` : '/careers',
        query: { redirect }
      })
    }
    return Promise.reject(error)
  }
)

export default applicantApi
