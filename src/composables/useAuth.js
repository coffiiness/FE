import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import router from '@/router'
import { ensureWorkspaceId } from '@/utils/workspaceSession'

const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
const isAuthenticated = computed(() => !!user.value)

export function useAuth() {
  const login = async (email, password) => {
    const response = await authApi.login({ email, password })
    const { accessToken, refreshToken, user: userData, workspaceId } = response.data.data

    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))
    user.value = userData

    const resolvedWorkspaceId =
      (workspaceId ? String(workspaceId) : null) ||
      await ensureWorkspaceId(accessToken)

    if (resolvedWorkspaceId) {
      localStorage.setItem('workspaceId', resolvedWorkspaceId)
    } else {
      localStorage.removeItem('workspaceId')
    }

    return { ...response.data.data, workspaceId: resolvedWorkspaceId }
  }

  const signup = async (email, password, name) => {
    const response = await authApi.signup({ email, password, name })
    return response.data.data
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    localStorage.removeItem('workspaceId')
    user.value = null
    router.push('/login')
  }

  const fetchUser = async () => {
    try {
      const response = await authApi.getMe()
      user.value = response.data.data
      localStorage.setItem('user', JSON.stringify(response.data.data))
    } catch (error) {
      logout()
    }
  }

  return {
    user,
    isAuthenticated,
    login,
    signup,
    logout,
    fetchUser
  }
}
