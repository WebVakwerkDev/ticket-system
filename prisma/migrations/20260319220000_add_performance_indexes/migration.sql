-- Add performance indexes for frequently queried foreign keys and status fields

CREATE INDEX IF NOT EXISTS "communication_entries_projectId_idx" ON "communication_entries"("projectId");
CREATE INDEX IF NOT EXISTS "communication_entries_occurredAt_idx" ON "communication_entries"("occurredAt");

CREATE INDEX IF NOT EXISTS "change_requests_projectId_idx" ON "change_requests"("projectId");
CREATE INDEX IF NOT EXISTS "change_requests_status_idx" ON "change_requests"("status");

CREATE INDEX IF NOT EXISTS "invoices_clientId_idx" ON "invoices"("clientId");
CREATE INDEX IF NOT EXISTS "invoices_projectId_idx" ON "invoices"("projectId");
CREATE INDEX IF NOT EXISTS "invoices_status_idx" ON "invoices"("status");

CREATE INDEX IF NOT EXISTS "project_repositories_projectId_idx" ON "project_repositories"("projectId");

CREATE INDEX IF NOT EXISTS "agent_runs_projectId_idx" ON "agent_runs"("projectId");
