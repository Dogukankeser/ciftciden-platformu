"""
Tüccar Değerlendirmesi (Merchant Review) Modeli
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Çiftçilerin tüccarları değerlendirdiği tablo.
Güven Skoru algoritmasının %20'lik çiftçi değerlendirme
parametresine kaynak oluşturur.
"""

import uuid

from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class MerchantReview(BaseModel):
    """Çiftçi → Tüccar değerlendirme tablosu."""

    __tablename__ = "merchant_reviews"

    # --- Taraflar ---
    merchant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("merchants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    farmer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("farmers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    transaction_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("transactions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # Her işlem için tek değerlendirme
    )

    # --- Değerlendirme ---
    rating: Mapped[int] = mapped_column(
        Integer, nullable=False, comment="1-5 arası puan"
    )
    comment: Mapped[str | None] = mapped_column(
        Text, nullable=True, comment="Çiftçi yorumu"
    )

    # --- İlişkiler ---
    merchant = relationship("Merchant", back_populates="reviews_received")
    farmer = relationship("Farmer", back_populates="reviews_given")
    transaction = relationship("Transaction", back_populates="review")

    def __repr__(self) -> str:
        return (
            f"<MerchantReview(merchant_id={self.merchant_id}, "
            f"farmer_id={self.farmer_id}, rating={self.rating})>"
        )
