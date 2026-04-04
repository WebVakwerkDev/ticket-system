"""add automation and software service fields

Revision ID: 010
Revises: 009
Create Date: 2026-04-02
"""
from alembic import op
import sqlalchemy as sa

revision = "010"
down_revision = "009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Extend project_type enum
    for value in ["WORKFLOW_AUTOMATION", "CUSTOM_SOFTWARE", "AI_INTEGRATION", "AUTOMATION_MAINTENANCE"]:
        op.execute(sa.text(f"ALTER TYPE project_type ADD VALUE IF NOT EXISTS '{value}'"))

    # Extend project_status enum
    for value in ["TESTING", "LIVE"]:
        op.execute(sa.text(f"ALTER TYPE project_status ADD VALUE IF NOT EXISTS '{value}'"))

    # Add new columns to project_workspaces
    op.add_column("project_workspaces", sa.Column("tools_used", sa.JSON(), nullable=True))
    op.add_column("project_workspaces", sa.Column("delivery_form", sa.String(50), nullable=True))
    op.add_column("project_workspaces", sa.Column("recurring_fee", sa.Numeric(10, 2), nullable=True))


def downgrade() -> None:
    op.drop_column("project_workspaces", "recurring_fee")
    op.drop_column("project_workspaces", "delivery_form")
    op.drop_column("project_workspaces", "tools_used")
    # Note: PostgreSQL does not support removing enum values; downgrade leaves enum values in place
