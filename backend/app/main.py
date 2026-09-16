from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from contextlib import asynccontextmanager

from app.database import engine, Base, get_db
from app.routers import public, admin

# Models are imported in routers, but we can ensure they are registered
from app.models import *
import os

storage_path = os.getenv("FILE_STORAGE_PATH", "./backend_storage")
os.makedirs(os.path.join(storage_path, "screenshots"), exist_ok=True)
os.makedirs(os.path.join(storage_path, "qrcodes"), exist_ok=True)
os.makedirs(os.path.join(storage_path, "tickets"), exist_ok=True)

from sqlalchemy import text
from app.database import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure storage directories exist
    os.makedirs(os.getenv("FILE_STORAGE_PATH", "./backend_storage"), exist_ok=True)
    
    try:
        if engine.dialect.name == "postgresql":
            with engine.begin() as conn:
                conn.execute(text("CREATE SEQUENCE IF NOT EXISTS order_id_seq START 1"))
                conn.execute(text("CREATE SEQUENCE IF NOT EXISTS transaction_id_seq START 1"))
    except Exception as e:
        print("Warning: Could not create sequences:", e)

    try:
        from app.database import SessionLocal
        from app.models import Admin
        from app.auth.security import get_password_hash
        
        db = SessionLocal()
        admin_username = "admin"
        admin_password = "ManikantaYouth"
        
        admin_user = db.query(Admin).filter(Admin.username == admin_username).first()
        if admin_user:
            admin_user.password_hash = get_password_hash(admin_password)
            db.commit()
        else:
            new_admin = Admin(username=admin_username, password_hash=get_password_hash(admin_password))
            db.add(new_admin)
            db.commit()
        db.close()
    except Exception as e:
        print("Warning: Could not configure default admin user:", e)

    yield

app = FastAPI(title="Ganapathi Lottery API", lifespan=lifespan)

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://ganeshlottery1.netlify.app",
        os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "Accept"],
)

app.include_router(public.router, prefix="/api", tags=["public"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

# Serve static files (screenshots, qr codes, pdfs) cautiously.
# In a real app, PDFs and screenshots should be behind auth routes.
# But for now, we will serve QRs publicly, and others via specific endpoints.
app.mount("/static/qrcodes", StaticFiles(directory=os.path.join(storage_path, "qrcodes")), name="qrcodes")

@app.get("/")
def read_root():
    return {"message": "Welcome to Ganapathi Lottery API"}
