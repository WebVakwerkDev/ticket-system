export type ProjectStatus =
  | 'LEAD' | 'INTAKE' | 'IN_PROGRESS' | 'WAITING_FOR_CLIENT'
  | 'REVIEW' | 'COMPLETED' | 'MAINTENANCE' | 'PAUSED' | 'CANCELLED'

export type ProjectPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'

export interface Project {
  id: string
  name: string
  slug: string
  status: ProjectStatus
  project_type: string
  priority: ProjectPriority
  client_id: string
  client?: { company_name: string; contact_name: string; email: string }
  description: string | null
  scope: string | null
  tech_stack: string | null
  domain_name: string | null
  hosting_info: string | null
  recurring_fee: number | null
  start_date: string | null
  tags: string[]
  owner_user_id: string | null
  created_at: string
  updated_at: string
}

export interface ProjectCreate {
  name: string
  client_id: string
  project_type: string
  status?: ProjectStatus
  priority?: ProjectPriority
  description?: string
  recurring_fee?: number | null
}

export interface ProjectUpdate extends Partial<ProjectCreate> {
  status?: ProjectStatus
  priority?: ProjectPriority
}
