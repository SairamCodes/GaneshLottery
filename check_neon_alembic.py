
import os
from dotenv import load_dotenv
load_dotenv('backend/.env')
from sqlalchemy import create_engine, text
engine = create_engine(os.getenv('DATABASE_URL'))
try:
    with engine.connect() as conn:
        res = conn.execute(text('SELECT version_num FROM alembic_version'))
        print('Alembic version in Neon:', res.fetchone())
except Exception as e:
    print('Error:', type(e).__name__, e)

