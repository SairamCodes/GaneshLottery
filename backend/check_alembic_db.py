
from app.database import DATABASE_URL
print('Local Alembic is using DATABASE_URL that contains:', 'localhost' if 'localhost' in DATABASE_URL else 'db:5432' if 'db:5432' in DATABASE_URL else 'neon.tech' if 'neon.tech' in DATABASE_URL else 'unknown')

