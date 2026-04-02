"""rename bank_name to account_holder_name in business_settings

Revision ID: 005
Revises: 004
Create Date: 2026-03-26
"""
from alembic import op

revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # No-op: column was already created as account_holder_name in 001_initial_schema
    pass


def downgrade() -> None:
    # No-op: column was already created as account_holder_name in 001_initial_schema
    pass
