import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from app.database import engine
from app.models import AuditLog

print("Creating audit_logs table...")
AuditLog.__table__.create(engine, checkfirst=True)
print("Table created.")
