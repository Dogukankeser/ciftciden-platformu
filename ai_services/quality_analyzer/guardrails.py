"""
Kalite Analizi Guardrails
~~~~~~~~~~~~~~~~~~~~~~~~
Kalite analiz çıktısını Pydantic üzerinden valide eder.
Confidence < %85 fallback mekanizmasını uygular.
"""

from ai_services.config import ai_config
from ai_services.shared.schemas import QualityAnalysisResult
from ai_services.quality_analyzer.classifier import quality_classifier


def analyze_and_validate(image_input) -> QualityAnalysisResult:
    """
    Görsel kalite analizi yapar ve Guardrails'den geçirir.
    Tek giriş noktası: Bu fonksiyon dışarıdan çağrılır.
    """
    raw = quality_classifier.classify(image_input)

    # Guardrail 1: Grade geçerlilik kontrolü
    grade = raw["predicted_grade"]
    if grade not in ("1. Kalite", "2. Kalite"):
        grade = "2. Kalite"  # Güvenli tarafta kal

    # Guardrail 2: Confidence sınır kontrolü
    confidence = max(0.0, min(1.0, raw["confidence_score"]))

    # Guardrail 3: Fallback mekanizması
    needs_rescan = confidence < ai_config.QUALITY_MIN_CONFIDENCE
    fallback_msg = raw.get("fallback_message")

    if needs_rescan and not fallback_msg:
        fallback_msg = (
            "Analiz güven skoru düşük. Lütfen ürünün daha net "
            "bir fotoğrafını çekip tekrar yükleyin."
        )

    # Açıklama oluştur
    if needs_rescan:
        explanation = (
            f"⚠️ {fallback_msg}"
        )
    else:
        score = raw.get("overall_quality_score", 0)
        explanation = (
            f"Bu ürün \"{grade}\" olarak sınıflandırıldı. "
            f"Kalite skoru: {score}/10, "
            f"Güven: %{confidence * 100:.0f}. "
        )
        severity = raw.get("defect_analysis", {}).get("defect_severity", "none")
        if severity == "none":
            explanation += "Yüzeyde kusur tespit edilmedi."
        elif severity == "minor":
            explanation += "Yüzeyde küçük kusurlar mevcut."
        else:
            explanation += "Yüzeyde belirgin kusurlar tespit edildi."

    # Pydantic validasyonu (son savunma hattı)
    result = QualityAnalysisResult(
        predicted_grade=grade,
        confidence_score=confidence,
        color_analysis=raw.get("color_analysis", {}),
        size_analysis=raw.get("size_analysis", {}),
        defect_analysis=raw.get("defect_analysis", {}),
        needs_rescan=needs_rescan,
        fallback_message=fallback_msg,
        explanation=explanation,
    )

    return result
