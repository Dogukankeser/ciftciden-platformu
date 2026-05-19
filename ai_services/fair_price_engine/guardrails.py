"""
Fiyat Motoru Guardrails
~~~~~~~~~~~~~~~~~~~~~~
Model çıktısını valide eder. Hatalı, mantıksız veya
tutarsız fiyat tahminlerini engeller.
"""

from ai_services.config import ai_config
from ai_services.shared.schemas import PriceEstimationResult


def validate_price_output(
    category: str,
    variety: str,
    city: str,
    min_price: float,
    max_price: float,
    confidence: float,
    factors: dict,
    explanation: str,
    model_version: str,
) -> PriceEstimationResult:
    """
    Fiyat tahmin çıktısını Guardrails'den geçirir.

    Kontroller:
    1. Negatif fiyat engeli
    2. Min < Max kontrolü
    3. Aşırı geniş aralık kontrolü
    4. Minimum güven seviyesi kontrolü
    5. Pydantic şema validasyonu
    """
    # Guardrail 1: Negatif fiyat koruması
    min_price = max(0.1, min_price)
    max_price = max(0.2, max_price)

    # Guardrail 2: Min < Max garantisi
    if min_price >= max_price:
        # Swap ve küçük margin ekle
        min_price, max_price = min(min_price, max_price), max(min_price, max_price)
        if min_price == max_price:
            max_price = min_price * 1.10

    # Guardrail 3: Aralık çok geniş mi? (max/min > %50 fark)
    range_ratio = (max_price - min_price) / min_price if min_price > 0 else 0
    if range_ratio > ai_config.PRICE_MAX_RANGE_RATIO:
        # Aralığı daralt
        mid = (min_price + max_price) / 2
        allowed_spread = mid * ai_config.PRICE_MAX_RANGE_RATIO / 2
        min_price = round(mid - allowed_spread, 1)
        max_price = round(mid + allowed_spread, 1)
        confidence = min(confidence, 0.75)  # Güveni düşür

    # Guardrail 4: Minimum güven seviyesi
    if confidence < ai_config.PRICE_MIN_CONFIDENCE:
        explanation += (
            f" ⚠️ Dikkat: Bu tahmin düşük güven seviyesindedir ({confidence:.0%}). "
            "Hal fiyatlarını da kontrol etmenizi öneririz."
        )

    # Guardrail 5: Pydantic validasyonu (son savunma hattı)
    result = PriceEstimationResult(
        category=category,
        variety=variety,
        city=city,
        estimated_min_price=round(min_price, 1),
        estimated_max_price=round(max_price, 1),
        confidence_level=confidence,
        factors=factors,
        model_version=model_version,
        explanation=explanation,
    )

    return result
