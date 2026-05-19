"""
AI Servisleri Konfigürasyonu
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Tüm AI modüllerinin ortak ayarları.
"""


class AIConfig:
    """AI modülleri için merkezi konfigürasyon."""

    # --- Adil Fiyat Motoru ---
    PRICE_MODEL_VERSION: str = "v1.0"
    PRICE_MIN_CONFIDENCE: float = 0.60  # Minimum güven seviyesi
    PRICE_MAX_RANGE_RATIO: float = 0.50  # max/min fark oranı üst limiti

    # --- Güven Skoru ---
    TRUST_SCORE_MIN: float = 0.0
    TRUST_SCORE_MAX: float = 10.0
    TRUST_RISK_THRESHOLD: float = 7.0  # Bu skorun altı = risk
    TRUST_WEIGHT_TRANSACTION: float = 0.40  # İşlem hacmi ağırlığı
    TRUST_WEIGHT_PAYMENT: float = 0.40  # Ödeme & sicil ağırlığı
    TRUST_WEIGHT_REVIEW: float = 0.20  # Çiftçi değerlendirme ağırlığı

    # --- Kalite Analizi ---
    QUALITY_MIN_CONFIDENCE: float = 0.85  # Altında fallback tetiklenir
    QUALITY_SUPPORTED_PRODUCTS: list[str] = ["kayısı", "domates", "elma"]
    QUALITY_IMAGE_SIZE: tuple[int, int] = (640, 480)  # Hedef çözünürlük

    # --- Dijital Muhtar ---
    MUHTAR_MIN_CONFIDENCE: float = 0.80  # %80 altı → disclaimer + ilaç engeli
    MUHTAR_MAX_RESPONSE_LENGTH: int = 2000  # Maksimum yanıt karakter sayısı
    MUHTAR_SUPPORTED_PLANTS: list[str] = [
        "kayısı", "domates", "elma", "biber", "buğday",
        "üzüm", "zeytin", "fıstık", "patates", "çilek", "ceviz",
    ]
    MUHTAR_MODEL: str = "gemini-2.0-flash"


ai_config = AIConfig()
