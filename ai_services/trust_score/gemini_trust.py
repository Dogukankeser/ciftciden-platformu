"""
Gemini destekli guven skoru aciklamasi.

Sayisal skor yerel ve aciklanabilir algoritmadan gelir; Gemini yalnizca verilen
ticari sinyalleri sade bir aciklamaya cevirir.
"""

from __future__ import annotations

import json
from typing import Any

from ai_services.shared.gemini_utils import generate_gemini_json
from ai_services.shared.schemas import TrustScoreResult


async def refine_trust_with_gemini(
    *,
    local_result: TrustScoreResult,
    merchant_payload: dict[str, Any],
) -> TrustScoreResult:
    system_instruction = (
        "Sen tarim pazar yerinde ticari guven analisti gibi calisirsin. "
        "Skor uydurma; verilen islem, odeme ve yorum sinyallerini sade Turkceyle acikla."
    )
    prompt = (
        "Asagidaki tuccar guven skorunu denetle ve kullaniciya net anlat. "
        "JSON disinda metin yazma.\n\n"
        "JSON semasi: "
        '{"risk_factors": ["..."], "explanation": "en fazla iki sade cumle"}\n\n'
        f"Girdi:\n{json.dumps({'local_result': local_result.model_dump(), 'merchant': merchant_payload}, ensure_ascii=False)}"
    )

    data = await generate_gemini_json(prompt, system_instruction=system_instruction)
    if not data:
        return local_result

    risk_factors = data.get("risk_factors") if isinstance(data.get("risk_factors"), list) else local_result.risk_factors
    explanation = str(data.get("explanation") or local_result.explanation).strip()

    return TrustScoreResult(
        merchant_id=local_result.merchant_id,
        overall_score=local_result.overall_score,
        transaction_score=local_result.transaction_score,
        payment_score=local_result.payment_score,
        review_score=local_result.review_score,
        risk_label=local_result.risk_label,
        risk_factors=[str(item) for item in risk_factors[:4]],
        explanation=explanation[:420],
    )
