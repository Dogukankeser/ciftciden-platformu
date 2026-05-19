"""
Çiftçi (Farmer) Modeli
~~~~~~~~~~~~~~~~~~~~~~
Üretici bilgilerini tutan tablo. Kimlik doğrulama, konum ve
yetiştirilen ürün bilgilerini içerir.
"""

from sqlalchemy import Boolean, Float, String, Text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import BaseModel


class Farmer(BaseModel):
    """Çiftçi/Üretici tablosu."""

    __tablename__ = "farmers"

    # --- Kimlik Bilgileri ---
    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    tc_kimlik_masked: Mapped[str | None] = mapped_column(
        String(14), nullable=True, comment="Maskeli TC: ***1234***"
    )

    # --- Konum ---
    city: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # --- Tarım Bilgileri ---
    farm_size_hectare: Mapped[float | None] = mapped_column(Float, nullable=True)
    crops: Mapped[list[str] | None] = mapped_column(
        ARRAY(String), nullable=True, comment="Yetiştirilen ürünler: ['kayısı', 'domates']"
    )

    # --- Doğrulama ---
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # --- Profil ---
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    profile_image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # --- İlişkiler ---
    products = relationship("Product", back_populates="farmer", lazy="selectin")
    reviews_given = relationship("MerchantReview", back_populates="farmer", lazy="selectin")
    transactions = relationship("Transaction", back_populates="farmer", lazy="selectin")

    def __repr__(self) -> str:
        return f"<Farmer(id={self.id}, name='{self.full_name}', city='{self.city}')>"
