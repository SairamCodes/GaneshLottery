"""fix sequences and admin

Revision ID: 004_fix_sequences_and_admin
Revises: 003_final_schema
Create Date: 2026-09-16 21:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.orm import Session
from app.auth.security import get_password_hash
from app.models import Admin

# revision identifiers, used by Alembic.
revision: str = '004_fix_sequences_and_admin'
down_revision: Union[str, None] = '003_final_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Ensure sequences exist
    op.execute("CREATE SEQUENCE IF NOT EXISTS order_id_seq START 1")
    op.execute("CREATE SEQUENCE IF NOT EXISTS transaction_id_seq START 1")

    # 2. Seed or update Admin
    bind = op.get_bind()
    session = Session(bind=bind)
    
    import os
    admin_username = "admin"
    admin_password = "ManikantaYouth"
    hashed_password = get_password_hash(admin_password)
    
    admin = session.query(Admin).filter(Admin.username == admin_username).first()
    if admin:
        admin.password_hash = hashed_password
    else:
        new_admin = Admin(username=admin_username, password_hash=hashed_password)
        session.add(new_admin)
    
    session.commit()

def downgrade() -> None:
    op.execute("DROP SEQUENCE IF EXISTS transaction_id_seq")
    op.execute("DROP SEQUENCE IF EXISTS order_id_seq")