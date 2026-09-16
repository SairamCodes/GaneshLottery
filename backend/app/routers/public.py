from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Order, PaymentStatus, PaymentScreenshot, PaymentQRCode
from app.schemas import OrderCreate, OrderResponse, OrderStatusResponse, PaymentStatusRequest
import uuid
import os
import shutil
from datetime import datetime
from typing import List

router = APIRouter()

from sqlalchemy import text

def generate_order_id(db: Session) -> str:
    from app.database import engine
    if engine.dialect.name == "postgresql":
        result = db.execute(text("SELECT nextval('order_id_seq')"))
        seq_val = result.scalar()
    else:
        count = db.query(Order).count()
        seq_val = count + 1
    return f"GNP-2026-{seq_val:06d}"

def generate_transaction_id(db: Session) -> str:
    from app.database import engine
    if engine.dialect.name == "postgresql":
        result = db.execute(text("SELECT nextval('transaction_id_seq')"))
        seq_val = result.scalar()
    else:
        # fallback for sqlite
        result = db.execute(text("SELECT COUNT(id) FROM orders WHERE transaction_id IS NOT NULL"))
        seq_val = result.scalar() + 1
    return f"TXN-2026-{seq_val:06d}"

import logging
logger = logging.getLogger(__name__)

@router.post("/orders", response_model=OrderResponse)
def create_order(order_data: OrderCreate, db: Session = Depends(get_db)):
    try:
        # Calculate amount on backend
        coupon_price = 500
        total_amount = order_data.coupon_count * coupon_price
        
        order_id = generate_order_id(db)
        
        new_order = Order(
            order_id=order_id,
            name=order_data.name,
            mobile=order_data.mobile,
            village=order_data.village,
            coupon_count=order_data.coupon_count,
            coupon_price=coupon_price,
            total_amount=total_amount,
            payment_status=PaymentStatus.PENDING_PAYMENT
        )
        db.add(new_order)
        db.commit()
        db.refresh(new_order)
        return new_order
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating order: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/orders/{order_id}", response_model=OrderResponse)
def get_order(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.post("/orders/{order_id}/payment-screenshot")
def upload_screenshot(order_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order.payment_status not in [PaymentStatus.PENDING_PAYMENT, PaymentStatus.PAYMENT_REJECTED]:
        raise HTTPException(status_code=400, detail="Cannot upload screenshot for this order status")

    # Validate file extension
    allowed_extensions = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type")

    # Secure filename
    filename = f"{uuid.uuid4()}{ext}"
    storage_path = os.getenv("FILE_STORAGE_PATH", "./backend_storage")
    screenshot_dir = os.path.join(storage_path, "screenshots")
    os.makedirs(screenshot_dir, exist_ok=True)
    file_path = os.path.join(screenshot_dir, filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Save to db
    screenshot = db.query(PaymentScreenshot).filter(PaymentScreenshot.order_id == order.id).first()
    if screenshot:
        screenshot.file_path = file_path
        screenshot.uploaded_at = datetime.utcnow()
    else:
        screenshot = PaymentScreenshot(order_id=order.id, file_path=file_path)
        db.add(screenshot)
    
    db.commit()
    return {"detail": "Screenshot uploaded successfully"}

@router.post("/orders/{order_id}/submit-payment")
def submit_payment(order_id: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    screenshot = db.query(PaymentScreenshot).filter(PaymentScreenshot.order_id == order.id).first()
    if not screenshot:
        raise HTTPException(status_code=400, detail="Payment screenshot is required")
        
    if not order.transaction_id:
        order.transaction_id = generate_transaction_id(db)
        
    order.payment_status = PaymentStatus.PAYMENT_SUBMITTED
    order.submitted_at = datetime.utcnow()
    order.rejection_reason = None
    db.commit()
    return {"detail": "Payment submitted successfully", "transaction_id": order.transaction_id}

@router.post("/payment-status", response_model=List[OrderStatusResponse])
def check_payment_status(req: PaymentStatusRequest, db: Session = Depends(get_db)):
    if req.transaction_id and req.mobile:
        raise HTTPException(status_code=400, detail="Please provide either transaction ID or mobile number, not both")
        
    if req.transaction_id:
        order = db.query(Order).filter(Order.transaction_id == req.transaction_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="No transaction found for this Transaction ID.")
        return [order]
    elif req.mobile:
        orders = db.query(Order).filter(Order.mobile == req.mobile).order_by(Order.created_at.desc()).all()
        if not orders:
            raise HTTPException(status_code=404, detail="No transactions found for this Mobile Number.")
        return orders
    else:
        raise HTTPException(status_code=400, detail="Please provide transaction ID or mobile number")

@router.get("/payment-qr")
def get_active_qr(db: Session = Depends(get_db)):
    qr = db.query(PaymentQRCode).filter(PaymentQRCode.is_active == True).first()
    if not qr:
        return {"url": None}
    
    # Just return filename for frontend to construct URL
    filename = os.path.basename(qr.file_path)
    return {"url": f"/static/qrcodes/{filename}"}

from fastapi.responses import FileResponse

@router.get("/orders/{order_id}/tickets/download")
def download_tickets(
    order_id: str, 
    transaction_id: str = None, 
    mobile: str = None, 
    db: Session = Depends(get_db)
):
    query = db.query(Order).filter(Order.order_id == order_id)
    if transaction_id:
        query = query.filter(Order.transaction_id == transaction_id)
    elif mobile:
        query = query.filter(Order.mobile == mobile)
    else:
        raise HTTPException(status_code=400, detail="Must provide transaction_id or mobile to download tickets")
        
    order = query.first()
    
    if not order:
        raise HTTPException(status_code=404, detail="Order not found or unauthorized")
        
    if order.payment_status != PaymentStatus.PAYMENT_VERIFIED:
        raise HTTPException(status_code=400, detail="Tickets not generated yet")
        
    if not order.tickets or not order.tickets[0].pdf_path:
        raise HTTPException(status_code=404, detail="PDF not found")
        
    return FileResponse(order.tickets[0].pdf_path, filename=f"Ganapathi_Lottery_{order.transaction_id or order_id}.pdf")
