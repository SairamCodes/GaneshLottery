
from sqlalchemy import create_engine, MetaData
engine = create_engine('postgresql://neondb_owner:npg_Q7eCKmi3XLoE@ep-little-poetry-b5bswx14.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require')
metadata = MetaData()
metadata.reflect(bind=engine)
print('Tables:', metadata.tables.keys())

