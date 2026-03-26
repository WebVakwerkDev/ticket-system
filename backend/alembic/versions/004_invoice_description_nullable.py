"""make invoice description nullable

Revision ID: 004
Revises: 003
Create Date: 2026-03-26
"""
from alembic import op

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("invoices") as batch_op:
        batch_op.alter_column("description", nullable=True)


def downgrade() -> None:
    with op.batch_alter_table("invoices") as batch_op:
        batch_op.alter_column("description", nullable=False)
