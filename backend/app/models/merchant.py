"""
Tüccar (Merchant) Modeli
~~~~~~~~~~~~~~~~~~~~~~~~
Alıcı/tüccar bilgilerini tutan tablo. Güven Skoru, ticaret sicil
doğrulaması ve işlem istatistikleri dahil.
"""

from sqlalchemy import Boolean, Float, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Merchant(BaseModel):
    """Tüccar/Alıcı tablosu."""

    __tablename__ = "merchants"

    # --- Şirket Bilgileri ---
    company_name: Mapped[str] = mapped_column(String(250), nullable=False)
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)

    # --- Konum ---
    city: Mapped[str] = mapped_column(String(50), nullable=False, index=True)

    # --- Ticaret Sicil ve Resmi Belgeler ---
    trade_registry_no: Mapped[str | None] = mapped_column(
        String(50), nullable=True, comment="Ticaret Sicil Numarası"
    )
    tax_id: Mapped[str | None] = mapped_column(
        String(11), nullable=True, comment="Vergi Kimlik Numarası (VKN/TCKN)"
    )
    nace_code: Mapped[str | None] = mapped_column(
        String(10), nullable=True, comment="NACE Faaliyet Kodu"
    )
    tax_plate_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    registry_gazette_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    signature_circular_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    is_registry_verified: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False, comment="Tüm belgeler doğrulanmış mı"
    )

    # --- Güven Skoru (AI tarafından hesaplanır) ---
    trust_score: Mapped[float] = mapped_column(
        Float, default=5.0, nullable=False, comment="0-10 arası güven skoru"
    )
    risk_label: Mapped[str] = mapped_column(
        String(20),
        default="normal",
        nullable=False,
        comment="normal | warning | restricted",
    )

    # --- İşlem İstatistikleri ---
    total_transaction_volume: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False, comment="Toplam işlem hacmi (TL)"
    )
    successful_transactions: Mapped[int] = mapped_column(
        Integer, default=0, nullable=False, comment="Başarılı işlem sayısı"
    )
    avg_payment_speed_days: Mapped[float] = mapped_column(
        Float, default=0.0, nullable=False, comment="Ortalama ödeme hızı (gün)"
    )

    # --- Profil ---
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # --- İlişkiler ---
    transactions = relationship("Transaction", back_populates="merchant", lazy="selectin")
    reviews_received = relationship("MerchantReview", back_populates="merchant", lazy="selectin")

    def __repr__(self) -> str:
        return (
            f"<Merchant(id={self.id}, company='{self.company_name}', "
            f"trust_score={self.trust_score}, risk='{self.risk_label}')>"
        )
