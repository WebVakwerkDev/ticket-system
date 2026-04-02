import api from '@/api/client'

export const timeEntriesApi = {
  list: (params?: any) => api.get('/time-entries', { params }),
  create: (data: any) => api.post('/time-entries', data),
  update: (id: string, data: any) => api.put(`/time-entries/${id}`, data),
  delete: (id: string) => api.delete(`/time-entries/${id}`),
  summary: (year?: number) => api.get('/time-entries/summary', { params: year ? { year } : {} }),
}
