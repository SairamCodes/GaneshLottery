
import os
import sys
import psycopg2
from passlib.context import CryptContext

DATABASE_URL = 'postgresql://neondb_owner:npg_Q7eCKmi3XLoE@ep-little-poetry-b5bswx14.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

pwd_context = CryptContext(schemes=['argon2', 'bcrypt'], deprecated='auto')

try:
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    cur.execute('SELECT count(*) FROM admins;')
    count = cur.fetchone()[0]
    print(f'Admin records count: {count}')
    
    if count > 0:
        cur.execute('SELECT id, username, password_hash FROM admins;')
        admins = cur.fetchall()
        for admin in admins:
            print(f'ID: {admin[0]}, Username: {admin[1]}')
            is_valid = pwd_context.verify('ManikantaYouth', admin[2])
            print(f'Password valid for ManikantaYouth: {is_valid}')
            
            # Check length of hash
            print(f'Hash length: {len(admin[2])}')
            # Print first 10 chars of hash to verify format
            print(f'Hash format: {admin[2][:15]}...')
            
except Exception as e:
    print(f'Error: {e}')
