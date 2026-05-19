"""
Kalite Sınıflandırıcı
~~~~~~~~~~~~~~~~~~~~
Renk, boyut ve kusur analizlerini birleştirerek
nihai kalite sınıflandırması yapar.
"""

import numpy as np
from ai_services.config import ai_config
from ai_services.quality_analyzer.image_processor import preprocess_image, extract_roi
from ai_services.quality_analyzer.color_analyzer import analyze_color
from ai_services.quality_analyzer.defect_detector import detect_defects
from ai_services.quality_analyzer.size_estimator import estimate_size

WEIGHT_COLOR = 0.35
WEIGHT_DEFECT = 0.45
WEIGHT_SIZE = 0.20
GRADE_THRESHOLD = 7.0


class QualityClassifier:
    """Görsel ürün kalite sınıflandırıcı."""

    def classify(self, image_input) -> dict:
        img = preprocess_image(image_input)
        if img is None:
            return self._create_fallback("Görüntü okunamadı veya geçersiz format.")

        roi = extract_roi(img)
        color_result = analyze_color(roi)
        defect_result = detect_defects(roi)
        size_result = estimate_size(roi)

        overall_score = (
            color_result["color_score"] * WEIGHT_COLOR +
            defect_result["defect_score"] * WEIGHT_DEFECT +
            size_result["size_score"] * WEIGHT_SIZE
        )

        predicted_grade = "1. Kalite" if overall_score >= GRADE_THRESHOLD else "2. Kalite"
        confidence = self._calculate_confidence(color_result, defect_result, size_result, overall_score)

        needs_rescan = confidence < ai_config.QUALITY_MIN_CONFIDENCE
        fallback_message = None
        if needs_rescan:
            fallback_message = (
                f"Model bu fotoğraftan yeterince emin olamadı (Güven: %{confidence * 100:.0f}). "
                "Lütfen daha net ve yakın çekim bir fotoğraf yükleyin."
            )

        return {
            "predicted_grade": predicted_grade,
            "confidence_score": round(confidence, 4),
            "overall_quality_score": round(overall_score, 1),
            "color_analysis": color_result,
            "defect_analysis": {
                "defect_count": defect_result["defect_count"],
                "defect_area_ratio": defect_result["defect_area_ratio"],
                "defect_severity": defect_result["defect_severity"],
                "defect_score": defect_result["defect_score"],
            },
            "size_analysis": size_result,
            "needs_rescan": needs_rescan,
            "fallback_message": fallback_message,
        }

    def _calculate_confidence(self, color, defect, size, overall):
        base = 0.88
        uniformity = color.get("color_uniformity", 0.5)
        if uniformity < 0.3:
            base -= 0.15
        elif uniformity < 0.5:
            base -= 0.08
        dist = abs(overall - GRADE_THRESHOLD)
        if dist < 0.5:
            base -= 0.12
        elif dist < 1.0:
            base -= 0.06
        if (color["color_score"] > 7 and defect["defect_score"] < 4) or \
           (color["color_score"] < 4 and defect["defect_score"] > 8):
            base -= 0.08
        return max(0.30, min(0.98, base))

    def _create_fallback(self, message):
        return {
            "predicted_grade": "2. Kalite",
            "confidence_score": 0.0,
            "overall_quality_score": 0.0,
            "color_analysis": {},
            "defect_analysis": {},
            "size_analysis": {},
            "needs_rescan": True,
            "fallback_message": message,
        }


quality_classifier = QualityClassifier()
