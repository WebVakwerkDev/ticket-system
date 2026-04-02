import api from '@/api/client'

export const invoicesApi = {
  list: (params?: any) => api.get('/invoices', { params }),
  get: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  update: (id: string, data: any) => api.patch(`/invoices/${id}`, data),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  markPaid: (id: string) => api.post(`/invoices/${id}/mark-paid`),
  downloadPdf: (id: string) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
}
