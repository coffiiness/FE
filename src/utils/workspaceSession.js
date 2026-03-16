import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1'

let workspaceResolvePromise = null

export const readStoredUser = () => {
  const rawUser = localStorage.getItem('user')
  if (!rawUser) return null

  try {
    return JSON.parse(rawUser)
  } catch {
    return null
  }
}

export const getWorkspaceIdFromUser = (user = readStoredUser()) => {
  const resolvedWorkspaceId =
    user?.workspaceId ??
    user?.workspace?.workspaceId ??
    user?.workspace?.id ??
    null

  return resolvedWorkspaceId ? String(resolvedWorkspaceId) : null
}

export const getStoredWorkspaceId = () => {
  const storedWorkspaceId = localStorage.getItem('workspaceId')
  if (storedWorkspaceId) {
    return storedWorkspaceId
  }

  const userWorkspaceId = getWorkspaceIdFromUser()
  if (userWorkspaceId) {
    localStorage.setItem('workspaceId', userWorkspaceId)
    return userWorkspaceId
  }

  return null
}

export const ensureWorkspaceId = async (accessToken = localStorage.getItem('accessToken')) => {
  const storedWorkspaceId = getStoredWorkspaceId()
  if (storedWorkspaceId) {
    return storedWorkspaceId
  }

  if (!accessToken) {
    return null
  }

  if (!workspaceResolvePromise) {
    workspaceResolvePromise = axios
      .get(`${API_BASE_URL}/users/me/workspace`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      .then((response) => response?.data?.data?.workspaceId || null)
      .catch(() => null)
      .finally(() => {
        workspaceResolvePromise = null
      })
  }

  const workspaceId = await workspaceResolvePromise
  if (workspaceId) {
    const normalizedWorkspaceId = String(workspaceId)
    localStorage.setItem('workspaceId', normalizedWorkspaceId)
    return normalizedWorkspaceId
  }

  return null
}
