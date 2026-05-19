"""
Muhtar Pydantic Şemaları (AI Guardrails)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Muhtar AI çıktısını valide eden Pydantic modelleri.
Mevcut shared/schemas.py pattern'i ile uyumlu.
"""

from pydantic import BaseModel, Field, field_validator


class DiseaseDetectionResult(BaseModel):
    """Hastalık teşhis çıktı şeması."""

    detected_disease: str = Field(..., description="Tespit edilen hastalık adı")
    confidence_score: float = Field(
        ..., ge=0.0, le=1.0, description="Güven skoru (0-1)"
    )
    severity: str = Field(
        default="bilinmiyor",
        description="Risk seviyesi: düşük | orta | yüksek | çok yüksek",
    )
    affected_part: str = Field(default="", description="Etkilenen bitki kısmı")
    symptoms_found: list[str] = Field(
        default_factory=list, description="Tespit edilen belirtiler"
    )

    @field_validator("severity")
    @classmethod
    def valid_severity(cls, v):
        allowed = {"düşük", "orta", "yüksek", "çok yüksek", "bilinmiyor"}
        if v not in allowed:
            return "bilinmiyor"
        return v

    @field_validator("confidence_score")
    @classmethod
    def round_confidence(cls, v):
        return round(v, 4)


class MuhtarResponseResult(BaseModel):
    """
    Muhtar tam yanıt şeması.
    Guardrails: konu dışı engel, confidence gate, ilaç güvenliği.
    """

    muhtar_id: str = Field(..., description="Yanıt benzersiz ID")
    post_id: str = Field(..., description="İlgili post ID")
    response_type: str = Field(
        ..., description="disease_diagnosis | general_advice | off_topic_redirect"
    )
    disease_detection: DiseaseDetectionResult | None = Field(
        default=None, description="Hastalık teşhis detayları"
    )
    muhtar_response: str = Field(..., description="Muhtar'ın yanıt metni")
    recommendations: list[str] = Field(
        default_factory=list, description="Tedavi önerileri"
    )
    prevention: list[str] = Field(
        default_factory=list, description="Önleme tavsiyeleri"
    )
    disclaimer: str | None = Field(
        default=None, description="Düşük güvende sorumluluk reddi"
    )
    rag_sources: list[str] = Field(
        default_factory=list, description="Kullanılan veri kaynakları"
    )
    weather_alert: str | None = Field(
        default=None, description="Hava durumu uyarısı"
    )
    price_info: str | None = Field(
        default=None, description="Güncel fiyat bilgisi"
    )

    @field_validator("response_type")
    @classmethod
    def valid_response_type(cls, v):
        allowed = {"disease_diagnosis", "general_advice", "off_topic_redirect"}
        if v not in allowed:
            return "general_advice"
        return v
