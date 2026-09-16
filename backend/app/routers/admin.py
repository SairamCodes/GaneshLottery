from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from sqlalchemy import text, desc
from app.database import get_db
from app.models import Admin, Order, PaymentStatus, Ticket, PaymentQRCode
from app.schemas import AdminLogin, Token, RejectRequest
from app.auth import verify_password, create_access_token, get_current_admin
import os
import shutil
import uuid
from datetime import datetime

router = APIRouter()

@router.post("/login", response_model=Token)
def login(form_data: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.username == form_data.username).first()
    if not admin or not verify_password(form_data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": admin.username})
    return {"access_token": access_token, "token_type": "bearer"}

from sqlalchemy import func

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_admin: Admin = Depends(get_current_admin)):
    total_orders = db.query(Order).count()
    pending = db.query(Order).filter(Order.payment_status == PaymentStatus.PENDING_PAYMENT).count()
    submitted = db.query(Order).filter(Order.payment_status == PaymentStatus.PAYMENT_SUBMITTED).count()
    verified = db.query(Order).filter(Order.payment_status == PaymentStatus.PAYMENT_VERIFIED).count()
    rejected = db.query(Order).filter(Order.payment_status == PaymentStatus.PAYMENT_REJECTED).count()
    
    verified_orders = db.query(Order).filter(Order.payment_status == PaymentStatus.PAYMENT_VERIFIED)
    total_coupons_sold = sum(o.coupon_count for o in verified_orders)
    total_verified_amount = sum(o.total_amount for o in verified_orders)
    
    return {
        "total_orders": total_orders,
        "pending_payments": pending,
        "payments_submitted": submitted,
        "verified_payments": verified,
        "rejected_payments": rejected,
        "total_coupons_sold": total_coupons_sold,
        "total_verified_amount": total_verified_amount
    }

@router.get("/orders")
def get_orders(
    status: PaymentStatus = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    query = db.query(Order)
    if status:
        query = query.filter(Order.payment_status == status)
    orders = query.order_by(desc(Order.created_at)).offset(skip).limit(limit).all()
    
    # Format output for admin (including screenshot paths)
    results = []
    for o in orders:
        screenshot_url = None
        if hasattr(o, 'screenshot') and o.screenshot:
            filename = os.path.basename(o.screenshot.file_path)
            # Assuming we serve them at /static/screenshots/ or similar
            screenshot_url = f"/api/admin/orders/{o.order_id}/screenshot" # We need an endpoint for this
            
        results.append({
            "id": o.id,
            "order_id": o.order_id,
            "transaction_id": o.transaction_id,
            "name": o.name,
            "mobile": o.mobile,
            "village": o.village,
            "coupon_count": o.coupon_count,
            "total_amount": o.total_amount,
            "payment_status": o.payment_status,
            "created_at": o.created_at,
            "submitted_at": o.submitted_at,
            "verified_at": o.verified_at,
            "screenshot_url": screenshot_url
        })
    return results

from fastapi.responses import FileResponse

@router.get("/orders/{order_id}/screenshot")
def get_order_screenshot(
    order_id: str,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order or not order.screenshot:
        raise HTTPException(status_code=404, detail="Screenshot not found")
    return FileResponse(order.screenshot.file_path)

from app.schemas import VerifyPaymentRequest

@router.post("/orders/{order_id}/verify")
def verify_payment(
    order_id: str,
    req: VerifyPaymentRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    # Retrieve order with row-level locking
    order = db.query(Order).with_for_update().filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.payment_status == PaymentStatus.PAYMENT_VERIFIED:
        raise HTTPException(status_code=400, detail="Payment is already verified")
        
    if order.payment_status != PaymentStatus.PAYMENT_SUBMITTED:
        raise HTTPException(status_code=400, detail="Payment must be submitted before verification")

    if not req.token_numbers or len(req.token_numbers) != order.coupon_count:
        raise HTTPException(status_code=400, detail=f"Please provide exactly {order.coupon_count} token numbers.")

    # Check for duplicates across all submitted tokens
    for token in req.token_numbers:
        existing = db.query(Ticket).filter(Ticket.token_number == token).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Token number {token} is already assigned. Please enter a different token number.")

    import logging
    logger = logging.getLogger(__name__)

    try:
        # Generate Tickets manually based on provided tokens
        tickets = []
        for token in req.token_numbers:
            ticket = Ticket(
                token_number=token,
                order_id=order.id
            )
            db.add(ticket)
            tickets.append(ticket)
            
        order.payment_status = PaymentStatus.PAYMENT_VERIFIED
        order.verified_at = datetime.utcnow()
        order.tickets_generated = True
        
        db.flush() # Flush to get ticket IDs if needed, but DO NOT commit yet
        
        # Generate PDF
        from app.pdf.generator import generate_ticket_pdf
        tickets_data = []
        for t in tickets:
            tickets_data.append({
                "name": order.name,
                "village": order.village,
                "token_number": t.token_number,
                "order_id": order.order_id,
                "date": order.verified_at.strftime("%Y-%m-%d %H:%M:%S")
            })
            
        storage_path = os.getenv("FILE_STORAGE_PATH", "./backend_storage")
        pdf_dir = os.path.join(storage_path, "tickets")
        os.makedirs(pdf_dir, exist_ok=True)
        pdf_filename = f"{order.transaction_id or order.order_id}.pdf"
        pdf_path = os.path.join(pdf_dir, pdf_filename)
        
        generate_ticket_pdf(tickets_data, pdf_path)
        
        # Update tickets with pdf_path
        for t in tickets:
            t.pdf_path = pdf_path
            
        db.commit()
        return {"detail": "Payment verified and tickets generated"}
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error during payment verification: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/orders/{order_id}/reject")
def reject_payment(
    order_id: str,
    reject_data: RejectRequest,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    if order.payment_status == PaymentStatus.PAYMENT_VERIFIED:
        raise HTTPException(status_code=400, detail="Cannot reject an already verified order")

    order.payment_status = PaymentStatus.PAYMENT_REJECTED
    order.rejection_reason = reject_data.reason
    db.commit()
    return {"detail": "Payment rejected"}

@router.post("/payment-qr")
def upload_payment_qr(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type")

    filename = f"qr_{uuid.uuid4()}{ext}"
    storage_path = os.getenv("FILE_STORAGE_PATH", "./backend_storage")
    qr_dir = os.path.join(storage_path, "qrcodes")
    os.makedirs(qr_dir, exist_ok=True)
    file_path = os.path.join(qr_dir, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Deactivate old QRs
    db.query(PaymentQRCode).update({PaymentQRCode.is_active: False})
    
    new_qr = PaymentQRCode(
        file_path=file_path,
        is_active=True,
        uploaded_by=current_admin.id
    )
    db.add(new_qr)
    db.commit()
    
    return {"detail": "Payment QR code updated successfully"}

import csv
import io
from fastapi.responses import StreamingResponse

@router.get("/export")
def export_verified_sales(
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    orders = db.query(Order).filter(Order.payment_status == PaymentStatus.PAYMENT_VERIFIED).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Order ID", "Transaction ID", "Name", "Mobile", "Village", "Coupon Count", 
        "Total Amount", "Payment Status", "Token Numbers", 
        "Created At", "Verified At"
    ])
    
    for order in orders:
        token_nums = ", ".join([str(t.token_number) for t in order.tickets])
        writer.writerow([
            order.order_id,
            order.transaction_id or "",
            order.name,
            order.mobile,
            order.village,
            order.coupon_count,
            order.total_amount,
            order.payment_status,
            token_nums,
            order.created_at.strftime("%Y-%m-%d %H:%M:%S") if order.created_at else "",
            order.verified_at.strftime("%Y-%m-%d %H:%M:%S") if order.verified_at else ""
        ])
        
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=ganapathi_verified_sales.csv"}
    )
