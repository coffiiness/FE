import { ref, computed } from 'vue'
import { applicantAuthApi } from '@/api/applicants'
import {
  clearApplicantWorkspaceId,
  getApplicantWorkspaceId,
  setApplicantWorkspaceId
} from '@/utils/applicantWorkspace'

const applicant = ref(JSON.parse(localStorage.getItem('applicant') || 'null'))
const accessToken = ref(localStorage.getItem('applicantAccessToken') || '')
const isAuthenticated = computed(() => !!accessToken.value)

let listenersInitialized = false
const notifyAuthChange = () => {
  window.dispatchEvent(new Event('applicant-auth-changed'))
}

export function useApplicantAuth() {
  const syncFromStorage = () => {
    const token = localStorage.getItem('applicantAccessToken') || ''
    const storedApplicant = localStorage.getItem('applicant')

    accessToken.value = token
    if (storedApplicant) {
      try {
        const parsed = JSON.parse(storedApplicant)
        applicant.value = parsed
      } catch (_) {
        // ignore parse errors
      }
    } else {
      applicant.value = null
    }
  }

  syncFromStorage()

  if (!listenersInitialized && typeof window !== 'undefined') {
    listenersInitialized = true
    window.addEventListener('storage', (event) => {
      if (event.key === 'applicantAccessToken' || event.key === 'applicant') {
        syncFromStorage()
      }
    })
    window.addEventListener('applicant-auth-changed', () => {
      syncFromStorage()
    })
  }

  const login = async (workspaceId, email, password) => {
    const resolvedWorkspaceId = workspaceId || getApplicantWorkspaceId()
    if (!resolvedWorkspaceId) {
      throw new Error('workspaceId is required.')
    }

    const response = await applicantAuthApi.login(resolvedWorkspaceId, { email, password })
    const { accessToken: token, applicant: applicantData } = response.data.data

    localStorage.setItem('applicantAccessToken', token)
    localStorage.setItem('applicant', JSON.stringify(applicantData))
    setApplicantWorkspaceId(resolvedWorkspaceId)

    accessToken.value = token
    applicant.value = applicantData
    notifyAuthChange()

    return response.data.data
  }

  const signup = async (workspaceId, name, email, password) => {
    const resolvedWorkspaceId = workspaceId || getApplicantWorkspaceId()
    if (!resolvedWorkspaceId) {
      throw new Error('workspaceId is required.')
    }

    const response = await applicantAuthApi.signup(resolvedWorkspaceId, { name, email, password })
    setApplicantWorkspaceId(resolvedWorkspaceId)
    return response.data.data
  }

  const logout = () => {
    localStorage.removeItem('applicantAccessToken')
    localStorage.removeItem('applicant')
    clearApplicantWorkspaceId()
    accessToken.value = ''
    applicant.value = null
    notifyAuthChange()
  }

  return {
    applicant,
    isAuthenticated,
    login,
    signup,
    logout,
    syncFromStorage
  }
}
