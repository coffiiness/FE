import axios from 'axios'
import api from './index'

const shouldFallbackToWorkspaceEndpoint = (error) => {
  const status = error?.response?.status
  return status === 400 || status === 404 || status === 405
}

const shouldIgnoreWorkspaceFallbackError = (error) => {
  const status = error?.response?.status
  return status === 401 || status === 403 || shouldFallbackToWorkspaceEndpoint(error)
}

const shouldIgnoreDetailFallbackError = (error) => {
  const status = error?.response?.status
  return status === 401 || status === 403 || shouldFallbackToWorkspaceEndpoint(error)
}

const getWorkspaceIdFromStorage = () => {
  const storedWorkspaceId = localStorage.getItem('workspaceId')
  if (storedWorkspaceId) {
    return storedWorkspaceId
  }

  const rawUser = localStorage.getItem('user')
  if (!rawUser) {
    return null
  }

  try {
    const user = JSON.parse(rawUser)
    const resolvedWorkspaceId =
      user?.workspaceId ??
      user?.workspace?.workspaceId ??
      user?.workspace?.id ??
      null

    if (resolvedWorkspaceId) {
      localStorage.setItem('workspaceId', String(resolvedWorkspaceId))
      return String(resolvedWorkspaceId)
    }
  } catch {
    return null
  }

  return null
}

const buildTenantHeaderConfig = (workspaceId = getWorkspaceIdFromStorage()) => {
  if (!workspaceId) {
    return {}
  }

  return {
    headers: {
      'X-Tenant-ID': workspaceId
    }
  }
}

const normalizeKeywordParams = (params = {}) => {
  const normalized = { ...params }

  if (normalized.search && !normalized.keyword) {
    normalized.keyword = normalized.search
  }

  if (normalized.keyword == null || normalized.keyword === '') {
    delete normalized.keyword
  }

  return normalized
}

const toApplicantList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (Array.isArray(payload?.content)) return payload.content
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.applicants)) return payload.applicants
  if (Array.isArray(payload?.rows)) return payload.rows
  if (Array.isArray(payload?.list)) return payload.list
  if (Array.isArray(payload?.data)) return payload.data
  return []
}

const publicApplyApi = axios.create({
  baseURL: api.defaults.baseURL,
  headers: {
    'Content-Type': 'application/json'
  }
})

const submitToTarget = async (target, recruitmentId, payload) => {
  try {
    return await publicApplyApi.post(`/careers/${target}/${recruitmentId}/apply`, payload)
  } catch (error) {
    if (!shouldFallbackToWorkspaceEndpoint(error)) {
      throw error
    }

    return publicApplyApi.post(`/careers/${target}/recruitments/${recruitmentId}/apply`, payload)
  }
}

const resolveSubmitTargets = (companySlugOrWorkspaceId) => {
  const targets = []
  const isLoggedIn = Boolean(localStorage.getItem('accessToken'))
  const workspaceId = getWorkspaceIdFromStorage()

  if (isLoggedIn && workspaceId) {
    targets.push(String(workspaceId))
  }

  if (!targets.includes(String(companySlugOrWorkspaceId))) {
    targets.push(String(companySlugOrWorkspaceId))
  }

  return targets
}

export const extractResponseData = (response) => {
  const body = response?.data
  if (body == null) {
    return null
  }

  const primary = body?.data ?? body
  if (primary?.data !== undefined && !Array.isArray(primary)) {
    return primary.data
  }

  return primary
}

export const applicantApi = {
  async submitCareerApplication(companySlugOrWorkspaceId, recruitmentId, payload) {
    const submitTargets = resolveSubmitTargets(companySlugOrWorkspaceId)
    let lastError = null

    for (const target of submitTargets) {
      try {
        return await submitToTarget(target, recruitmentId, payload)
      } catch (error) {
        lastError = error
      }
    }

    throw lastError
  },

  exportApplicants(params = {}) {
    return api.get('/applicants/export', {
      params: normalizeKeywordParams(params),
      ...buildTenantHeaderConfig(),
      responseType: 'blob'
    })
  },

  exportApplicantsExcel(params = {}) {
    return api.get('/applicants/excel', {
      params: normalizeKeywordParams(params),
      ...buildTenantHeaderConfig(),
      responseType: 'blob'
    })
  },

  exportWorkspaceApplicants(workspaceId, params = {}) {
    return api.get(`/workspaces/${workspaceId}/applicants/export`, {
      params: normalizeKeywordParams(params),
      ...buildTenantHeaderConfig(workspaceId),
      responseType: 'blob'
    })
  },

  exportWorkspaceApplicantsExcel(workspaceId, params = {}) {
    return api.get(`/workspaces/${workspaceId}/applicants/excel`, {
      params: normalizeKeywordParams(params),
      ...buildTenantHeaderConfig(workspaceId),
      responseType: 'blob'
    })
  },

  async exportApplicantsWithFallback(params = {}) {
    const workspaceId = getWorkspaceIdFromStorage()

    if (workspaceId) {
      try {
        return await this.exportWorkspaceApplicants(workspaceId, params)
      } catch (workspaceExportError) {
        if (!shouldFallbackToWorkspaceEndpoint(workspaceExportError)) {
          throw workspaceExportError
        }

        try {
          return await this.exportWorkspaceApplicantsExcel(workspaceId, params)
        } catch (workspaceExcelError) {
          if (!shouldFallbackToWorkspaceEndpoint(workspaceExcelError)) {
            throw workspaceExcelError
          }
        }
      }
    }

    try {
      return await this.exportApplicants(params)
    } catch (primaryError) {
      if (!shouldFallbackToWorkspaceEndpoint(primaryError)) {
        throw primaryError
      }

      return this.exportApplicantsExcel(params)
    }
  },

  getApplicants(params = {}) {
    return api.get('/applicants', {
      params: normalizeKeywordParams(params),
      ...buildTenantHeaderConfig()
    })
  },

  getWorkspaceApplicants(workspaceId, params = {}) {
    return api.get(`/workspaces/${workspaceId}/applicants`, {
      params: normalizeKeywordParams(params),
      ...buildTenantHeaderConfig(workspaceId)
    })
  },

  async getApplicantsWithFallback(params = {}) {
    const workspaceId = getWorkspaceIdFromStorage()

    if (workspaceId) {
      try {
        const workspaceResponse = await this.getWorkspaceApplicants(workspaceId, params)
        const workspacePayload = extractResponseData(workspaceResponse)
        const workspaceList = toApplicantList(workspacePayload)
        if (workspaceList.length > 0) {
          return workspaceResponse
        }
      } catch (workspaceError) {
        if (!shouldIgnoreWorkspaceFallbackError(workspaceError)) {
          throw workspaceError
        }
      }
    }
    return this.getApplicants(params)
  },

  getApplicantDetail(detailId) {
    return api.get(`/applicants/${detailId}`, {
      ...buildTenantHeaderConfig()
    })
  },

  getRecruitmentApplicantDetail(detailId) {
    return api.get(`/recruitment/applicants/${detailId}`, {
      ...buildTenantHeaderConfig()
    })
  },

  getWorkspaceApplicantDetail(workspaceId, detailId) {
    return api.get(`/workspaces/${workspaceId}/applicants/${detailId}`, {
      ...buildTenantHeaderConfig(workspaceId)
    })
  },

  async getApplicantDetailWithFallback(detailId) {
    const workspaceId = getWorkspaceIdFromStorage()

    if (workspaceId) {
      try {
        return await this.getWorkspaceApplicantDetail(workspaceId, detailId)
      } catch (workspaceError) {
        if (!shouldIgnoreDetailFallbackError(workspaceError)) {
          throw workspaceError
        }
      }
    }

    try {
      return await this.getApplicantDetail(detailId)
    } catch (applicantError) {
      if (!shouldFallbackToWorkspaceEndpoint(applicantError)) {
        throw applicantError
      }
    }

    return this.getRecruitmentApplicantDetail(detailId)
  },
}

