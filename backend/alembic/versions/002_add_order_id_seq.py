"""add order_id_seq

Revision ID: 002_add_order_id_seq
Revises: 001_initial
Create Date: 2026-09-16 19:20:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_add_order_id_seq'
down_revision = '001_initial'
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.execute("CREATE SEQUENCE IF NOT EXISTS order_id_seq START 1")

def downgrade() -> None:
    op.execute("DROP SEQUENCE IF EXISTS order_id_seq")
