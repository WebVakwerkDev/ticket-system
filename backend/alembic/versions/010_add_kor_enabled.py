"""Add kor_enabled toggle to tax_year_settings

Revision ID: 010
Revises: 009
Create Date: 2026-03-29
"""
from alembic import op
import sqlalchemy as sa

revision = '010'
down_revision = '009'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'tax_year_settings',
        sa.Column('kor_enabled', sa.Boolean(), nullable=False, server_default='false'),
    )


def downgrade() -> None:
    op.drop_column('tax_year_settings', 'kor_enabled')
