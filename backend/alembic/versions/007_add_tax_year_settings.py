"""Add tax_year_settings table for Dutch eenmanszaak tax configuration per year

Revision ID: 007
Revises: 006
Create Date: 2026-03-26
"""
from alembic import op
import sqlalchemy as sa

revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'tax_year_settings',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('zelfstandigenaftrek', sa.Numeric(10, 2), nullable=False, server_default='1200.00'),
        sa.Column('startersaftrek_enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('startersaftrek', sa.Numeric(10, 2), nullable=False, server_default='2123.00'),
        sa.Column('mkb_vrijstelling_rate', sa.Numeric(5, 2), nullable=False, server_default='12.70'),
        sa.Column('zvw_rate', sa.Numeric(5, 2), nullable=False, server_default='5.32'),
        sa.Column('zvw_max_inkomen', sa.Numeric(10, 2), nullable=False, server_default='71628.00'),
        sa.Column('ib_rate_1', sa.Numeric(5, 2), nullable=False, server_default='35.82'),
        sa.Column('ib_rate_2', sa.Numeric(5, 2), nullable=False, server_default='37.48'),
        sa.Column('ib_rate_3', sa.Numeric(5, 2), nullable=False, server_default='49.50'),
        sa.Column('ib_bracket_1', sa.Numeric(10, 2), nullable=False, server_default='38441.00'),
        sa.Column('ib_bracket_2', sa.Numeric(10, 2), nullable=False, server_default='76817.00'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.UniqueConstraint('year', name='uq_tax_year_settings_year'),
    )
    op.create_index('ix_tax_year_settings_year', 'tax_year_settings', ['year'])


def downgrade() -> None:
    op.drop_index('ix_tax_year_settings_year', table_name='tax_year_settings')
    op.drop_table('tax_year_settings')
