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
    normalized_cat = request.category.lower().strip()
    normalized_variety = (request.variety or "").lower().strip()
    
    # Kategori ve çeşide göre temel fiyatlar (Frontend ile tam uyumlu)
    base = 30.0
    if "kay" in normalized_cat:
        if "yaş" in normalized_variety or "yas" in normalized_variety:
            base = 45.0
        else:
            if "kaba" in normalized_variety:
                base = 180.0
            elif "hasan" in normalized_variety:
                base = 185.0
            elif "çatal" in normalized_variety or "catal" in normalized_variety:
                base = 175.0
            else:
                base = 198.0  # Hacıhaliloğlu veya genel kurutulmuş
    elif "domates" in normalized_cat:
        if "cherry" in normalized_variety:
            base = 38.0
        elif "sırık" in normalized_variety or "sirik" in normalized_variety:
            base = 22.0
        elif "tarla" in normalized_variety:
            base = 18.0
        elif "sofra" in normalized_variety:
            base = 20.0
        else:
            base = 24.5  # Salkım
    elif "elma" in normalized_cat:
        if "golden" in normalized_variety:
            base = 18.0
        elif "granny" in normalized_variety:
            base = 24.0
        elif "fuji" in normalized_variety:
            base = 22.0
        elif "amasya" in normalized_variety:
            base = 21.0
        else:
            base = 20.0  # Starking
    elif "bug" in normalized_cat or "buğ" in normalized_cat:
        if "makar" in normalized_variety:
            base = 12.5
        elif "sert" in normalized_variety:
            base = 12.0
        else:
            base = 11.4  # Ekmeklik
    elif "uzum" in normalized_cat or "üzüm" in normalized_cat:
        if "çekirdek" in normalized_variety or "cekirdek" in normalized_variety:
            base = 32.0
        elif "sofra" in normalized_variety:
            base = 30.0
        elif "şarap" in normalized_variety or "sarap" in normalized_variety:
            base = 28.0
        else:
            base = 34.8  # Sultani
    elif "zeytin" in normalized_cat:
        if "domat" in normalized_variety:
            base = 45.0
        elif "ayvalık" in normalized_variety or "ayvalik" in normalized_variety:
            base = 48.0
        elif "memecik" in normalized_variety:
            base = 46.0
        else:
            base = 50.0  # Gemlik
    elif "fındık" in normalized_cat or "findik" in normalized_cat:
        if "levant" in normalized_variety:
            base = 115.0
        elif "sivri" in normalized_variety:
            base = 110.0
        elif "palaz" in normalized_variety:
            base = 112.0
        else:
            base = 120.0  # Tombul
    elif "fıstık" in normalized_cat or "fistik" in normalized_cat:
        if "boz" in normalized_variety:
            base = 650.0
        elif "siirt" in normalized_variety:
            base = 460.0
        elif "kavrul" in normalized_variety:
            base = 410.0
        else:
            base = 430.0  # Kırmızı Kabuk

    # Kalite çarpanı eşlemesi (Frontend ile uyumlu)
    quality_multipliers = {
        "premium": 1.13,
        "1. kalite": 1.04,
        "2. kalite": 0.92,
        "sanayi": 0.78,
        "protein 13+": 1.06,
        "protein 12": 1.0,
        "yemlik": 0.84,
    }
    grade_factor = quality_multipliers.get(request.quality_grade.strip().lower(), 1.0)
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
