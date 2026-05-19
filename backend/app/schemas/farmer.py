"""
Çiftçi (Farmer) Şemaları
~~~~~~~~~~~~~~~~~~~~~~~~
Request/Response validasyonu için Pydantic modelleri.
"""

from datetime import datetime
from pydantic import BaseModel, Field, EmailStr


class FarmerBase(BaseModel):
    """Çiftçi ortak alanları."""
    full_name: str = Field(..., min_length=2, max_length=150, examples=["Mehmet Yılmaz"])
    email: str = Field(..., examples=["mehmet.yilmaz@gmail.com"])
    phone: str = Field(..., examples=["05301234567"])
    city: str = Field(..., examples=["Malatya"])
    district: str | None = Field(None, examples=["Merkez"])
    farm_size_hectare: float | None = Field(None, ge=0, examples=[12.5])
    crops: list[str] | None = Field(None, examples=[["kayısı", "ceviz"]])
    bio: str | None = None


class FarmerCreate(FarmerBase):
    """Çiftçi oluşturma isteği."""
    password: str = Field(..., min_length=6, max_length=100)
    tc_kimlik: str | None = Field(None, min_length=11, max_length=11)


class FarmerResponse(FarmerBase):
    """Çiftçi yanıt şeması."""
    id: str
    is_verified: bool = False
    profile_image_url: str | None = None
    created_at: str | None = None

    model_config = {"from_attributes": True}


class FarmerListResponse(BaseModel):
    """Çiftçi listeleme yanıtı."""
    farmers: list[FarmerResponse]
    total: int
    page: int = 1
    per_page: int = 20
