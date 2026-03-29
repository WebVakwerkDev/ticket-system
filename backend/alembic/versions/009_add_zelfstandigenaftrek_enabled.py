"""Add kor_enabled and zelfstandigenaftrek_enabled toggles to tax_year_settings

Revision ID: 009
Revises: 008
Create Date: 2026-03-29
"""
from alembic import op
import sqlalchemy as sa

revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        'tax_year_settings',
        sa.Column('kor_enabled', sa.Boolean(), nullable=False, server_default='false'),
    )
    op.add_column(
        'tax_year_settings',
        sa.Column('zelfstandigenaftrek_enabled', sa.Boolean(), nullable=False, server_default='false'),
    )


def downgrade() -> None:
    op.drop_column('tax_year_settings', 'zelfstandigenaftrek_enabled')
    op.drop_column('tax_year_settings', 'kor_enabled')
