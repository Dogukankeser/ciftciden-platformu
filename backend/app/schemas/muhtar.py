"""
Muhtar API Request/Response Şemaları
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Backend API endpoint'lerinin request/response formatları.
"""

from pydantic import BaseModel, Field


# ─── Request Şemaları ─────────────────────────────────────────────

class MuhtarAnalyzeRequest(BaseModel):
    """Muhtar analiz isteği (metin + opsiyonel metadata)."""
    text: str = Field(
        ...,
        min_length=3,
        max_length=2000,
        examples=["Kayısı ağacımın yaprakları sarardı, lekeler var. Ne yapmalıyım?"],
    )
    plant: str | None = Field(
        None,
        examples=["kayısı"],
        description="Bitki türü (opsiyonel, otomatik tespit edilir)",
    )
    city: str | None = Field(
        None,
        examples=["Malatya"],
        description="İl bilgisi (hava durumu ve fiyat için)",
    )


class MuhtarAskRequest(BaseModel):
    """Muhtar'a sadece metin sorusu."""
    question: str = Field(
        ...,
        min_length=3,
        max_length=1000,
        examples=["Kayısıda sulama ne zaman yapılmalı?"],
    )
    plant: str | None = Field(None, examples=["kayısı"])
    city: str | None = Field(None, examples=["Malatya"])


# ─── Response Şemaları ───────────────────────────────────────────

class DiseaseDetectionResponse(BaseModel):
    """Hastalık teşhis detayları."""
    detected_disease: str
    confidence_score: float
    severity: str
    affected_part: str
    symptoms_found: list[str]


class MuhtarMetadata(BaseModel):
    """Yanıt metadata bilgisi."""
    model: str = ""
    is_mock: bool = True
    processing_time_ms: int = 0
    total_processing_time_ms: int = 0
    timestamp: str = ""


class MuhtarResponse(BaseModel):
    """Muhtar tam yanıt formatı."""
    muhtar_id: str
    post_id: str
    response_type: str
    disease_detection: DiseaseDetectionResponse | None = None
    muhtar_response: str
    recommendations: list[str] = []
    prevention: list[str] = []
    disclaimer: str | None = None
    rag_sources: list[str] = []
    weather_alert: str | None = None
    price_info: str | None = None
    metadata: MuhtarMetadata = MuhtarMetadata()
