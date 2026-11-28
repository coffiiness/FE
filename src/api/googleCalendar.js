import api from './index'
import { GOOGLE_OAUTH_PENDING, exchangeOAuthOnce } from '@/utils/googleCalendarSession'

export const googleCalendarApi = {
  async beginAuthorization() {
    const initiatingUser = localStorage.getItem('user')
    const initiatingWorkspace = localStorage.getItem('workspaceId')
    const redirectUri = `${window.location.origin}/auth/callback`
    const response = await api.post('/calendars/google/authorization', { redirectUri })
    const authorization = response.data.data
    if (initiatingUser !== localStorage.getItem('user') || initiatingWorkspace !== localStorage.getItem('workspaceId')) {
      throw new Error('계정 또는 워크스페이스가 변경되었습니다. 다시 시작해 주세요.')
    }
    const target = new URL(authorization.authorizationUrl)
    if (target.origin !== 'https://accounts.google.com' || target.searchParams.get('state') !== authorization.state) {
      throw new Error('올바르지 않은 인증 시작 응답입니다.')
    }
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    sessionStorage.setItem(GOOGLE_OAUTH_PENDING, JSON.stringify({
      state: authorization.state,
      userId: user.id ?? user.userId,
      workspaceId: localStorage.getItem('workspaceId'),
      expiresAt: Date.now() + authorization.expiresInSeconds * 1000
    }))
    return authorization.authorizationUrl
  },
  connect(authCode, state) {
    return exchangeOAuthOnce(state, () => api.post('/calendars/google/connect', {
      authCode, state, redirectUri: `${window.location.origin}/auth/callback`
    }))
  },
  status() { return api.get('/calendars/google/status') },
  disconnect() { return api.delete('/calendars/google/connect') }
}
