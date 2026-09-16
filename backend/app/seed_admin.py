import os
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import Admin, Base
from app.auth.security import get_password_hash
from dotenv import load_dotenv

def seed_admin():
    load_dotenv(dotenv_path=".env")
    
    username = os.getenv("ADMIN_USERNAME")
    password = os.getenv("ADMIN_PASSWORD")
    
    if not username or not password:
        print("Error: ADMIN_USERNAME and ADMIN_PASSWORD must be set in .env")
        return

    # Ensure tables exist just in case
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        admin = db.query(Admin).filter(Admin.username == username).first()
        hashed_password = get_password_hash(password)
        if admin:
            admin.password_hash = hashed_password
            db.commit()
            print(f"Admin with username '{username}' already exists. Password successfully reset.")
        else:
            new_admin = Admin(username=username, password_hash=hashed_password)
            db.add(new_admin)
            db.commit()
            print(f"Successfully created admin user: {username}")
    except Exception as e:
        print(f"Failed to create admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
