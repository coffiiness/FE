export const APPLICANT_WORKSPACE_STORAGE_KEY = 'applicantWorkspaceId'

export const setApplicantWorkspaceId = (workspaceId) => {
  if (typeof window === 'undefined' || !workspaceId) {
    return
  }

  localStorage.setItem(APPLICANT_WORKSPACE_STORAGE_KEY, String(workspaceId))
}

export const getApplicantWorkspaceId = () => {
  if (typeof window === 'undefined') {
    return ''
  }

  return localStorage.getItem(APPLICANT_WORKSPACE_STORAGE_KEY) || ''
}

export const clearApplicantWorkspaceId = () => {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(APPLICANT_WORKSPACE_STORAGE_KEY)
}
