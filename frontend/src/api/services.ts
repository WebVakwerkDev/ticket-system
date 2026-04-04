import type { AxiosResponse } from 'axios'
import api from './client'
import type {
  TokenResponse,
  User,
  Project,
  Invoice,
  Task,
  TimeEntry,
  Expense,
  CompanySettings,
  DashboardStats,
  TaxSettings,
} from './types'

// Re-exports from migrated modules (backwards compatibility for views not yet migrated)
export { tasksApi } from '@/modules/tasks/api'
export { expensesApi } from '@/modules/expenses/api'
export { clientsApi } from '@/modules/clients/api'

// Auth
export const authApi = {
  login: (email: string, password: string): Promise<AxiosResponse<TokenResponse>> =>
    api.post('/auth/login', { email, password }),
  refresh: (refreshToken: string): Promise<AxiosResponse<TokenResponse>> =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
  logout: (): Promise<AxiosResponse<void>> =>
    api.post('/auth/logout'),
  me: (): Promise<AxiosResponse<User>> =>
    api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string): Promise<AxiosResponse<void>> =>
    api.put('/auth/me/password', { current_password: currentPassword, new_password: newPassword }),
}

// Users
export const usersApi = {
  list: (): Promise<AxiosResponse<User[]>> =>
    api.get('/users'),
  get: (id: string): Promise<AxiosResponse<User>> =>
    api.get(`/users/${id}`),
  create: (data: Partial<User>): Promise<AxiosResponse<User>> =>
    api.post('/users', data),
  update: (id: string, data: Partial<User>): Promise<AxiosResponse<User>> =>
    api.patch(`/users/${id}`, data),
  delete: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/users/${id}`),
}

// Projects
export const projectsApi = {
  list: (params?: Record<string, unknown>): Promise<AxiosResponse<Project[]>> =>
    api.get('/projects', { params }),
  get: (id: string): Promise<AxiosResponse<Project>> =>
    api.get(`/projects/${id}`),
  getBySlug: (slug: string): Promise<AxiosResponse<Project>> =>
    api.get(`/projects/by-slug/${slug}`),
  create: (data: Partial<Project>): Promise<AxiosResponse<Project>> =>
    api.post('/projects', data),
  update: (id: string, data: Partial<Project>): Promise<AxiosResponse<Project>> =>
    api.patch(`/projects/${id}`, data),
  delete: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/projects/${id}`),
}

// Communication
export const communicationApi = {
  list: (projectId: string): Promise<AxiosResponse<unknown[]>> =>
    api.get(`/projects/${projectId}/communications`),
  create: (projectId: string, data: Record<string, unknown>): Promise<AxiosResponse<unknown>> =>
    api.post(`/projects/${projectId}/communications`, data),
  delete: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/communications/${id}`),
}

// Notes
export const notesApi = {
  list: (projectId: string): Promise<AxiosResponse<unknown[]>> =>
    api.get(`/projects/${projectId}/notes`),
  create: (projectId: string, data: Record<string, unknown>): Promise<AxiosResponse<unknown>> =>
    api.post(`/projects/${projectId}/notes`, data),
  delete: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/notes/${id}`),
}

// Invoices
export const invoicesApi = {
  list: (params?: Record<string, unknown>): Promise<AxiosResponse<Invoice[]>> =>
    api.get('/invoices', { params }),
  get: (id: string): Promise<AxiosResponse<Invoice>> =>
    api.get(`/invoices/${id}`),
  create: (data: Partial<Invoice>): Promise<AxiosResponse<Invoice>> =>
    api.post('/invoices', data),
  update: (id: string, data: Partial<Invoice>): Promise<AxiosResponse<Invoice>> =>
    api.patch(`/invoices/${id}`, data),
  delete: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/invoices/${id}`),
  markPaid: (id: string): Promise<AxiosResponse<Invoice>> =>
    api.post(`/invoices/${id}/mark-paid`),
  downloadPdf: (id: string): Promise<AxiosResponse<Blob>> =>
    api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
}

// Proposals
export const proposalsApi = {
  list: (): Promise<AxiosResponse<unknown[]>> =>
    api.get('/proposals'),
  listByProject: (projectId: string): Promise<AxiosResponse<unknown[]>> =>
    api.get(`/proposals/by-project/${projectId}`),
  get: (id: string): Promise<AxiosResponse<unknown>> =>
    api.get(`/proposals/${id}`),
  create: (data: Record<string, unknown>): Promise<AxiosResponse<unknown>> =>
    api.post('/proposals', data),
  update: (id: string, data: Record<string, unknown>): Promise<AxiosResponse<unknown>> =>
    api.patch(`/proposals/${id}`, data),
  delete: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/proposals/${id}`),
  downloadPdf: (id: string): Promise<AxiosResponse<Blob>> =>
    api.get(`/proposals/${id}/pdf`, { responseType: 'blob' }),
}

// Repositories
export const repositoriesApi = {
  list: (projectId: string): Promise<AxiosResponse<unknown[]>> =>
    api.get(`/projects/${projectId}/repositories`),
  create: (projectId: string, data: Record<string, unknown>): Promise<AxiosResponse<unknown>> =>
    api.post(`/projects/${projectId}/repositories`, data),
  delete: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/repositories/${id}`),
}

// Links
export const linksApi = {
  list: (projectId: string): Promise<AxiosResponse<unknown[]>> =>
    api.get(`/projects/${projectId}/links`),
  create: (projectId: string, data: Record<string, unknown>): Promise<AxiosResponse<unknown>> =>
    api.post(`/projects/${projectId}/links`, data),
  delete: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/links/${id}`),
}

// Time Entries
export const timeEntriesApi = {
  list: (params?: Record<string, unknown>): Promise<AxiosResponse<TimeEntry[]>> =>
    api.get('/time-entries', { params }),
  create: (data: Partial<TimeEntry>): Promise<AxiosResponse<TimeEntry>> =>
    api.post('/time-entries', data),
  update: (id: string, data: Partial<TimeEntry>): Promise<AxiosResponse<TimeEntry>> =>
    api.put(`/time-entries/${id}`, data),
  delete: (id: string): Promise<AxiosResponse<void>> =>
    api.delete(`/time-entries/${id}`),
  summary: (year?: number): Promise<AxiosResponse<unknown>> =>
    api.get('/time-entries/summary', { params: year ? { year } : {} }),
}

// Finance
export const financeApi = {
  overview: (year?: number): Promise<AxiosResponse<unknown>> =>
    api.get('/finance/overview', { params: year ? { year } : {} }),
  monthlyReport: (year: number, month: number, format = 'json'): Promise<AxiosResponse<unknown>> =>
    api.get('/finance/reports/monthly', { params: { year, month, format }, responseType: format === 'pdf' ? 'blob' : 'json' }),
  yearlyReport: (year: number, format = 'json', includeUnpaid = false): Promise<AxiosResponse<unknown>> =>
    api.get('/finance/reports/yearly', { params: { year, format, include_unpaid: includeUnpaid }, responseType: format === 'pdf' ? 'blob' : 'json' }),
  taxSettings: (year: number): Promise<AxiosResponse<TaxSettings>> =>
    api.get(`/finance/tax-settings/${year}`),
  updateTaxSettings: (year: number, data: Partial<TaxSettings>): Promise<AxiosResponse<TaxSettings>> =>
    api.put(`/finance/tax-settings/${year}`, data),
  taxSummary: (year: number): Promise<AxiosResponse<unknown>> =>
    api.get(`/finance/tax-summary/${year}`),
}

// Dashboard
export const dashboardApi = {
  stats: (): Promise<AxiosResponse<DashboardStats>> =>
    api.get('/dashboard/stats'),
}

// Settings
export const settingsApi = {
  get: (): Promise<AxiosResponse<CompanySettings>> =>
    api.get('/settings'),
  update: (data: Partial<CompanySettings>): Promise<AxiosResponse<CompanySettings>> =>
    api.put('/settings', data),
}

// Export
export const exportApi = {
  database: (password: string): Promise<AxiosResponse<unknown>> =>
    api.post('/export/database', { password }),
}
