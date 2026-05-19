"""
Görüntü Ön İşleme Modülü
~~~~~~~~~~~~~~~~~~~~~~~~
Ürün fotoğraflarını analiz için hazırlar.
Yeniden boyutlandırma, gürültü azaltma ve normalizasyon.
"""

import numpy as np

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

from ai_services.config import ai_config


def preprocess_image(image_input) -> np.ndarray | None:
    """
    Görüntüyü analiz için ön işler.

    Args:
        image_input: Dosya yolu (str), numpy array veya bytes

    Returns:
        np.ndarray: Ön işlenmiş görüntü (BGR format) veya None
    """
    if not CV2_AVAILABLE:
        return _simulate_image()

    img = None

    if isinstance(image_input, str):
        # Dosya yolundan oku
        img = cv2.imread(image_input)
    elif isinstance(image_input, bytes):
        # Bytes'dan oku
        nparr = np.frombuffer(image_input, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    elif isinstance(image_input, np.ndarray):
        img = image_input

    if img is None:
        return _simulate_image()

    # Yeniden boyutlandır
    target_w, target_h = ai_config.QUALITY_IMAGE_SIZE
    img = cv2.resize(img, (target_w, target_h), interpolation=cv2.INTER_AREA)

    # Gürültü azaltma (Gaussian Blur)
    img = cv2.GaussianBlur(img, (3, 3), 0)

    return img


def _simulate_image() -> np.ndarray:
    """
    OpenCV yoksa veya görüntü okunamazsa simüle edilmiş
    bir kayısı görüntüsü üretir (demo amaçlı).
    """
    target_w, target_h = ai_config.QUALITY_IMAGE_SIZE
    # Turuncu-sarı ağırlıklı rastgele görüntü (kayısı simülasyonu)
    np.random.seed(None)
    img = np.zeros((target_h, target_w, 3), dtype=np.uint8)

    # Kayısı rengi: BGR (30-60, 120-180, 200-255)
    img[:, :, 0] = np.random.randint(30, 60, (target_h, target_w))   # Blue
    img[:, :, 1] = np.random.randint(120, 180, (target_h, target_w))  # Green
    img[:, :, 2] = np.random.randint(200, 255, (target_h, target_w))  # Red

    # Rastgele koyu lekeler ekle (kusur simülasyonu - %15 ihtimalle)
    if np.random.random() > 0.85:
        n_defects = np.random.randint(1, 4)
        for _ in range(n_defects):
            cx = np.random.randint(50, target_w - 50)
            cy = np.random.randint(50, target_h - 50)
            radius = np.random.randint(10, 30)
            y_min = max(0, cy - radius)
            y_max = min(target_h, cy + radius)
            x_min = max(0, cx - radius)
            x_max = min(target_w, cx + radius)
            img[y_min:y_max, x_min:x_max] = [20, 40, 60]  # Koyu leke

    return img


def extract_roi(img: np.ndarray) -> np.ndarray:
    """
    Ürünün olduğu bölgeyi (Region of Interest) çıkarır.
    Basit versiyon: merkez %70'lik alanı alır.
    """
    h, w = img.shape[:2]
    margin_x = int(w * 0.15)
    margin_y = int(h * 0.15)
    return img[margin_y:h - margin_y, margin_x:w - margin_x]
