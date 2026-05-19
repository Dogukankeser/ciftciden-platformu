"""
AI Modül Response Şemaları
~~~~~~~~~~~~~~~~~~~~~~~~~~
AI endpoint'lerinin request/response formatları.
"""

from pydantic import BaseModel, Field


# --- Adil Fiyat Motoru ---
class FairPriceRequest(BaseModel):
    """Fiyat tahmin isteği."""
    category: str = Field(..., examples=["kayısı"])
    variety: str | None = Field(None, examples=["Hacıhaliloğlu"])
    city: str = Field("Malatya", examples=["Malatya"])
    quality_grade: str = Field("1. Kalite", examples=["1. Kalite"])
    quantity_kg: float = Field(100.0, gt=0, examples=[500.0])


class FairPriceResponse(BaseModel):
    """Fiyat tahmin yanıtı."""
    category: str
    variety: str
    city: str
    estimated_min_price: float
    estimated_max_price: float
    confidence_level: float
    factors: dict
    model_version: str
    explanation: str


# --- Güven Skoru ---
class TrustScoreRequest(BaseModel):
    """Güven skoru sorgu isteği."""
    merchant_id: str = Field(...)


class TrustScoreResponse(BaseModel):
    """Güven skoru yanıtı."""
    merchant_id: str
    overall_score: float
    transaction_score: float
    payment_score: float
    review_score: float
    risk_label: str
    risk_factors: list[str]
    explanation: str


# --- Kalite Analizi ---
class QualityAnalysisResponse(BaseModel):
    """Kalite analiz yanıtı."""
    predicted_grade: str
    confidence_score: float
    color_analysis: dict
    size_analysis: dict
    defect_analysis: dict
    needs_rescan: bool
    fallback_message: str | None
    explanation: str


# --- İlan Güven Analizi ---
class ListingTrustResponse(BaseModel):
    """İlan kartı güven skoru yanıtı."""
    trust_score: int
    comment: str
    source: str
