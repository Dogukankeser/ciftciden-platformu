"""
Ilan Guven Analizi
~~~~~~~~~~~~~~~~~~
Ilanin fotografini, aciklamasini ve ticari alanlarini birlikte degerlendirir.
Gemini API varsa vision + metin analizi kullanir; yoksa ayni veriyle tutarli
bir yerel skor uretir.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from ai_services.shared.gemini_utils import gemini_is_ready, generate_gemini_json

ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / "backend" / ".env")
load_dotenv(ROOT_DIR / ".env")

def _as_text(value: Any) -> str:
    if value is None:
        return ""
    return str(value).strip()


def _clamp_score(value: int) -> int:
    return max(45, min(98, int(value)))


def _one_sentence(text: str) -> str:
    cleaned = " ".join(_as_text(text).replace("\n", " ").split())
    if not cleaned:
        return "Ilan bilgileri incelendi; alicinin karar vermesi icin temel bilgiler yeterli gorunuyor."
    for separator in [".", "!", "?"]:
        if separator in cleaned:
            first = cleaned.split(separator, 1)[0].strip()
            if first:
                return f"{first}."
    return cleaned[:180].rstrip() + ("." if not cleaned.endswith(".") else "")


def _local_score(payload: dict[str, Any], has_image: bool) -> tuple[int, str]:
    description = _as_text(payload.get("description"))
    title = _as_text(payload.get("title"))
    dynamic = payload.get("dynamic") if isinstance(payload.get("dynamic"), dict) else {}
    certificates = payload.get("certificates") if isinstance(payload.get("certificates"), list) else []
    price = float(payload.get("pricePerKg") or 0)
    fair_min = float(payload.get("fairMin") or 0)
    fair_max = float(payload.get("fairMax") or 0)

    score = 58
    score += 12 if has_image else 0
    score += 8 if len(description) >= 90 else 3 if len(description) >= 40 else 0
    score += 5 if title else 0
    score += 5 if payload.get("city") and payload.get("district") else 0
    score += 5 if float(payload.get("quantityKg") or 0) > 0 else 0
    score += 4 if payload.get("harvestDate") else 0
    score += 4 if payload.get("delivery") else 0
    score += 4 if payload.get("payment") else 0
    score += 4 if certificates else 0
    score += min(6, len(dynamic) * 2)

    if price > 0 and fair_min > 0 and fair_max > 0:
        if fair_min * 0.9 <= price <= fair_max * 1.1:
            score += 6
        else:
            score -= 7

    score = _clamp_score(score)

    if score >= 88:
        comment = "Fotoğraf, açıklama ve ticari bilgiler güçlü; ilan alıcı için güven veren bir parti görünümünde."
    elif score >= 74:
        comment = "İlan genel olarak anlaşılır; birkaç ek belge veya daha net fotoğraf teklif kalitesini artırır."
    else:
        comment = "İlanda temel bilgiler var ancak alıcı güveni için daha net fotoğraf, analiz ve teslim bilgisi eklenmeli."

    return score, comment


def _extract_json(raw_text: str) -> dict[str, Any] | None:
    text = raw_text.strip()
    if "```json" in text:
        text = text.split("```json", 1)[1].split("```", 1)[0].strip()
    elif "```" in text:
        text = text.split("```", 1)[1].split("```", 1)[0].strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return None


async def analyze_listing_trust(
    payload: dict[str, Any],
    image_bytes: bytes | None = None,
    mime_type: str = "image/jpeg",
) -> dict[str, Any]:
    """Gemini destekli ilan guven skoru ve tek cumlelik yorum uretir."""
    fallback_score, fallback_comment = _local_score(payload, bool(image_bytes))
    if not gemini_is_ready():
        return {
            "trust_score": fallback_score,
            "comment": fallback_comment,
            "source": "local",
        }

    try:
        prompt = (
            "Bir tarim pazar yeri ilani inceliyorsun. Fotografi, basligi, aciklamayi, "
            "urun ozelliklerini, fiyat araligini, miktari, teslim ve odeme bilgisini birlikte degerlendir. "
            "Sadece gecerli JSON dondur. JSON semasi: "
            '{"guven_skoru": 0-100, "yorum": "tek cumle"}\n\n'
            "Kurallar: Skor alici acisindan ilan guvenini gostersin. Yorum tek cumle, sade Turkce ve gercekci olsun. "
            "Fotograf net degilse veya bilgiler eksikse bunu puana yansit. Risk, piyasa guveni veya yapay zeka ifadesi kullanma.\n\n"
            f"Ilan verisi:\n{json.dumps(payload, ensure_ascii=False)}"
        )
        data = await generate_gemini_json(
            prompt,
            system_instruction="Sadece verilen ilan verisine dayanarak geceli JSON uret. Bilmedigin seyi uydurma.",
            image_bytes=image_bytes,
            mime_type=mime_type,
        ) or {}
        score = _clamp_score(int(data.get("guven_skoru", fallback_score)))
        comment = _one_sentence(_as_text(data.get("yorum")) or fallback_comment)

        return {
            "trust_score": score,
            "comment": comment,
            "source": "gemini",
        }
    except Exception:
        return {
            "trust_score": fallback_score,
            "comment": fallback_comment,
            "source": "local",
        }
