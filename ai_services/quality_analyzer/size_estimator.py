"""
Boyut Tahmin Modülü
~~~~~~~~~~~~~~~~~~
Ürünün görüntüdeki boyutunu piksel cinsinden ölçer.
Referans nesne olmadan tahmini boyut sınıflandırması yapar.
"""

import numpy as np

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

# Kayısı boyut standartları (çap mm cinsinden)
APRICOT_SIZE_GRADES = {
    "büyük": {"min_diameter_mm": 40, "description": "Premium, büyük boy"},
    "orta": {"min_diameter_mm": 30, "description": "Standart sofralık"},
    "küçük": {"min_diameter_mm": 20, "description": "Küçük boy, kurutmalık uygun"},
}


def estimate_size(img: np.ndarray) -> dict:
    """
    Ürün boyutunu görüntüden tahmin eder.

    Yöntem:
    1. Ürünün ana kontürünü bul
    2. Bounding circle ile çap tahmin et
    3. Görüntü oranına göre gerçek boyuta yaklaşık dönüşüm

    Returns:
        dict: {
            "estimated_diameter_px": int,
            "estimated_diameter_mm": float,
            "size_category": str,
            "relative_size": float,  (0-1, görüntüye göre)
            "size_score": float,     (0-10)
        }
    """
    h, w = img.shape[:2]

    if CV2_AVAILABLE:
        # Gri tonlama + threshold
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # En büyük kontur = ürün
        contours, _ = cv2.findContours(
            binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        if contours:
            largest = max(contours, key=cv2.contourArea)
            (cx, cy), radius = cv2.minEnclosingCircle(largest)
            diameter_px = int(radius * 2)
        else:
            diameter_px = int(min(h, w) * 0.5)
    else:
        # Simülasyon: görüntü boyutunun %40-70'i ürün
        diameter_px = int(min(h, w) * np.random.uniform(0.4, 0.7))

    # Pikselden mm'ye yaklaşık dönüşüm
    # Varsayım: 640px genişlikte ~200mm alan
    px_to_mm = 200.0 / w
    diameter_mm = round(diameter_px * px_to_mm, 1)

    # Göreceli boyut (görüntüye göre)
    relative_size = diameter_px / min(h, w)

    # Boyut kategorisi
    if diameter_mm >= 40:
        size_cat = "büyük"
        size_score = 9.0
    elif diameter_mm >= 30:
        size_cat = "orta"
        size_score = 7.0
    else:
        size_cat = "küçük"
        size_score = 5.0

    return {
        "estimated_diameter_px": diameter_px,
        "estimated_diameter_mm": diameter_mm,
        "size_category": size_cat,
        "relative_size": round(relative_size, 3),
        "size_score": size_score,
    }
