import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import PaymentScreenshot, PaymentQRCode, Ticket
from app.storage.provider import storage_provider
import mimetypes

def run_migration():
    db = SessionLocal()
    try:
        # Migrate Payment Screenshots
        screenshots = db.query(PaymentScreenshot).all()
        for s in screenshots:
            if s.file_path and not s.file_path.startswith("screenshots/"):
                print(f"Checking old screenshot: {s.file_path}")
                if os.path.exists(s.file_path):
                    print("Found file on disk! Migrating...")
                    ext = os.path.splitext(s.file_path)[1]
                    new_key = f"screenshots/old_{s.id}{ext}"
                    with open(s.file_path, "rb") as f:
                        storage_provider.upload_file(f, new_key)
                    s.file_path = new_key
                else:
                    print(f"File {s.file_path} no longer exists. Could not recover.")
                    # We might update the path to point to a missing key, or keep the old path 
                    # which will fail nicely when requested.
        
        # Migrate QR Codes
        qrs = db.query(PaymentQRCode).all()
        for q in qrs:
            if q.file_path and not q.file_path.startswith("qrcodes/"):
                print(f"Checking old QR: {q.file_path}")
                if os.path.exists(q.file_path):
                    print("Found file on disk! Migrating...")
                    ext = os.path.splitext(q.file_path)[1]
                    new_key = f"qrcodes/old_{q.id}{ext}"
                    with open(q.file_path, "rb") as f:
                        storage_provider.upload_file(f, new_key)
                    q.file_path = new_key
                else:
                    print(f"File {q.file_path} no longer exists.")

        # Migrate Tickets
        tickets = db.query(Ticket).all()
        for t in tickets:
            if t.pdf_path and not t.pdf_path.startswith("tickets/"):
                print(f"Checking old ticket PDF: {t.pdf_path}")
                if os.path.exists(t.pdf_path):
                    print("Found file on disk! Migrating...")
                    ext = os.path.splitext(t.pdf_path)[1]
                    new_key = f"tickets/old_{t.id}{ext}"
                    with open(t.pdf_path, "rb") as f:
                        storage_provider.upload_file(f, new_key, "application/pdf")
                    t.pdf_path = new_key
                else:
                    print(f"File {t.pdf_path} no longer exists.")
                    
        db.commit()
        print("Migration complete.")
    except Exception as e:
        db.rollback()
        print(f"Migration error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_migration()
