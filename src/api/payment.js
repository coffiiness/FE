import api from './index'

export const getTossConfig = () => api.get('/payments/toss-config')

export const registerBillingKey = (data) => api.post('/payments/billing-key', data)

export const upgradeToEnterprise = () => api.post('/payments/upgrade')

export const downgradeToFree = () => api.post('/payments/downgrade')

export const getRegisteredCard = () => api.get('/payments/card')

export const getSubscription = () => api.get('/payments/subscription')

export const getPaymentHistory = (page = 0, size = 20) =>
  api.get('/payments/history', { params: { page, size } })
