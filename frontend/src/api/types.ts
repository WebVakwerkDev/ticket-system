// ─── Auth ────────────────────────────────────────────────────────────────────

export interface TokenResponse {
  access_token: string
  refresh_token: string
}

export interface User {
  id: string
  name: string
  email: string
  role: string
  is_active: boolean
}

// ─── Clients ─────────────────────────────────────────────────────────────────

export interface Client {
  id: string
  name: string
  email: string | null
  phone: string | null
  street: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  kvk: string | null
  vat: string | null
  created_at: string
  updated_at: string
}

// ─── Projects ────────────────────────────────────────────────────────────────

export interface Project {
  id: string
  name: string
  slug: string
  status: string
  project_type: string
  client_id: string | null
  hourly_rate: number | null
  tools_used: string[] | null
  delivery_form: string | null
  recurring_fee: number | null
  created_at: string
  updated_at: string
}

// ─── Invoices ────────────────────────────────────────────────────────────────

export interface Invoice {
  id: string
  invoice_number: string
  status: string
  client_id: string
  project_id: string | null
  amount: number
  tax_rate: number
  issued_at: string
  due_at: string
  paid_at: string | null
  created_at: string
}

// ─── Tasks ───────────────────────────────────────────────────────────────────

export interface Task {
  id: string
  title: string
  status: string
  priority: string
  project_id: string | null
  assignee_id: string | null
  due_date: string | null
  created_at: string
  updated_at: string
}

// ─── Time Entries ─────────────────────────────────────────────────────────────

export interface TimeEntry {
  id: string
  project_id: string
  description: string | null
  hours: number
  date: string
  created_at: string
}

// ─── Expenses ────────────────────────────────────────────────────────────────

export interface Expense {
  id: string
  description: string
  amount: number
  category: string | null
  date: string
  created_at: string
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface CompanySettings {
  name: string
  email: string | null
  phone: string | null
  street: string | null
  city: string | null
  postal_code: string | null
  website: string | null
  kvk: string | null
  vat: string | null
  iban: string | null
  account_holder: string | null
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  open_invoices: number
  open_invoices_amount: number
  active_projects: number
  hours_this_month: number
}

// ─── Finance ─────────────────────────────────────────────────────────────────

export interface TaxSettings {
  year: number
  kor_enabled: boolean
  zelfstandigenaftrek_enabled: boolean
}
