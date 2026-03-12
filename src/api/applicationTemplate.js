import api from './index'

const BASE_PATH = '/application-templates'

const shouldFallbackWorkspacePath = (error) => {
  const status = error?.response?.status
  return status === 400 || status === 404 || status === 405 || status === 500
}

const resolveWorkspaceId = () => {
  const fromStorage = localStorage.getItem('workspaceId')
  if (fromStorage) return fromStorage

  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}')
    return user?.workspaceId ?? user?.workspace?.workspaceId ?? user?.workspace?.id ?? null
  } catch (_) {
    return null
  }
}

const resolveWorkspaceBasePath = () => {
  const workspaceId = resolveWorkspaceId()
  return workspaceId ? `/workspaces/${workspaceId}/application-templates` : null
}

export const applicationTemplateApi = {
  async getTemplate(templateId) {
    try {
      return await api.get(`${BASE_PATH}/${templateId}`)
    } catch (error) {
      const workspaceBasePath = resolveWorkspaceBasePath()
      if (!workspaceBasePath || !shouldFallbackWorkspacePath(error)) throw error
      return api.get(`${workspaceBasePath}/${templateId}`)
    }
  },
  async getTemplates(params = {}) {
    try {
      return await api.get(BASE_PATH, { params })
    } catch (error) {
      const workspaceBasePath = resolveWorkspaceBasePath()
      if (!workspaceBasePath || !shouldFallbackWorkspacePath(error)) throw error
      return api.get(workspaceBasePath, { params })
    }
  },

  async createTemplate(payload) {
    try {
      return await api.post(BASE_PATH, payload)
    } catch (error) {
      const workspaceBasePath = resolveWorkspaceBasePath()
      if (!workspaceBasePath || !shouldFallbackWorkspacePath(error)) throw error
      return api.post(workspaceBasePath, payload)
    }
  },

  async updateTemplate(templateId, payload) {
    try {
      return await api.put(`${BASE_PATH}/${templateId}`, payload)
    } catch (error) {
      const workspaceBasePath = resolveWorkspaceBasePath()
      if (!workspaceBasePath || !shouldFallbackWorkspacePath(error)) throw error
      return api.put(`${workspaceBasePath}/${templateId}`, payload)
    }
  },

  async updateTemplateStatus(templateId, status) {
    try {
      return await api.patch(`${BASE_PATH}/${templateId}/status`, { status })
    } catch (error) {
      const workspaceBasePath = resolveWorkspaceBasePath()
      if (!workspaceBasePath || !shouldFallbackWorkspacePath(error)) throw error
      return api.patch(`${workspaceBasePath}/${templateId}/status`, { status })
    }
  },

  async deleteTemplate(templateId) {
    try {
      return await api.delete(`${BASE_PATH}/${templateId}`)
    } catch (error) {
      const workspaceBasePath = resolveWorkspaceBasePath()
      if (!workspaceBasePath || !shouldFallbackWorkspacePath(error)) throw error
      return api.delete(`${workspaceBasePath}/${templateId}`)
    }
  }
}
