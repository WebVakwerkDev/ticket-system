"""initial_schema

Revision ID: 001
Revises:
Create Date: 2025-01-01 00:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def _create_enum_if_not_exists(name: str, values: list[str]) -> None:
    """Create a PostgreSQL enum type if it doesn't already exist."""
    values_str = ", ".join(f"'{v}'" for v in values)
    op.execute(sa.text(
        f"DO $$ BEGIN "
        f"CREATE TYPE {name} AS ENUM ({values_str}); "
        f"EXCEPTION WHEN duplicate_object THEN null; "
        f"END $$"
    ))


def upgrade() -> None:
    # --- Enum types (idempotent) ---
    _create_enum_if_not_exists("user_role", ["ADMIN", "EMPLOYEE", "FINANCE"])
    _create_enum_if_not_exists("project_type", ["NEW_WEBSITE", "REDESIGN", "MAINTENANCE", "LANDING_PAGE", "PORTFOLIO", "WEBSHOP", "OTHER"])
    _create_enum_if_not_exists("project_status", ["LEAD", "INTAKE", "IN_PROGRESS", "WAITING_FOR_CLIENT", "REVIEW", "COMPLETED", "MAINTENANCE", "PAUSED"])
    _create_enum_if_not_exists("priority", ["LOW", "MEDIUM", "HIGH", "URGENT"])
    _create_enum_if_not_exists("communication_type", ["EMAIL", "CALL", "MEETING", "WHATSAPP", "DM", "INTERNAL", "OTHER"])
    _create_enum_if_not_exists("change_request_source", ["EMAIL", "CALL", "WEBSITE_FORM", "INTERNAL"])
    _create_enum_if_not_exists("change_request_status", ["NEW", "REVIEWED", "PLANNED", "IN_PROGRESS", "WAITING_FOR_FEEDBACK", "DONE"])
    _create_enum_if_not_exists("impact", ["SMALL", "MEDIUM", "LARGE"])
    _create_enum_if_not_exists("invoice_status", ["DRAFT", "SENT", "PAID", "OVERDUE"])
    _create_enum_if_not_exists("agent_run_status", ["PENDING", "RUNNING", "COMPLETED", "FAILED"])
    _create_enum_if_not_exists("proposal_status", ["DRAFT", "READY", "SENT"])

    # Use postgresql.ENUM with create_type=False to reference existing enum types
    user_role = postgresql.ENUM("ADMIN", "EMPLOYEE", "FINANCE", name="user_role", create_type=False)
    project_type = postgresql.ENUM("NEW_WEBSITE", "REDESIGN", "MAINTENANCE", "LANDING_PAGE", "PORTFOLIO", "WEBSHOP", "OTHER", name="project_type", create_type=False)
    project_status = postgresql.ENUM("LEAD", "INTAKE", "IN_PROGRESS", "WAITING_FOR_CLIENT", "REVIEW", "COMPLETED", "MAINTENANCE", "PAUSED", name="project_status", create_type=False)
    priority = postgresql.ENUM("LOW", "MEDIUM", "HIGH", "URGENT", name="priority", create_type=False)
    communication_type = postgresql.ENUM("EMAIL", "CALL", "MEETING", "WHATSAPP", "DM", "INTERNAL", "OTHER", name="communication_type", create_type=False)
    change_request_source = postgresql.ENUM("EMAIL", "CALL", "WEBSITE_FORM", "INTERNAL", name="change_request_source", create_type=False)
    change_request_status = postgresql.ENUM("NEW", "REVIEWED", "PLANNED", "IN_PROGRESS", "WAITING_FOR_FEEDBACK", "DONE", name="change_request_status", create_type=False)
    impact_enum = postgresql.ENUM("SMALL", "MEDIUM", "LARGE", name="impact", create_type=False)
    invoice_status = postgresql.ENUM("DRAFT", "SENT", "PAID", "OVERDUE", name="invoice_status", create_type=False)
    agent_run_status = postgresql.ENUM("PENDING", "RUNNING", "COMPLETED", "FAILED", name="agent_run_status", create_type=False)
    proposal_status = postgresql.ENUM("DRAFT", "READY", "SENT", name="proposal_status", create_type=False)

    # --- users ---
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", user_role, nullable=False, server_default="EMPLOYEE"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- clients ---
    op.create_table(
        "clients",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("company_name", sa.String(255), nullable=False, index=True),
        sa.Column("contact_name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("invoice_details", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # --- project_workspaces ---
    op.create_table(
        "project_workspaces",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("client_id", sa.String(36), sa.ForeignKey("clients.id"), nullable=False, index=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(300), unique=True, nullable=False, index=True),
        sa.Column("project_type", project_type, nullable=False),
        sa.Column("status", project_status, nullable=False, server_default="LEAD"),
        sa.Column("priority", priority, nullable=False, server_default="MEDIUM"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("intake_summary", sa.Text(), nullable=True),
        sa.Column("scope", sa.Text(), nullable=True),
        sa.Column("tech_stack", sa.Text(), nullable=True),
        sa.Column("domain_name", sa.String(255), nullable=True),
        sa.Column("hosting_info", sa.Text(), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("owner_user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("tags", sa.JSON(), server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )

    # --- communication_entries ---
    op.create_table(
        "communication_entries",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("project_id", sa.String(36), sa.ForeignKey("project_workspaces.id"), nullable=False, index=True),
        sa.Column("author_user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("type", communication_type, nullable=False),
        sa.Column("subject", sa.String(500), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("external_sender_name", sa.String(255), nullable=True),
        sa.Column("external_sender_email", sa.String(255), nullable=True),
        sa.Column("is_internal", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("links", sa.JSON(), server_default="[]"),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- change_requests ---
    op.create_table(
        "change_requests",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("project_id", sa.String(36), sa.ForeignKey("project_workspaces.id"), nullable=False, index=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("source_type", change_request_source, nullable=False),
        sa.Column("status", change_request_status, nullable=False, server_default="NEW"),
        sa.Column("impact", impact_enum, nullable=False, server_default="MEDIUM"),
        sa.Column("github_issue_url", sa.String(500), nullable=True),
        sa.Column("github_branch", sa.String(255), nullable=True),
        sa.Column("github_pr_url", sa.String(500), nullable=True),
        sa.Column("created_by_user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("assigned_to_user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("reopened_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- internal_notes ---
    op.create_table(
        "internal_notes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("project_id", sa.String(36), sa.ForeignKey("project_workspaces.id"), nullable=False, index=True),
        sa.Column("change_request_id", sa.String(36), sa.ForeignKey("change_requests.id"), nullable=True),
        sa.Column("author_user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- invoices ---
    op.create_table(
        "invoices",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("client_id", sa.String(36), sa.ForeignKey("clients.id"), nullable=False, index=True),
        sa.Column("project_id", sa.String(36), sa.ForeignKey("project_workspaces.id"), nullable=True, index=True),
        sa.Column("invoice_number", sa.String(20), unique=True, nullable=False, index=True),
        sa.Column("issue_date", sa.Date(), nullable=False),
        sa.Column("service_date", sa.Date(), nullable=True),
        sa.Column("due_date", sa.Date(), nullable=False),
        sa.Column("status", invoice_status, nullable=False, server_default="DRAFT"),
        sa.Column("subtotal", sa.Numeric(10, 2), nullable=False),
        sa.Column("vat_rate", sa.Numeric(5, 2), nullable=False, server_default="21.00"),
        sa.Column("vat_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("total_amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("line_items", sa.JSON(), server_default="[]"),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- proposal_drafts ---
    op.create_table(
        "proposal_drafts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("client_id", sa.String(36), sa.ForeignKey("clients.id"), nullable=False, index=True),
        sa.Column("project_id", sa.String(36), sa.ForeignKey("project_workspaces.id"), nullable=True),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("recipient_name", sa.String(255), nullable=False),
        sa.Column("recipient_email", sa.String(255), nullable=False),
        sa.Column("recipient_company", sa.String(255), nullable=True),
        sa.Column("recipient_address", sa.Text(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("scope", sa.Text(), nullable=True),
        sa.Column("price_label", sa.String(100), nullable=False, server_default="Projectprijs"),
        sa.Column("amount", sa.Numeric(10, 2), nullable=False),
        sa.Column("delivery_time", sa.String(100), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", proposal_status, nullable=False, server_default="DRAFT"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- project_repositories ---
    op.create_table(
        "project_repositories",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("project_id", sa.String(36), sa.ForeignKey("project_workspaces.id"), nullable=False, index=True),
        sa.Column("provider", sa.String(50), nullable=False, server_default="github"),
        sa.Column("repo_name", sa.String(255), nullable=False),
        sa.Column("repo_url", sa.String(500), nullable=False),
        sa.Column("default_branch", sa.String(100), nullable=False, server_default="main"),
        sa.Column("issue_board_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- project_links ---
    op.create_table(
        "project_links",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("project_id", sa.String(36), sa.ForeignKey("project_workspaces.id"), nullable=False, index=True),
        sa.Column("label", sa.String(255), nullable=False),
        sa.Column("url", sa.String(500), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- agent_runs ---
    op.create_table(
        "agent_runs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("project_id", sa.String(36), sa.ForeignKey("project_workspaces.id"), nullable=False, index=True),
        sa.Column("change_request_id", sa.String(36), sa.ForeignKey("change_requests.id"), nullable=True),
        sa.Column("initiated_by_user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("provider", sa.String(50), nullable=False, server_default="internal"),
        sa.Column("status", agent_run_status, nullable=False, server_default="PENDING"),
        sa.Column("prompt_snapshot", sa.Text(), nullable=True),
        sa.Column("output_summary", sa.Text(), nullable=True),
        sa.Column("github_issue_url", sa.String(500), nullable=True),
        sa.Column("pull_request_url", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- business_settings ---
    op.create_table(
        "business_settings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("company_name", sa.String(255), nullable=False),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("kvk_number", sa.String(20), nullable=True),
        sa.Column("vat_number", sa.String(20), nullable=True),
        sa.Column("iban", sa.String(34), nullable=True),
        sa.Column("bank_name", sa.String(100), nullable=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("logo_url", sa.String(500), nullable=True),
        sa.Column("website_url", sa.String(500), nullable=True),
        sa.Column("default_vat_rate", sa.Numeric(5, 2), nullable=False, server_default="21.00"),
        sa.Column("payment_term_days", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("default_quote_valid_days", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("default_price_label", sa.String(100), nullable=False, server_default="Projectprijs"),
        sa.Column("quote_footer_text", sa.Text(), nullable=True),
        sa.Column("invoice_footer_text", sa.Text(), nullable=True),
        sa.Column("default_terms_text", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # --- audit_logs ---
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("actor_user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("entity_type", sa.String(100), nullable=False, index=True),
        sa.Column("entity_id", sa.String(36), nullable=False, index=True),
        sa.Column("action", sa.String(50), nullable=False),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.String(500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("business_settings")
    op.drop_table("agent_runs")
    op.drop_table("project_links")
    op.drop_table("project_repositories")
    op.drop_table("proposal_drafts")
    op.drop_table("invoices")
    op.drop_table("internal_notes")
    op.drop_table("change_requests")
    op.drop_table("communication_entries")
    op.drop_table("project_workspaces")
    op.drop_table("clients")
    op.drop_table("users")

    for name in [
        "proposal_status", "agent_run_status", "invoice_status",
        "impact", "change_request_status", "change_request_source",
        "communication_type", "priority", "project_status",
        "project_type", "user_role",
    ]:
        op.execute(sa.text(f"DROP TYPE IF EXISTS {name}"))
