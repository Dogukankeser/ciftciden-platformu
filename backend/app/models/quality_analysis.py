"""
Kalite Analizi (Quality Analysis) Modeli
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
AI Görsel Kalite Analizi modülünün sonuçlarını saklayan tablo.
Renk, boyut ve kusur analizleri JSON formatında tutulur.
Confidence < %85 ise fallback mekanizması tetiklenir.
"""

import uuid

from sqlalchemy import Boolean, Float, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class QualityAnalysis(BaseModel):
    """AI görsel kalite analiz sonuçları tablosu."""

    __tablename__ = "quality_analyses"

    # --- Ürün İlişkisi ---
    product_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # Her ürün için tek analiz
        index=True,
    )

    # --- Analiz Edilen Görsel ---
    image_url: Mapped[str] = mapped_column(String(500), nullable=False)

    # --- AI Sonuçları ---
    predicted_grade: Mapped[str] = mapped_column(
        String(20), nullable=False, comment="1. Kalite | 2. Kalite"
    )
    confidence_score: Mapped[float] = mapped_column(
        Float, nullable=False, comment="Model güven skoru (0.0 - 1.0)"
    )

    # --- Detaylı Analizler (JSON) ---
    color_analysis: Mapped[dict | None] = mapped_column(
        JSON, nullable=True, comment="HSV renk analiz detayları"
    )
    size_analysis: Mapped[dict | None] = mapped_column(
        JSON, nullable=True, comment="Boyut tahmini detayları"
    )
    defect_analysis: Mapped[dict | None] = mapped_column(
        JSON, nullable=True, comment="Kusur tespiti detayları (leke, çürük)"
    )

    # --- Fallback Mekanizması ---
    needs_rescan: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        comment="Confidence < 0.85 ise True",
    )
    fallback_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
        comment="Düşük güven skorunda kullanıcıya gösterilecek mesaj",
    )

    # --- İlişkiler ---
    product = relationship("Product", back_populates="quality_analysis")

    def __repr__(self) -> str:
        return (
            f"<QualityAnalysis(product_id={self.product_id}, "
            f"grade='{self.predicted_grade}', confidence={self.confidence_score:.2f})>"
        )
