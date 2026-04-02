import api from '@/api/client'

export const proposalsApi = {
  list: () => api.get('/proposals'),
  listByProject: (projectId: string) => api.get(`/proposals/by-project/${projectId}`),
  get: (id: string) => api.get(`/proposals/${id}`),
  create: (data: any) => api.post('/proposals', data),
  update: (id: string, data: any) => api.patch(`/proposals/${id}`, data),
  delete: (id: string) => api.delete(`/proposals/${id}`),
  downloadPdf: (id: string) => api.get(`/proposals/${id}/pdf`, { responseType: 'blob' }),
}
