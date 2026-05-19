"""
Renk Analizi Modülü
~~~~~~~~~~~~~~~~~~
HSV (Hue-Saturation-Value) renk uzayında ürün rengini analiz eder.
Kayısı için ideal renk aralıkları tanımlanmıştır.
"""

import numpy as np

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


# Kayısı için ideal HSV renk aralıkları
APRICOT_COLOR_RANGES = {
    "1. Kalite": {
        "description": "Parlak turuncu-altın, homojen",
        "h_min": 10, "h_max": 30,   # Turuncu tonları
        "s_min": 120, "s_max": 255,  # Yüksek doygunluk
        "v_min": 150, "v_max": 255,  # Parlak
    },
    "2. Kalite": {
        "description": "Soluk sarı-yeşilimsi veya aşırı koyu",
        "h_min": 5, "h_max": 40,
        "s_min": 50, "s_max": 180,
        "v_min": 80, "v_max": 200,
    },
}


def analyze_color(img: np.ndarray) -> dict:
    """
    Görüntünün renk profilini HSV uzayında analiz eder.

    Returns:
        dict: {
            "dominant_hue": float,
            "saturation_mean": float,
            "value_mean": float,
            "color_uniformity": float,  (0-1, 1=çok homojen)
            "grade_1_match": float,     (0-1, 1. kalite uyumu)
            "grade_2_match": float,     (0-1, 2. kalite uyumu)
            "color_score": float,       (0-10)
        }
    """
    if CV2_AVAILABLE:
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    else:
        # OpenCV yoksa numpy ile basit HSV simülasyonu
        hsv = _simulate_hsv(img)

    h_channel = hsv[:, :, 0].astype(float)
    s_channel = hsv[:, :, 1].astype(float)
    v_channel = hsv[:, :, 2].astype(float)

    dominant_hue = float(np.median(h_channel))
    saturation_mean = float(np.mean(s_channel))
    value_mean = float(np.mean(v_channel))

    # Renk homojenliği (düşük std = homojen)
    h_std = float(np.std(h_channel))
    color_uniformity = max(0.0, 1.0 - (h_std / 50.0))  # 0-1

    # 1. Kalite uyumu
    grade_1 = APRICOT_COLOR_RANGES["1. Kalite"]
    g1_h = 1.0 if grade_1["h_min"] <= dominant_hue <= grade_1["h_max"] else 0.3
    g1_s = 1.0 if grade_1["s_min"] <= saturation_mean <= grade_1["s_max"] else 0.4
    g1_v = 1.0 if grade_1["v_min"] <= value_mean <= grade_1["v_max"] else 0.4
    grade_1_match = (g1_h * 0.4 + g1_s * 0.3 + g1_v * 0.3)

    # 2. Kalite uyumu
    grade_2 = APRICOT_COLOR_RANGES["2. Kalite"]
    g2_h = 1.0 if grade_2["h_min"] <= dominant_hue <= grade_2["h_max"] else 0.3
    g2_s = 1.0 if grade_2["s_min"] <= saturation_mean <= grade_2["s_max"] else 0.4
    g2_v = 1.0 if grade_2["v_min"] <= value_mean <= grade_2["v_max"] else 0.4
    grade_2_match = (g2_h * 0.4 + g2_s * 0.3 + g2_v * 0.3)

    # Renk skoru (10 üzerinden)
    color_score = (grade_1_match * 7.0 + color_uniformity * 3.0)

    return {
        "dominant_hue": round(dominant_hue, 1),
        "saturation_mean": round(saturation_mean, 1),
        "value_mean": round(value_mean, 1),
        "color_uniformity": round(color_uniformity, 3),
        "grade_1_match": round(grade_1_match, 3),
        "grade_2_match": round(grade_2_match, 3),
        "color_score": round(min(10.0, color_score), 1),
    }


def _simulate_hsv(img: np.ndarray) -> np.ndarray:
    """OpenCV yoksa basit BGR→HSV dönüşümü simüle eder."""
    h, w = img.shape[:2]
    hsv = np.zeros_like(img)
    # Basit yaklaşım: R kanalından Hue tahmin et
    hsv[:, :, 0] = (img[:, :, 2] / 255.0 * 30).astype(np.uint8)  # Hue
    hsv[:, :, 1] = ((img[:, :, 1] + img[:, :, 2]) / 2).astype(np.uint8)  # Sat
    hsv[:, :, 2] = img[:, :, 2]  # Value
    return hsv
