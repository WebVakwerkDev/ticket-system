import api from '@/api/client'
import type { Client, ClientCreate } from './types'

export const clientsApi = {
  list: () =>
    api.get<Client[]>('/clients'),
  get: (id: string) =>
    api.get<Client>(`/clients/${id}`),
  create: (data: ClientCreate) =>
    api.post<Client>('/clients', data),
  update: (id: string, data: Partial<ClientCreate>) =>
    api.patch<Client>(`/clients/${id}`, data),
  delete: (id: string) =>
    api.delete(`/clients/${id}`),
}
