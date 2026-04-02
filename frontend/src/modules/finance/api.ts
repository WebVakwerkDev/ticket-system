import api from '@/api/client'

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
