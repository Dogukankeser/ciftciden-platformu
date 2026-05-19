"""
Ürün / İlan (Product) Şemaları
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
"""

from pydantic import BaseModel, Field


class ProductBase(BaseModel):
    """Ürün ortak alanları."""
    title: str = Field(..., min_length=3, max_length=200, examples=["Malatya Hacıhaliloğlu Kayısı - 500 kg"])
    category: str = Field(..., examples=["kayısı"])
    variety: str | None = Field(None, examples=["Hacıhaliloğlu"])
    description: str | None = None
    quantity_kg: float = Field(..., gt=0, examples=[500.0])
    asking_price_per_kg: float = Field(..., gt=0, examples=[48.0])
    city: str = Field(..., examples=["Malatya"])
    harvest_date: str | None = None


class ProductCreate(ProductBase):
    """Ürün oluşturma isteği."""
    farmer_id: str = Field(..., description="Çiftçi ID")


class ProductResponse(ProductBase):
    """Ürün yanıt şeması."""
    id: str
    farmer_id: str
    quality_grade: str = "Belirsiz"
    image_urls: list[str] | None = None
    status: str = "active"
    created_at: str | None = None

    # İlişkili veriler (opsiyonel)
    farmer_name: str | None = None
    fair_price_min: float | None = None
    fair_price_max: float | None = None

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    """Ürün listeleme yanıtı."""
    products: list[ProductResponse]
    total: int
    page: int = 1
    per_page: int = 20


class ProductFilterParams(BaseModel):
    """Ürün filtreleme parametreleri."""
    category: str | None = None
    city: str | None = None
    min_price: float | None = None
    max_price: float | None = None
    quality_grade: str | None = None
    status: str = "active"
