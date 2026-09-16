from pydantic import BaseModel, Field, constr, validator
from typing import Optional, List
from datetime import datetime
from app.models import PaymentStatus

class OrderCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    mobile: str = Field(..., pattern=r"^[6-9]\d{9}$")
    village: str = Field(..., min_length=1, max_length=100)
    coupon_count: int = Field(..., ge=1, le=100)

class OrderResponse(BaseModel):
    order_id: str
    transaction_id: Optional[str] = None
    name: str
    mobile: str
    village: str
    coupon_count: int
    coupon_price: int
    total_amount: int
    payment_status: PaymentStatus
    created_at: datetime

    class Config:
        from_attributes = True

class TicketResponse(BaseModel):
    token_number: int
    order_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class OrderStatusResponse(BaseModel):
    order_id: str
    transaction_id: Optional[str] = None
    name: str
    mobile: str
    village: str
    coupon_count: int
    coupon_price: int
    total_amount: int
    payment_status: PaymentStatus
    rejection_reason: Optional[str] = None
    created_at: datetime
    submitted_at: Optional[datetime] = None
    verified_at: Optional[datetime] = None
    tickets: List[TicketResponse] = []

    class Config:
        from_attributes = True

class AdminLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class QRCodeResponse(BaseModel):
    url: str

class RejectRequest(BaseModel):
    reason: str

class VerifyPaymentRequest(BaseModel):
    token_numbers: List[int]

class PaymentStatusRequest(BaseModel):
    transaction_id: Optional[str] = None
    mobile: Optional[str] = None
