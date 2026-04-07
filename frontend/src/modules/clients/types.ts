export interface Client {
  id: string
  company_name: string
  contact_name: string
  email: string
  phone: string | null
  street: string | null
  postal_code: string | null
  city: string | null
  country: string | null
  website: string | null
  notes: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface ClientCreate {
  company_name: string
  contact_name: string
  email: string
  phone?: string
  street?: string
  postal_code?: string
  city?: string
}
