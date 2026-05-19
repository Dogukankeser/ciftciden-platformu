"""
Ürün / İlan (Product) Modeli
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Çiftçinin satışa sunduğu tarımsal ürün ilanlarını tutan tablo.
Kalite derecesi, fotoğraflar ve fiyat bilgilerini içerir.
"""

import uuid
from datetime import date

from sqlalchemy import Date, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Product(BaseModel):
    """Ürün/İlan tablosu."""

    __tablename__ = "products"

    # --- Sahip (Çiftçi) ---
    farmer_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # --- Ürün Bilgileri ---
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True, comment="kayısı, domates, biber, vb."
    )
    variety: Mapped[str | None] = mapped_column(
        String(100), nullable=True, comment="Hacıhaliloğlu, Kabaaşı, Cherry, vb."
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # --- Miktar & Fiyat ---
    quantity_kg: Mapped[float] = mapped_column(Float, nullable=False, comment="Toplam miktar (kg)")
    asking_price_per_kg: Mapped[float] = mapped_column(
        Float, nullable=False, comment="İstenen fiyat (TL/kg)"
    )

    # --- Kalite ---
    quality_grade: Mapped[str] = mapped_column(
        String(20),
        default="Belirsiz",
        nullable=False,
        comment="1. Kalite | 2. Kalite | Belirsiz",
    )

    # --- Görseller ---
    image_urls: Mapped[list[str] | None] = mapped_column(
        ARRAY(String), nullable=True, comment="Ürün fotoğraf URL'leri"
    )

    # --- Konum & Durum ---
    city: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    status: Mapped[str] = mapped_column(
        String(20),
        default="active",
        nullable=False,
        index=True,
        comment="active | sold | expired",
    )
    harvest_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    # --- İlişkiler ---
    farmer = relationship("Farmer", back_populates="products")
    transactions = relationship("Transaction", back_populates="product", lazy="selectin")
    quality_analysis = relationship(
        "QualityAnalysis", back_populates="product", uselist=False, lazy="selectin"
    )
    price_estimations = relationship("PriceEstimation", back_populates="product", lazy="selectin")

    def __repr__(self) -> str:
        return (
            f"<Product(id={self.id}, title='{self.title}', "
            f"category='{self.category}', status='{self.status}')>"
        )
