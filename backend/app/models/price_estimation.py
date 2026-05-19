"""
Fiyat Tahmini (Price Estimation) Modeli
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
AI Adil Fiyat Motoru'nun ürettiği tahmin sonuçlarını saklayan tablo.
Her tahmin bir güven aralığı (min-max) ve kullanılan faktörleri içerir.
"""

import uuid

from sqlalchemy import Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class PriceEstimation(BaseModel):
    """AI adil fiyat tahmin sonuçları tablosu."""

    __tablename__ = "price_estimations"

    # --- Ürün İlişkisi ---
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # --- Tahmin Parametreleri ---
    category: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="Ürün kategorisi"
    )
    city: Mapped[str] = mapped_column(
        String(50), nullable=False, comment="Bölge/İl"
    )

    # --- Fiyat Güven Aralığı ---
    estimated_min_price: Mapped[float] = mapped_column(
        Float, nullable=False, comment="Tahmini alt fiyat (TL/kg)"
    )
    estimated_max_price: Mapped[float] = mapped_column(
        Float, nullable=False, comment="Tahmini üst fiyat (TL/kg)"
    )
    confidence_level: Mapped[float] = mapped_column(
        Float, nullable=False, comment="Model güven seviyesi (0.0 - 1.0)"
    )

    # --- Kullanılan Faktörler (JSON) ---
    factors: Mapped[dict | None] = mapped_column(
        JSON,
        nullable=True,
        comment="hal_fiyati, arz_talep, enflasyon, mevsim vb.",
    )

    # --- Model Bilgisi ---
    model_version: Mapped[str] = mapped_column(
        String(20), default="v1.0", nullable=False, comment="Kullanılan model versiyonu"
    )

    # --- İlişkiler ---
    product = relationship("Product", back_populates="price_estimations")

    def __repr__(self) -> str:
        return (
            f"<PriceEstimation(product_id={self.product_id}, "
            f"range={self.estimated_min_price}-{self.estimated_max_price} TL/kg, "
            f"confidence={self.confidence_level:.2f})>"
        )
