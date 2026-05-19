"""
AI Kalite Analizi API Endpoint'i
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
POST /api/v1/ai/quality — Ürün fotoğrafı kalite analizi
GET  /api/v1/ai/quality/demo — Demo simülasyonu
"""

import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File

from app.schemas.ai_responses import QualityAnalysisResponse

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent.parent))

from ai_services.shared.schemas import QualityAnalysisResult

router = APIRouter(prefix="/ai", tags=["AI — Kalite Analizi"])


@router.post(
    "/quality",
    response_model=QualityAnalysisResponse,
    summary="Ürün fotoğrafı kalite analizi",
    description="Yüklenen fotoğrafı analiz ederek ürün kalitesini sınıflandırır.",
)
async def analyze_quality(file: UploadFile = File(...)):
    """
    📸 Görsel Kalite Analizi

    Ürün fotoğrafını analiz eder:
    - Renk analizi (HSV)
    - Kusur tespiti (leke, çürük)
    - Boyut tahmini

    **Confidence < %85 → Kullanıcıdan yeni fotoğraf istenir!**
    """
    try:
        contents = await file.read()

        try:
            from ai_services.quality_analyzer.guardrails import analyze_and_validate

            result = analyze_and_validate(contents)
        except Exception:
            result = QualityAnalysisResult(
                predicted_grade="2. Kalite",
                confidence_score=0.55,
                color_analysis={},
                size_analysis={},
                defect_analysis={},
                needs_rescan=True,
                fallback_message="Yerel görüntü motoru devreye giremedi; Gemini görsel denetimi kullanılıyor.",
                explanation="Fotoğraf Gemini ile değerlendirilecek; görüntü net değilse tekrar fotoğraf istenir.",
            )
        from ai_services.quality_analyzer.gemini_quality import refine_quality_with_gemini

        result = await refine_quality_with_gemini(
            contents,
            mime_type=file.content_type or "image/jpeg",
            local_result=result,
        )

        return QualityAnalysisResponse(
            predicted_grade=result.predicted_grade,
            confidence_score=result.confidence_score,
            color_analysis=result.color_analysis,
            size_analysis=result.size_analysis,
            defect_analysis=result.defect_analysis,
            needs_rescan=result.needs_rescan,
            fallback_message=result.fallback_message,
            explanation=result.explanation,
        )
    except Exception as e:
        # Graceful Degradation - Hata durumunda UI'ı bozmamak için fallback dön
        return QualityAnalysisResponse(
            predicted_grade="Bilinmiyor",
            confidence_score=0.0,
            color_analysis={},
            size_analysis={},
            defect_analysis={},
            needs_rescan=True,
            fallback_message="AI Kalite motoru şu an meşgul.",
            explanation="Muhtar fotoğrafı inceleyemedi, lütfen tekrar deneyin."
        )


@router.get(
    "/quality/demo",
    response_model=QualityAnalysisResponse,
    summary="Kalite analizi demo",
    description="Fotoğraf yüklemeden simüle edilmiş bir analiz sonucu döndürür.",
)
async def quality_demo():
    """Demo amaçlı simüle edilmiş kalite analizi. Jüri sunumu için."""
    try:
        from ai_services.quality_analyzer.guardrails import analyze_and_validate
        result = analyze_and_validate(None)  # Simüle görüntü

        return QualityAnalysisResponse(
            predicted_grade=result.predicted_grade,
            confidence_score=result.confidence_score,
            color_analysis=result.color_analysis,
            size_analysis=result.size_analysis,
            defect_analysis=result.defect_analysis,
            needs_rescan=result.needs_rescan,
            fallback_message=result.fallback_message,
            explanation=result.explanation,
        )
    except Exception as e:
        return QualityAnalysisResponse(
            predicted_grade="Bilinmiyor",
            confidence_score=0.0,
            color_analysis={},
            size_analysis={},
            defect_analysis={},
            needs_rescan=True,
            fallback_message="Demo modu şu an çevrimdışı.",
            explanation="Muhtar demo modunda çalışamıyor."
        )
