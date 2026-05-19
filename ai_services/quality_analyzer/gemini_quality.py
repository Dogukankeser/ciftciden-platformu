"""
Gemini Vision destekli kalite denetimi.

Klasik goruntu isleme sonucu once hesaplanir, Gemini bu sonucu fotografla
birlikte kontrol eder. Goruntu yetersizse kesin kalite iddiasi uretilmez.
"""

from __future__ import annotations

from ai_services.shared.gemini_utils import generate_gemini_json
from ai_services.shared.schemas import QualityAnalysisResult


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


async def refine_quality_with_gemini(
    image_bytes: bytes,
    *,
    mime_type: str,
    local_result: QualityAnalysisResult,
) -> QualityAnalysisResult:
    system_instruction = (
        "Sen tarimsal urun fotografi inceleyen kalite uzmanisin. "
        "Sadece goruntude secilebilen renk, kusur, curuk, leke, boyut ve homojenlik bulgularina dayan. "
        "Goruntu net degilse kalite uydurma, needs_rescan true dondur."
    )
    prompt = (
        "Fotografi ve yerel goruntu isleme sonucunu birlikte denetle. "
        "JSON disinda metin yazma.\n\n"
        "JSON semasi: "
        '{"predicted_grade": "1. Kalite|2. Kalite", "confidence_score": 0-1, '
        '"color_analysis": {"ozet": "..."}, "size_analysis": {"ozet": "..."}, '
        '"defect_analysis": {"ozet": "...", "defect_severity": "none|minor|major"}, '
        '"needs_rescan": true|false, "fallback_message": null|string, '
        '"explanation": "en fazla iki sade cumle"}\n\n'
        f"Yerel analiz sonucu: {local_result.model_dump()}"
    )

    data = await generate_gemini_json(
        prompt,
        system_instruction=system_instruction,
        image_bytes=image_bytes,
        mime_type=mime_type,
    )
    if not data:
        return local_result

    grade = data.get("predicted_grade")
    if grade not in ("1. Kalite", "2. Kalite"):
        grade = local_result.predicted_grade

    confidence = round(_clamp(float(data.get("confidence_score", local_result.confidence_score)), 0.0, 0.98), 4)
    needs_rescan = bool(data.get("needs_rescan", confidence < 0.80))
    fallback_message = data.get("fallback_message") if needs_rescan else None
    explanation = str(data.get("explanation") or local_result.explanation).strip()

    return QualityAnalysisResult(
        predicted_grade=grade,
        confidence_score=confidence,
        color_analysis=data.get("color_analysis") if isinstance(data.get("color_analysis"), dict) else local_result.color_analysis,
        size_analysis=data.get("size_analysis") if isinstance(data.get("size_analysis"), dict) else local_result.size_analysis,
        defect_analysis=data.get("defect_analysis") if isinstance(data.get("defect_analysis"), dict) else local_result.defect_analysis,
        needs_rescan=needs_rescan,
        fallback_message=fallback_message,
        explanation=explanation[:420],
    )
