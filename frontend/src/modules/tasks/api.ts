import api from '@/api/client'

export const tasksApi = {
  list: (params?: any) => api.get('/tasks', { params }),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
}
