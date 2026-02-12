import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import router from '@/router'

const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
const isAuthenticated = computed(() => !!user.value)

export function useAuth() {
  const login = async (email, password) => {
    // Mock login for frontend development
    const mockResponse = {
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: 1,
        email: email,
        name: '김철수',
        role: 'admin'
      }
    }

    const { accessToken, refreshToken, user: userData } = mockResponse

    localStorage.setItem('accessToken', accessToken)
    localStorage.setItem('refreshToken', refreshToken)
    localStorage.setItem('user', JSON.stringify(userData))
    user.value = userData

    return mockResponse
  }

  const signup = async (email, password, name) => {
    const response = await authApi.signup({ email, password, name })
    return response.data
  }

  const logout = () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    user.value = null
    router.push('/login')
  }

  const fetchUser = async () => {
    try {
      const response = await authApi.getMe()
      user.value = response.data
      localStorage.setItem('user', JSON.stringify(response.data))
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
