"""
Event Listener — Post Olay Yakalayıcı
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Yeni bir sosyal medya paylaşımı oluşturulduğunda
Muhtar AI pipeline'ını tetikleyen event-driven dispatcher.
"""

import time
import uuid
from datetime import datetime
from typing import Any

from ai_services.muhtar.disease_detector import disease_detector
from ai_services.muhtar.guardrails import (
    is_off_topic,
    get_off_topic_response,
    validate_response,
)


class MuhtarEventListener:
    """
    Sosyal medya akışındaki yeni paylaşımları dinler
    ve Muhtar AI'ı tetikler.
    """

    async def on_new_post(self, post_data: dict) -> dict[str, Any]:
        """
        Ana olay yakalayıcı. Yeni post geldiğinde çağrılır.

        Args:
            post_data: {
                "post_id": str,
                "user_name": str,
                "text": str,
                "image_bytes": bytes | None,
                "plant": str | None,
                "city": str | None,
            }

        Returns:
            Muhtar yanıt nesnesi
        """
        start_time = time.time()
        post_id = post_data.get("post_id", str(uuid.uuid4()))
        user_text = post_data.get("text", "")
        image_bytes = post_data.get("image_bytes")
        media_type = post_data.get("media_type", "image/jpeg")
        plant = post_data.get("plant")
        city = post_data.get("city")

        # ─── Guardrail 1: Konu dışı kontrolü ──────────────────
        if is_off_topic(user_text):
            return self._build_off_topic_response(post_id, start_time)

        # ─── Pipeline seçimi ──────────────────────────────────
        if image_bytes:
            # Fotoğraflı paylaşım → Vision + RAG pipeline
            result = await disease_detector.detect_from_image(
                image_bytes=image_bytes,
                user_text=user_text,
                plant=plant,
                city=city,
                media_type=media_type,
            )
            response_type = "disease_diagnosis"
        else:
            # Sadece metin → RAG + Text pipeline
            result = await disease_detector.detect_from_text(
                user_text=user_text,
                plant=plant,
                city=city,
            )
            response_type = (
                "disease_diagnosis"
                if result.get("disease_detection")
                else "general_advice"
            )

        # ─── Guardrails uygula ────────────────────────────────
        result = validate_response(result)

        # ─── Final yanıt ──────────────────────────────────────
        elapsed = int((time.time() - start_time) * 1000)

        return {
            "muhtar_id": f"muhtar-{uuid.uuid4().hex[:8]}",
            "post_id": post_id,
            "response_type": response_type,
            "disease_detection": result.get("disease_detection"),
            "muhtar_response": result.get("muhtar_response", ""),
            "recommendations": result.get("recommendations", []),
            "prevention": result.get("prevention", []),
            "disclaimer": result.get("disclaimer"),
            "rag_sources": result.get("rag_sources", []),
            "weather_alert": result.get("weather_alert"),
            "price_info": result.get("price_info"),
            "metadata": {
                **result.get("metadata", {}),
                "total_processing_time_ms": elapsed,
                "timestamp": datetime.now().isoformat(),
            },
        }

    def _build_off_topic_response(
        self, post_id: str, start_time: float
    ) -> dict[str, Any]:
        """Konu dışı sorular için nazik red yanıtı."""
        elapsed = int((time.time() - start_time) * 1000)
        return {
            "muhtar_id": f"muhtar-{uuid.uuid4().hex[:8]}",
            "post_id": post_id,
            "response_type": "off_topic_redirect",
            "disease_detection": None,
            "muhtar_response": get_off_topic_response(),
            "recommendations": [],
            "prevention": [],
            "disclaimer": None,
            "rag_sources": [],
            "weather_alert": None,
            "price_info": None,
            "metadata": {
                "model": "guardrails_filter",
                "is_mock": False,
                "processing_time_ms": elapsed,
                "total_processing_time_ms": elapsed,
                "timestamp": datetime.now().isoformat(),
            },
        }


# Singleton
muhtar_listener = MuhtarEventListener()


# ─── Standalone Demo ──────────────────────────────────────────────
def _safe_print(text: str):
    """Windows cp1254 encoding hatalarını önler."""
    try:
        print(text)
    except UnicodeEncodeError:
        print(text.encode("ascii", errors="replace").decode("ascii"))


async def run_demo():
    """
    Kayısı Çil Hastalığı demo senaryosu.
    python -m ai_services.muhtar.event_listener ile çalıştırılır.
    """
    _safe_print("=" * 60)
    _safe_print("[DEMO] DIJITAL MUHTAR - Demo Senaryosu")
    _safe_print("=" * 60)

    # Senaryo: Çiftçi kayısı fotoğrafı paylaşıyor
    demo_post = {
        "post_id": "demo-post-001",
        "user_name": "Mehmet Yılmaz",
        "text": "Kayısı ağacımın yaprakları sarardı ve üzerinde kahverengi lekeler var. Buna ne oldu?",
        "image_bytes": None,  # Demo'da mock çalışacak
        "plant": "kayısı",
        "city": "Malatya",
    }

    _safe_print(f"\n[Ciftci] {demo_post['user_name']}")
    _safe_print(f"[Post] {demo_post['text']}")
    _safe_print(f"[Il] {demo_post['city']}")
    _safe_print("\n[Bekleniyor] Muhtar analiz ediyor...\n")

    result = await muhtar_listener.on_new_post(demo_post)

    import json
    _safe_print("-" * 60)
    _safe_print("[JSON] MUHTAR YANITI:")
    _safe_print("-" * 60)
    _safe_print(json.dumps(result, ensure_ascii=False, indent=2))
    _safe_print("-" * 60)
    _safe_print(f"\n[MESAJ] MUHTAR'IN MESAJI:")
    _safe_print("-" * 60)
    _safe_print(result.get("muhtar_response", "Yanit uretilemedi"))
    _safe_print("=" * 60)


if __name__ == "__main__":
    import asyncio
    asyncio.run(run_demo())
