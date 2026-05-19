"""
AI Adil Fiyat Motoru API Endpoint'i.

Yerel fiyat modeli calisirsa once onu kullanir; Gemini API aktifse sonucu
denetletir. Yerel model import edilemezse bile sifir donmek yerine kontrollu
bir on hesap uretir ve yine Gemini'ye sorar.
"""

import sys
from pathlib import Path

from fastapi import APIRouter

from app.schemas.ai_responses import FairPriceRequest, FairPriceResponse

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent.parent))

from ai_services.shared.schemas import PriceEstimationResult

router = APIRouter(prefix="/ai", tags=["AI - Adil Fiyat Motoru"])


def _simple_price_baseline(request: FairPriceRequest) -> PriceEstimationResult:
    normalized = request.category.lower()
    base_prices = {
        "kay": 198.0,
        "domates": 24.5,
        "elma": 19.5,
        "bugday": 11.4,
        "buğday": 11.4,
        "uzum": 34.0,
        "üzüm": 34.0,
        "zeytin": 46.0,
        "findik": 118.0,
        "fistik": 430.0,
    }
    base = next((value for key, value in base_prices.items() if key in normalized), 30.0)
    grade_factor = 1.08 if "1" in request.quality_grade or "premium" in request.quality_grade.lower() else 0.94
    volume_factor = 0.96 if request.quantity_kg >= 10000 else 1.0
    price = base * grade_factor * volume_factor

    return PriceEstimationResult(
        category=request.category,
        variety=request.variety or "Genel",
        city=request.city,
        estimated_min_price=round(price * 0.92, 1),
        estimated_max_price=round(price * 1.08, 1),
        confidence_level=0.72,
        factors={
            "temel_fiyat": base,
            "kalite": request.quality_grade,
            "miktar": request.quantity_kg,
            "not": "Yerel motor kullanilamazsa devreye giren kontrollu on hesap.",
        },
        model_version="resilient-baseline-v1",
        explanation="Fiyat bandi urun, kalite ve miktar bilgisine gore on hesaplandi; Gemini varsa bu bandi ayrica denetler.",
    )


@router.post(
    "/price",
    response_model=FairPriceResponse,
    summary="Adil fiyat tahmini",
    description="Urun, cesit, bolge, kalite ve miktara gore Gemini destekli fiyat bandi uretir.",
)
async def estimate_fair_price(request: FairPriceRequest):
    try:
        try:
            from ai_services.fair_price_engine.predictor import fair_price_predictor

            result = fair_price_predictor.predict(
                category=request.category,
                variety=request.variety,
                city=request.city,
                quality_grade=request.quality_grade,
                quantity_kg=request.quantity_kg,
            )
        except Exception:
            result = _simple_price_baseline(request)

        from ai_services.fair_price_engine.gemini_advisor import refine_price_with_gemini

        result = await refine_price_with_gemini(
            category=request.category,
            variety=request.variety,
            city=request.city,
            quality_grade=request.quality_grade,
            quantity_kg=request.quantity_kg,
            local_result=result,
        )

        return FairPriceResponse(
            category=result.category,
            variety=result.variety,
            city=result.city,
            estimated_min_price=result.estimated_min_price,
            estimated_max_price=result.estimated_max_price,
            confidence_level=result.confidence_level,
            factors=result.factors,
            model_version=result.model_version,
            explanation=result.explanation,
        )
    except Exception:
        result = _simple_price_baseline(request)
        return FairPriceResponse(
            category=result.category,
            variety=result.variety,
            city=result.city,
            estimated_min_price=result.estimated_min_price,
            estimated_max_price=result.estimated_max_price,
            confidence_level=result.confidence_level,
            factors=result.factors,
            model_version=result.model_version,
            explanation=result.explanation,
        )
