import psycopg2
conn = psycopg2.connect('postgresql://neondb_owner:npg_Q7eCKmi3XLoE@ep-little-poetry-b5bswx14.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require')
cur = conn.cursor()
cur.execute('SELECT COUNT(*) FROM information_schema.tables')
print('Total tables:', cur.fetchone()[0])
