
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()
class Admin(Base):
    __tablename__ = 'admins'
    id = Column(Integer, primary_key=True)
    username = Column(String)

engine = create_engine('sqlite:///:memory:')
Session = sessionmaker(bind=engine)
session = Session()

try:
    admin = session.query(Admin).first()
    print('Admin:', admin)
except Exception as e:
    print('Error type:', type(e).__name__)
    print('Error msg:', e)

