"""
Ortak Pydantic Şemaları (Guardrails)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Tüm AI modüllerinin çıktılarını valide eden Pydantic modelleri.
Bu şemalar, halüsinasyon ve hatalı çıktıları engelleyen GUARDRAILS katmanıdır.
Her AI çıktısı bu modeller üzerinden geçmeden kullanıcıya ulaşamaz.
"""

from pydantic import BaseModel, Field, field_validator


class PriceEstimationResult(BaseModel):
    """
    Adil Fiyat Motoru çıktı şeması.
    Guardrails: min < max, confidence [0,1], negatif fiyat engeli.
    """

    category: str = Field(..., description="Ürün kategorisi")
    variety: str = Field(..., description="Ürün çeşidi")
    city: str = Field(..., description="Bölge/İl")
    estimated_min_price: float = Field(..., gt=0, description="Tahmini alt fiyat (TL/kg)")
    estimated_max_price: float = Field(..., gt=0, description="Tahmini üst fiyat (TL/kg)")
    confidence_level: float = Field(..., ge=0.0, le=1.0, description="Güven seviyesi")
    factors: dict = Field(default_factory=dict, description="Kullanılan faktörler")
    model_version: str = Field(default="v1.0", description="Model versiyonu")
    explanation: str = Field(..., description="Kullanıcıya gösterilecek açıklama")

    @field_validator("estimated_max_price")
    @classmethod
    def max_must_be_greater_than_min(cls, v, info):
        """Üst fiyat alt fiyattan büyük olmalı."""
        min_price = info.data.get("estimated_min_price")
        if min_price is not None and v < min_price:
            raise ValueError(
                f"Üst fiyat ({v}) alt fiyattan ({min_price}) küçük olamaz"
            )
        return v

    @field_validator("confidence_level")
    @classmethod
    def confidence_must_be_valid(cls, v):
        """Güven seviyesi 0-1 arasında olmalı."""
        if not 0.0 <= v <= 1.0:
            raise ValueError(f"Güven seviyesi 0-1 arasında olmalı, verilen: {v}")
        return round(v, 4)


class TrustScoreResult(BaseModel):
    """
    Güven Skoru çıktı şeması.
    Guardrails: skor [0,10], risk etiketi tutarlılığı.
    """

    merchant_id: str = Field(..., description="Tüccar ID")
    overall_score: float = Field(..., ge=0.0, le=10.0, description="Toplam güven skoru")
    transaction_score: float = Field(..., ge=0.0, le=10.0, description="İşlem hacmi skoru")
    payment_score: float = Field(..., ge=0.0, le=10.0, description="Ödeme & sicil skoru")
    review_score: float = Field(..., ge=0.0, le=10.0, description="Çiftçi değerlendirme skoru")
    risk_label: str = Field(..., description="normal | warning | restricted")
    risk_factors: list[str] = Field(default_factory=list, description="Risk faktörleri listesi")
    explanation: str = Field(..., description="Kullanıcıya gösterilecek açıklama")

    @field_validator("risk_label")
    @classmethod
    def valid_risk_label(cls, v):
        """Risk etiketi geçerli olmalı."""
        allowed = {"normal", "warning", "restricted"}
        if v not in allowed:
            raise ValueError(f"Geçersiz risk etiketi: {v}. İzin verilenler: {allowed}")
        return v

    @field_validator("overall_score")
    @classmethod
    def round_score(cls, v):
        return round(v, 1)


class QualityAnalysisResult(BaseModel):
    """
    Görsel Kalite Analizi çıktı şeması.
    Guardrails: confidence < %85 → fallback, geçerli grade.
    """

    predicted_grade: str = Field(..., description="1. Kalite | 2. Kalite")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Model güven skoru")
    color_analysis: dict = Field(default_factory=dict, description="Renk analiz detayları")
    size_analysis: dict = Field(default_factory=dict, description="Boyut analiz detayları")
    defect_analysis: dict = Field(default_factory=dict, description="Kusur analiz detayları")
    needs_rescan: bool = Field(default=False, description="Tekrar fotoğraf gerekli mi")
    fallback_message: str | None = Field(default=None, description="Fallback mesajı")
    explanation: str = Field(..., description="Kullanıcıya gösterilecek açıklama")

    @field_validator("predicted_grade")
    @classmethod
    def valid_grade(cls, v):
        allowed = {"1. Kalite", "2. Kalite"}
        if v not in allowed:
            raise ValueError(f"Geçersiz kalite derecesi: {v}. İzin verilenler: {allowed}")
        return v

    @field_validator("confidence_score")
    @classmethod
    def round_confidence(cls, v):
        return round(v, 4)
