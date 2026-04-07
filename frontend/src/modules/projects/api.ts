import api from '@/api/client'
import type { Project, ProjectCreate, ProjectUpdate } from './types'

export const projectsApi = {
  list: (params?: { status?: string; client_id?: string; search?: string }) =>
    api.get<Project[]>('/projects', { params }),
  get: (id: string) =>
    api.get<Project>(`/projects/${id}`),
  getBySlug: (slug: string) =>
    api.get<Project>(`/projects/by-slug/${slug}`),
  create: (data: ProjectCreate) =>
    api.post<Project>('/projects', data),
  update: (id: string, data: ProjectUpdate) =>
    api.patch<Project>(`/projects/${id}`, data),
  delete: (id: string) =>
    api.delete(`/projects/${id}`),
}

export const communicationApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/communications`),
  create: (projectId: string, data: Record<string, unknown>) => api.post(`/projects/${projectId}/communications`, data),
  delete: (id: string) => api.delete(`/communications/${id}`),
}

export const notesApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/notes`),
  create: (projectId: string, data: { content: string }) => api.post(`/projects/${projectId}/notes`, data),
  delete: (id: string) => api.delete(`/notes/${id}`),
}

export const repositoriesApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/repositories`),
  create: (projectId: string, data: Record<string, unknown>) => api.post(`/projects/${projectId}/repositories`, data),
  delete: (id: string) => api.delete(`/repositories/${id}`),
}

export const linksApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/links`),
  create: (projectId: string, data: Record<string, unknown>) => api.post(`/projects/${projectId}/links`, data),
  delete: (id: string) => api.delete(`/links/${id}`),
}
