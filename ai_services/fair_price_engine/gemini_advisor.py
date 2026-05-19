"""
Gemini destekli fiyat yorumlayici.

Yerel fiyat motorunun hesapladigi bandi Gemini'ye denetletir. Gemini canli
hal verisi uyduramaz; sadece verilen veri, bolge ve kalite bilgisini kullanir.
"""

from __future__ import annotations

import json

from ai_services.shared.gemini_utils import generate_gemini_json
from ai_services.shared.schemas import PriceEstimationResult


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


async def refine_price_with_gemini(
    *,
    category: str,
    variety: str | None,
    city: str,
    quality_grade: str,
    quantity_kg: float,
    local_result: PriceEstimationResult,
) -> PriceEstimationResult:
    input_payload = {
        "category": category,
        "variety": variety,
        "city": city,
        "quality_grade": quality_grade,
        "quantity_kg": quantity_kg,
        "local_result": local_result.model_dump(),
    }
    system_instruction = (
        "Sen tarim pazar yeri icin fiyat karar destek uzmanisin. "
        "Canli piyasa verisi uydurma; sadece verilen yerel fiyat motoru sonucu, urun, bolge, kalite ve miktar bilgisini kullan. "
        "Ciftciye sade, kisa ve gercekci aciklama yap."
    )
    prompt = (
        "Asagidaki tarimsal ilan icin fiyat bandini denetle. "
        "Yerel motor sonucu mantikliysa koru; sadece cok gerekli ise en fazla yuzde 12 duzelt. "
        "JSON disinda metin yazma.\n\n"
        "JSON semasi: "
        '{"estimated_min_price": number, "estimated_max_price": number, '
        '"confidence_level": 0-1, "factors": {"ana_etken": "...", "miktar": "...", "bolge": "..."}, '
        '"explanation": "en fazla iki sade cumle"}\n\n'
        f"Girdi:\n{json.dumps(input_payload, ensure_ascii=False)}"
    )

    data = await generate_gemini_json(prompt, system_instruction=system_instruction)
    if not data:
        return local_result

    local_min = float(local_result.estimated_min_price)
    local_max = float(local_result.estimated_max_price)
    min_allowed = local_min * 0.88
    max_allowed = local_max * 1.12

    estimated_min = round(_clamp(float(data.get("estimated_min_price", local_min)), min_allowed, max_allowed), 1)
    estimated_max = round(_clamp(float(data.get("estimated_max_price", local_max)), estimated_min + 0.1, max_allowed), 1)
    confidence = round(_clamp(float(data.get("confidence_level", local_result.confidence_level)), 0.55, 0.98), 2)
    factors = data.get("factors") if isinstance(data.get("factors"), dict) else {}
    explanation = str(data.get("explanation") or local_result.explanation).strip()

    return PriceEstimationResult(
        category=category,
        variety=variety or local_result.variety,
        city=city,
        estimated_min_price=estimated_min,
        estimated_max_price=estimated_max,
        confidence_level=confidence,
        factors={**local_result.factors, **factors, "kaynak": "Gemini denetimli fiyat bandi"},
        model_version="gemini-2.0-flash+local-price-v1",
        explanation=explanation[:420],
    )
