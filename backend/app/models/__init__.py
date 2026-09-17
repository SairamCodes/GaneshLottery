import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import enum

class PaymentStatus(str, enum.Enum):
    PENDING_PAYMENT = "PENDING_PAYMENT"
    PAYMENT_SUBMITTED = "PAYMENT_SUBMITTED"
    PAYMENT_VERIFIED = "PAYMENT_VERIFIED"
    PAYMENT_REJECTED = "PAYMENT_REJECTED"

class Admin(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, unique=True, index=True, nullable=False) # e.g., GNP-2026-000001
    transaction_id = Column(String, unique=True, index=True, nullable=True) # e.g., TXN-2026-000001
    name = Column(String, nullable=False)
    mobile = Column(String, index=True, nullable=False)
    village = Column(String, nullable=False)
    coupon_count = Column(Integer, nullable=False)
    coupon_price = Column(Integer, default=500, nullable=False)
    total_amount = Column(Integer, nullable=False)
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING_PAYMENT, index=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    tickets_generated = Column(Boolean, default=False)
    
    screenshot = relationship("PaymentScreenshot", back_populates="order", uselist=False)
    tickets = relationship("Ticket", back_populates="order")

class PaymentScreenshot(Base):
    __tablename__ = "payment_screenshots"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), unique=True)
    file_path = Column(String, nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="screenshot")

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    token_number = Column(Integer, unique=True, index=True, nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"))
    ticket_uuid = Column(String, unique=True, default=lambda: str(uuid.uuid4()), index=True)
    pdf_path = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="tickets")

class PaymentQRCode(Base):
    __tablename__ = "payment_qr_codes"

    id = Column(Integer, primary_key=True, index=True)
    file_path = Column(String, nullable=False)
    is_active = Column(Boolean, default=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    uploaded_by = Column(Integer, ForeignKey("admins.id"), nullable=True)

class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, unique=True, index=True, nullable=False)
    value = Column(String, nullable=False)

class AuditLog(Base):
    __tablename__ = 'audit_logs'

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(String, index=True, nullable=False)
    transaction_id = Column(String, nullable=True)
    action = Column(String, nullable=False)
    previous_status = Column(String, nullable=True)
    new_status = Column(String, nullable=False)
    admin_id = Column(Integer, ForeignKey('admins.id'), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    previous_tokens = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())