"""
İşlem (Transaction) Modeli
~~~~~~~~~~~~~~~~~~~~~~~~~~
Çiftçi ile tüccar arasındaki alım-satım işlemlerini takip eden tablo.
Fiyat, miktar, ödeme durumu ve işlem statüsü bilgilerini içerir.
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Transaction(BaseModel):
    """Alım-satım işlem tablosu."""

    __tablename__ = "transactions"

    # --- Taraflar ---
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), nullable=False, index=True
    )
    merchant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("merchants.id", ondelete="CASCADE"), nullable=False, index=True
    )
    farmer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # --- Fiyat & Miktar ---
    agreed_price_per_kg: Mapped[float] = mapped_column(
        Float, nullable=False, comment="Anlaşılan birim fiyat (TL/kg)"
    )
    quantity_kg: Mapped[float] = mapped_column(
        Float, nullable=False, comment="Satılan miktar (kg)"
    )
    total_amount: Mapped[float] = mapped_column(
        Float, nullable=False, comment="Toplam tutar (TL)"
    )

    # --- İşlem Durumu ---
    status: Mapped[str] = mapped_column(
        String(20),
        default="pending",
        nullable=False,
        index=True,
        comment="pending | confirmed | shipped | completed | cancelled | disputed",
    )

    # --- Ödeme Durumu ---
    payment_status: Mapped[str] = mapped_column(
        String(20),
        default="awaiting",
        nullable=False,
        comment="awaiting | paid | overdue",
    )
    payment_due_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    payment_completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # --- İlişkiler ---
    product = relationship("Product", back_populates="transactions")
    merchant = relationship("Merchant", back_populates="transactions")
    farmer = relationship("Farmer", back_populates="transactions")
    review = relationship("MerchantReview", back_populates="transaction", uselist=False, lazy="selectin")

    def __repr__(self) -> str:
        return (
            f"<Transaction(id={self.id}, status='{self.status}', "
            f"total={self.total_amount} TL, payment='{self.payment_status}')>"
        )
