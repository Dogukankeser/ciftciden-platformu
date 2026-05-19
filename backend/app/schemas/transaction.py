"""
İşlem (Transaction) Şemaları
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
"""

from pydantic import BaseModel, Field


class TransactionCreate(BaseModel):
    """İşlem oluşturma isteği."""
    product_id: str = Field(...)
    merchant_id: str = Field(...)
    agreed_price_per_kg: float = Field(..., gt=0)
    quantity_kg: float = Field(..., gt=0)


class TransactionResponse(BaseModel):
    """İşlem yanıt şeması."""
    id: str
    product_id: str
    merchant_id: str
    farmer_id: str
    agreed_price_per_kg: float
    quantity_kg: float
    total_amount: float
    status: str = "pending"
    payment_status: str = "awaiting"
    payment_due_date: str | None = None
    payment_completed_at: str | None = None
    created_at: str | None = None

    # İlişkili veriler
    product_title: str | None = None
    merchant_name: str | None = None
    farmer_name: str | None = None

    model_config = {"from_attributes": True}


class TransactionListResponse(BaseModel):
    """İşlem listeleme yanıtı."""
    transactions: list[TransactionResponse]
    total: int
