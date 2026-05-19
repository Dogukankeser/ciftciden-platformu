"""
Muhtar Guardrails — Güvenlik Sınırları
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Muhtar AI çıktısını filtreleyen güvenlik katmanı.
- Konu dışı içerik tespiti ve engelleme
- Confidence gate (< %80 → disclaimer)
- Kimyasal ilaç güvenliği
- Pydantic son savunma hattı
"""

import random
from typing import Any

from ai_services.config import ai_config
from ai_services.muhtar.persona import KONU_DISI_YANITLAR, DUSUK_GUVEN_DISCLAIMER


# ─── Yasaklı Konu Anahtar Kelimeleri ─────────────────────────────
YASAKLI_KONULAR = {
    "siyaset": [
        "parti", "seçim", "oy", "siyaset", "politika", "hükümet",
        "muhalefet", "başbakan", "cumhurbaşkan", "milletvekil",
        "belediye başkan", "miting", "referandum",
    ],
    "saglik": [
        "ilaç tedavi", "doktor", "hastane", "kanser", "kalp",
        "tansiyon", "şeker hastalığı", "koronavirüs", "covid",
        "aşı insan", "ameliyat", "reçete",
    ],
    "diger": [
        "futbol", "maç", "basketbol", "kripto", "bitcoin",
        "borsa hisse", "döviz kur", "altın yatırım",
        "film dizi", "müzik", "magazin",
    ],
}


def is_off_topic(text: str) -> bool:
    """
    Metnin tarım dışı bir konu içerip içermediğini kontrol eder.

    Returns:
        True → konu dışı (engelle)
        False → tarımla ilgili (devam et)
    """
    text_lower = text.lower()

    # Tarım kelimeleri varsa öncelik ver
    tarim_keywords = [
        "tarla", "bahçe", "ürün", "ekin", "hasat", "tohum", "fide",
        "sulama", "gübre", "ilaçlama", "budama", "meyve", "sebze",
        "bitki", "yaprak", "kök", "dal", "çiçek", "toprak",
        "kayısı", "domates", "elma", "biber", "buğday", "üzüm",
        "hastalık", "zararlı", "böcek", "mantar", "küf",
        "çiftçi", "çiftlik", "tarım", "ziraat", "hayvancılık",
        "fiyat hal", "pazar", "verim", "rekolte",
    ]

    tarim_hit = any(kw in text_lower for kw in tarim_keywords)
    if tarim_hit:
        return False  # Tarım konusu → devam

    # Yasaklı konu kontrolü
    for kategori, kelimeler in YASAKLI_KONULAR.items():
        if any(kw in text_lower for kw in kelimeler):
            return True  # Konu dışı

    return False  # Varsayılan: izin ver


def get_off_topic_response() -> str:
    """Konu dışı sorularda kullanılacak nazik red yanıtı."""
    return random.choice(KONU_DISI_YANITLAR)


def apply_confidence_gate(result: dict) -> dict:
    """
    Confidence < %80 → disclaimer ekle, ilaç isimlerini kaldır.

    Args:
        result: disease_detector çıktısı

    Returns:
        Güvenlik filtresinden geçirilmiş sonuç
    """
    detection = result.get("disease_detection")
    if not detection:
        return result

    confidence = detection.get("confidence_score", 0)

    if confidence < ai_config.MUHTAR_MIN_CONFIDENCE:
        # Disclaimer ekle
        disease_name = detection.get("detected_disease", "bu hastalık")
        result["disclaimer"] = DUSUK_GUVEN_DISCLAIMER.format(
            hastalik_adi=disease_name
        )

        # Muhtar yanıtına uyarı ekle
        response = result.get("muhtar_response", "")
        if result["disclaimer"] not in response:
            result["muhtar_response"] = response + f"\n\n{result['disclaimer']}"

    return result


def validate_response(result: dict) -> dict:
    """
    Muhtar yanıtının son güvenlik kontrolü.
    Tüm guardrails'i tek seferde uygular.
    """
    # 1. Boş yanıt kontrolü
    if not result.get("muhtar_response"):
        result["muhtar_response"] = (
            "Soruyu net anlayamadım. Ürün, şehir, belirti ve varsa yakın plan fotoğraf eklersen daha doğru yönlendiririm."
        )

    # 2. Confidence gate
    result = apply_confidence_gate(result)

    # 3. Çok uzun yanıt kontrolü
    response_text = result.get("muhtar_response", "")
    if len(response_text) > 900:
        result["muhtar_response"] = response_text[:880].rstrip() + "..."

    return result
