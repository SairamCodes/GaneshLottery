"""final schema

Revision ID: 003_final_schema
Revises: 002_add_order_id_seq
Create Date: 2026-09-16 20:43:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_final_schema'
down_revision: Union[str, None] = '002_add_order_id_seq'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add transaction_id to orders
    op.add_column('orders', sa.Column('transaction_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_orders_transaction_id'), 'orders', ['transaction_id'], unique=True)
    
    # Rename ticket_number to token_number in tickets
    op.alter_column('tickets', 'ticket_number', new_column_name='token_number')
    
    # Re-create index
    op.drop_index('ix_tickets_ticket_number', table_name='tickets')
    op.create_index(op.f('ix_tickets_token_number'), 'tickets', ['token_number'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_tickets_token_number'), table_name='tickets')
    op.create_index('ix_tickets_ticket_number', 'tickets', ['token_number'], unique=True)
    op.alter_column('tickets', 'token_number', new_column_name='ticket_number')
    
    op.drop_index(op.f('ix_orders_transaction_id'), table_name='orders')
    op.drop_column('orders', 'transaction_id')
