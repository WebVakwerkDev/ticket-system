export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE'

export interface InvoiceLineItem {
  description: string
  quantity: string
  unit_price: string
  total: string
}

export interface Invoice {
  id: string
  client_id: string
  project_id: string | null
  invoice_number: string
  issue_date: string
  service_date: string | null
  due_date: string
  status: InvoiceStatus
  subtotal: string
  vat_rate: string
  vat_amount: string
  total_amount: string
  description: string | null
  notes: string | null
  line_items: InvoiceLineItem[]
  paid_at: string | null
  created_at: string
  updated_at: string
}

export interface InvoiceCreate {
  client_id: string
  project_id?: string
  issue_date: string
  due_date: string
  service_date?: string
  vat_rate?: number
  description?: string
  notes?: string
  line_items: Array<{ description: string; quantity: string; unit_price: string; total: string }>
}
