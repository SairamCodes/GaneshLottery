
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=['argon2', 'bcrypt'], deprecated='auto')
h = pwd_context.hash('ManikantaYouth')
v = pwd_context.verify('ManikantaYouth', h)
print('Hash length:', len(h))
print('Valid:', v)

