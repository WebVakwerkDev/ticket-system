import api from '@/api/client'

export const projectsApi = {
  list: (params?: any) => api.get('/projects', { params }),
  get: (id: string) => api.get(`/projects/${id}`),
  getBySlug: (slug: string) => api.get(`/projects/by-slug/${slug}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
}

export const communicationApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/communications`),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/communications`, data),
  delete: (id: string) => api.delete(`/communications/${id}`),
}

export const notesApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/notes`),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/notes`, data),
  delete: (id: string) => api.delete(`/notes/${id}`),
}

export const repositoriesApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/repositories`),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/repositories`, data),
  delete: (id: string) => api.delete(`/repositories/${id}`),
}

export const linksApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/links`),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/links`, data),
  delete: (id: string) => api.delete(`/links/${id}`),
}
