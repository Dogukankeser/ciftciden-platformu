"""
Kusur Tespit Modülü
~~~~~~~~~~~~~~~~~~
Ürün yüzeyindeki çürük, leke ve diğer kusurları tespit eder.
Koyu bölge (blob) tespiti ve kontur analizi kullanır.
"""

import numpy as np

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


def detect_defects(img: np.ndarray) -> dict:
    """
    Ürün yüzeyindeki kusurları tespit eder.

    Yöntem:
    1. Gri tonlamaya çevir
    2. Adaptive threshold ile koyu bölgeleri bul
    3. Kontür analizi ile leke/çürük alanlarını ölç
    4. Toplam kusurlu alan oranını hesapla

    Returns:
        dict: {
            "defect_count": int,
            "defect_area_ratio": float,  (0-1, toplam kusur alanı / toplam alan)
            "defect_severity": str,      ("none" | "minor" | "moderate" | "severe")
            "defect_score": float,       (0-10, 10=kusursuz)
            "defects": list[dict],       (her kusur detayı)
        }
    """
    if CV2_AVAILABLE:
        return _detect_with_cv2(img)
    else:
        return _detect_simulated(img)


def _detect_with_cv2(img: np.ndarray) -> dict:
    """OpenCV ile gerçek kusur tespiti."""
    h, w = img.shape[:2]
    total_area = h * w

    # Gri tonlama
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Adaptive threshold — koyu bölgeleri tespit
    thresh = cv2.adaptiveThreshold(
        gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 21, 15
    )

    # Morfolojik işlemler — gürültüyü temizle
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

    # Kontur tespiti
    contours, _ = cv2.findContours(
        thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )

    defects = []
    total_defect_area = 0
    min_defect_area = total_area * 0.001  # Minimum %0.1 alan

    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < min_defect_area:
            continue

        x, y, bw, bh = cv2.boundingRect(cnt)
        circularity = 4 * np.pi * area / (cv2.arcLength(cnt, True) ** 2 + 1e-6)

        defects.append({
            "x": int(x), "y": int(y),
            "width": int(bw), "height": int(bh),
            "area_px": int(area),
            "area_ratio": round(area / total_area, 4),
            "circularity": round(circularity, 3),
        })
        total_defect_area += area

    defect_ratio = total_defect_area / total_area
    return _build_result(len(defects), defect_ratio, defects)


def _detect_simulated(img: np.ndarray) -> dict:
    """OpenCV yoksa basit piksel analizi ile kusur simülasyonu."""
    h, w = img.shape[:2]
    total_area = h * w

    # Koyu pikselleri kusur say (B<50, G<80, R<100)
    dark_mask = (
        (img[:, :, 0] < 50) &
        (img[:, :, 1] < 80) &
        (img[:, :, 2] < 100)
    )
    defect_pixels = int(np.sum(dark_mask))
    defect_ratio = defect_pixels / total_area

    # Basit blob sayımı
    defect_count = max(0, int(defect_ratio * 20))

    defects = []
    if defect_count > 0:
        for i in range(min(defect_count, 5)):
            defects.append({
                "x": int(np.random.randint(0, w)),
                "y": int(np.random.randint(0, h)),
                "width": int(np.random.randint(10, 40)),
                "height": int(np.random.randint(10, 40)),
                "area_px": int(defect_pixels // max(1, defect_count)),
                "area_ratio": round(defect_ratio / max(1, defect_count), 4),
                "circularity": round(np.random.uniform(0.3, 0.9), 3),
            })

    return _build_result(defect_count, defect_ratio, defects)


def _build_result(
    defect_count: int, defect_ratio: float, defects: list[dict]
) -> dict:
    """Kusur analiz sonucunu birleştirir."""
    # Şiddet sınıflandırması
    if defect_ratio < 0.01:
        severity = "none"
        score = 10.0
    elif defect_ratio < 0.03:
        severity = "minor"
        score = 8.0
    elif defect_ratio < 0.08:
        severity = "moderate"
        score = 5.0
    else:
        severity = "severe"
        score = 2.0

    return {
        "defect_count": defect_count,
        "defect_area_ratio": round(defect_ratio, 4),
        "defect_severity": severity,
        "defect_score": score,
        "defects": defects[:10],  # Max 10 kusur detayı
    }
