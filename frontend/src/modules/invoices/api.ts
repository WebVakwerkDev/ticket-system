import api from '@/api/client'
import type { Invoice, InvoiceCreate } from './types'

export const invoicesApi = {
  list: (params?: { client_id?: string; project_id?: string; status?: string }) =>
    api.get<Invoice[]>('/invoices', { params }),
  get: (id: string) =>
    api.get<Invoice>(`/invoices/${id}`),
  create: (data: InvoiceCreate) =>
    api.post<Invoice>('/invoices', data),
  update: (id: string, data: Partial<InvoiceCreate>) =>
    api.patch<Invoice>(`/invoices/${id}`, data),
  delete: (id: string) =>
    api.delete(`/invoices/${id}`),
  markPaid: (id: string) =>
    api.post<Invoice>(`/invoices/${id}/mark-paid`),
  downloadPdf: (id: string) =>
    api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
}
