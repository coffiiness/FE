const exchanges = new Map()
export const GOOGLE_OAUTH_PENDING = 'calfit.googleOAuthPending'

export const clearGoogleCalendarCache = () => {
  localStorage.removeItem('isGoogleCalendarConnected')
  localStorage.removeItem('googleCalendarEmail')
  sessionStorage.removeItem(GOOGLE_OAUTH_PENDING)
  exchanges.clear()
}

export const exchangeOAuthOnce = (state, operation) => {
  if (!state) return Promise.reject(new Error('OAuth state가 없습니다. 연동을 다시 시작해 주세요.'))
  if (!exchanges.has(state)) exchanges.set(state, Promise.resolve().then(operation))
  return exchanges.get(state)
}
