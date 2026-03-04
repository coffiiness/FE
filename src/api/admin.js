import api from './index'

export const adminApi = {
  // ── Dashboard ──
  getDashboardSummary(month) {
    return api.get('/admin/dashboard/summary', { params: { month } })
  },
  getRevenueCostTrend(period = 'monthly') {
    return api.get('/admin/dashboard/revenue-cost-trend', { params: { period } })
  },
  getPlanDistribution() {
    return api.get('/admin/dashboard/plan-distribution')
  },
  getRecentSubscriptionChanges() {
    return api.get('/admin/dashboard/recent-changes')
  },

  // ── Subscriptions ──
  getSubscriptions(params) {
    return api.get('/admin/subscriptions', { params })
  },
  getSubscriptionDetail(id) {
    return api.get(`/admin/subscriptions/${id}`)
  },
  exportSubscriptions(params) {
    return api.get('/admin/subscriptions/export', {
      params,
      responseType: 'blob'
    })
  },

  // ── Invoices ──
  getInvoiceSummary(month) {
    return api.get('/admin/invoices/summary', { params: { month } })
  },
  getInvoices(params) {
    return api.get('/admin/invoices', { params })
  },
  getInvoiceDetail(id) {
    return api.get(`/admin/invoices/${id}`)
  },

  // ── Costs ──
  getCostSummary(month) {
    return api.get('/admin/costs/summary', { params: { month } })
  },
  getCostTrend() {
    return api.get('/admin/costs/trend')
  },
  getCosts(params) {
    return api.get('/admin/costs', { params })
  },
  createCost(data) {
    return api.post('/admin/costs', data)
  },
  updateCost(id, data) {
    return api.put(`/admin/costs/${id}`, data)
  },
  deleteCost(id) {
    return api.delete(`/admin/costs/${id}`)
  },

  // ── P&L (Profit & Loss) ──
  getPnlSummary(month) {
    return api.get('/admin/pnl/summary', { params: { month } })
  },
  getPnlReport(months = 3) {
    return api.get('/admin/pnl/report', { params: { months } })
  },
  exportPnlExcel(month) {
    return api.get('/admin/pnl/export', {
      params: { month },
      responseType: 'blob'
    })
  }
}

export default adminApi
