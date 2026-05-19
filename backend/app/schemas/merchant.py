"""
Tüccar (Merchant) Şemaları
~~~~~~~~~~~~~~~~~~~~~~~~~~
"""

from pydantic import BaseModel, Field


class MerchantBase(BaseModel):
    """Tüccar ortak alanları."""
    company_name: str = Field(..., min_length=2, max_length=250, examples=["Yılmaz Tarım Tic. Ltd. Şti."])
    full_name: str = Field(..., min_length=2, max_length=150, examples=["Ali Yılmaz"])
    email: str = Field(..., examples=["ali@yilmaztarim.com"])
    phone: str = Field(..., examples=["05321234567"])
    city: str = Field(..., examples=["İstanbul"])
    trade_registry_no: str | None = Field(None, examples=["TR-IST-12345"])
    bio: str | None = None


class MerchantCreate(MerchantBase):
    """Tüccar oluşturma isteği."""
    password: str = Field(..., min_length=6, max_length=100)


class MerchantResponse(MerchantBase):
    """Tüccar yanıt şeması."""
    id: str
    is_registry_verified: bool = False
    trust_score: float = 5.0
    risk_label: str = "normal"
    total_transaction_volume: float = 0.0
    successful_transactions: int = 0
    avg_payment_speed_days: float = 0.0
    profile_image_url: str | None = None
    created_at: str | None = None

    model_config = {"from_attributes": True}


class MerchantListResponse(BaseModel):
    """Tüccar listeleme yanıtı."""
    merchants: list[MerchantResponse]
    total: int
    page: int = 1
    per_page: int = 20
