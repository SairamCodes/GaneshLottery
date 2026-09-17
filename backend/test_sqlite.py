import sqlite3
conn = sqlite3.connect('test.db')
cur = conn.cursor()
cur.execute('SELECT * FROM admins')
print(cur.fetchall())
