import api from './client'

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refresh_token: refreshToken }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.put('/auth/me/password', { current_password: currentPassword, new_password: newPassword }),
}

// Users
export const usersApi = {
  list: () => api.get('/users'),
  get: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
}

// Clients
export const clientsApi = {
  list: () => api.get('/clients'),
  get: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.patch(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
}

// Projects
export const projectsApi = {
  list: (params?: any) => api.get('/projects', { params }),
  get: (id: string) => api.get(`/projects/${id}`),
  getBySlug: (slug: string) => api.get(`/projects/by-slug/${slug}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
}

// Communication
export const communicationApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/communications`),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/communications`, data),
  delete: (id: string) => api.delete(`/communications/${id}`),
}

// Notes
export const notesApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/notes`),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/notes`, data),
  delete: (id: string) => api.delete(`/notes/${id}`),
}

// Invoices
export const invoicesApi = {
  list: (params?: any) => api.get('/invoices', { params }),
  get: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  update: (id: string, data: any) => api.patch(`/invoices/${id}`, data),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  markPaid: (id: string) => api.post(`/invoices/${id}/mark-paid`),
  downloadPdf: (id: string) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' }),
}

// Proposals
export const proposalsApi = {
  list: () => api.get('/proposals'),
  listByProject: (projectId: string) => api.get(`/proposals/by-project/${projectId}`),
  get: (id: string) => api.get(`/proposals/${id}`),
  create: (data: any) => api.post('/proposals', data),
  update: (id: string, data: any) => api.patch(`/proposals/${id}`, data),
  delete: (id: string) => api.delete(`/proposals/${id}`),
  downloadPdf: (id: string) => api.get(`/proposals/${id}/pdf`, { responseType: 'blob' }),
}

// Repositories
export const repositoriesApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/repositories`),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/repositories`, data),
  delete: (id: string) => api.delete(`/repositories/${id}`),
}

// Links
export const linksApi = {
  list: (projectId: string) => api.get(`/projects/${projectId}/links`),
  create: (projectId: string, data: any) => api.post(`/projects/${projectId}/links`, data),
  delete: (id: string) => api.delete(`/links/${id}`),
}

// Tasks
export const tasksApi = {
  list: (params?: any) => api.get('/tasks', { params }),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
}

// Time Entries
export const timeEntriesApi = {
  list: (params?: any) => api.get('/time-entries', { params }),
  create: (data: any) => api.post('/time-entries', data),
  update: (id: string, data: any) => api.put(`/time-entries/${id}`, data),
  delete: (id: string) => api.delete(`/time-entries/${id}`),
  summary: (year?: number) => api.get('/time-entries/summary', { params: year ? { year } : {} }),
}

// Expenses
export const expensesApi = {
  list: (params?: any) => api.get('/expenses', { params }),
  create: (data: any) => api.post('/expenses', data),
  update: (id: string, data: any) => api.put(`/expenses/${id}`, data),
  delete: (id: string) => api.delete(`/expenses/${id}`),
}

// Finance
export const financeApi = {
  overview: (year?: number) => api.get('/finance/overview', { params: year ? { year } : {} }),
  monthlyReport: (year: number, month: number, format = 'json') =>
    api.get('/finance/reports/monthly', { params: { year, month, format }, responseType: format === 'pdf' ? 'blob' : 'json' }),
  yearlyReport: (year: number, format = 'json', includeUnpaid = false) =>
    api.get('/finance/reports/yearly', { params: { year, format, include_unpaid: includeUnpaid }, responseType: format === 'pdf' ? 'blob' : 'json' }),
  taxSettings: (year: number) => api.get(`/finance/tax-settings/${year}`),
  updateTaxSettings: (year: number, data: any) => api.put(`/finance/tax-settings/${year}`, data),
  taxSummary: (year: number) => api.get(`/finance/tax-summary/${year}`),
}

// Dashboard
export const dashboardApi = {
  stats: () => api.get('/dashboard/stats'),
}

// Settings
export const settingsApi = {
  get: () => api.get('/settings'),
  update: (data: any) => api.put('/settings', data),
}

// Export
export const exportApi = {
  database: (password: string) => api.post('/export/database', { password }),
}
