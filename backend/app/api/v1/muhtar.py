"""
Dijital Muhtar API Endpoint'leri
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
POST /api/v1/muhtar/analyze — Metin + fotoğraf analizi (ana endpoint)
POST /api/v1/muhtar/ask    — Sadece metin sorusu
GET  /api/v1/muhtar/demo   — Kayısı Çil Hastalığı demo senaryosu
GET  /api/v1/muhtar/health — Muhtar modülü sağlık kontrolü
"""

import sys
import uuid
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from app.schemas.muhtar import (
    MuhtarAskRequest,
    MuhtarResponse,
)

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent.parent))

router = APIRouter(prefix="/muhtar", tags=["🌿 Dijital Muhtar — AI Asistan"])


def infer_plant_city(text: str, plant: str | None, city: str | None) -> tuple[str | None, str | None]:
    lower = text.lower()
    if not plant:
        plant_map = {
            "kay": "kayısı",
            "domates": "domates",
            "elma": "elma",
            "buğday": "buğday",
            "bugday": "buğday",
            "üzüm": "üzüm",
            "uzum": "üzüm",
            "antep": "antep fıstığı",
            "fıstık": "antep fıstığı",
            "fistik": "antep fıstığı",
            "zeytin": "zeytin",
            "fındık": "fındık",
            "findik": "fındık",
        }
        for keyword, value in plant_map.items():
            if keyword in lower:
                plant = value
                break
    if not city:
        city_map = ["Malatya", "Elazığ", "Iğdır", "Mersin", "Antalya", "Isparta", "Amasya"]
        for value in city_map:
            if value.lower() in lower:
                city = value
                break
    return plant, city


@router.post(
    "/analyze",
    response_model=MuhtarResponse,
    summary="Metin + fotoğraf analizi",
    description=(
        "Çiftçinin paylaşımını (metin + opsiyonel fotoğraf) analiz eder. "
        "Hastalık teşhisi, tedavi önerisi ve tarımsal danışmanlık sağlar."
    ),
)
async def analyze_post(
    text: str = Form(..., description="Çiftçinin mesajı"),
    plant: str | None = Form(None, description="Bitki türü"),
    city: str | None = Form(None, description="İl bilgisi"),
    image: UploadFile | None = File(None, description="Ürün fotoğrafı"),
):
    """
    🌿 Muhtar Ana Analiz Endpoint'i

    Çiftçinin paylaşımını alır ve:
    - Fotoğraf varsa → Gemini Vision ile hastalık teşhisi
    - Sadece metin → RAG destekli tarımsal danışmanlık
    - Guardrails ile güvenlik filtreleme

    **Confidence < %80 → Ziraat mühendisine yönlendirme!**
    """
    try:
        from ai_services.muhtar.event_listener import muhtar_listener

        image_bytes = None
        media_type = "image/jpeg"
        if image:
            image_bytes = await image.read()
            media_type = image.content_type or "image/jpeg"
        plant, city = infer_plant_city(text, plant, city)

        post_data = {
            "post_id": f"post-{uuid.uuid4().hex[:8]}",
            "user_name": "Anonim Çiftçi",
            "text": text,
            "image_bytes": image_bytes,
            "media_type": media_type,
            "plant": plant,
            "city": city,
        }

        result = await muhtar_listener.on_new_post(post_data)
        return MuhtarResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Muhtar analiz hatası: {str(e)}",
        )


@router.post(
    "/ask",
    response_model=MuhtarResponse,
    summary="Muhtar'a soru sor",
    description="Sadece metin tabanlı tarımsal soru-cevap.",
)
async def ask_muhtar(request: MuhtarAskRequest):
    """
    🌿 Muhtar Soru-Cevap

    Çiftçi tarımla ilgili herhangi bir soru sorar,
    Muhtar RAG destekli yanıt verir.
    """
    try:
        from ai_services.muhtar.event_listener import muhtar_listener
        plant, city = infer_plant_city(request.question, request.plant, request.city)

        post_data = {
            "post_id": f"ask-{uuid.uuid4().hex[:8]}",
            "user_name": "Anonim Çiftçi",
            "text": request.question,
            "image_bytes": None,
            "plant": plant,
            "city": city,
        }

        result = await muhtar_listener.on_new_post(post_data)
        return MuhtarResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Muhtar soru-cevap hatası: {str(e)}",
        )


@router.get(
    "/demo",
    response_model=MuhtarResponse,
    summary="Demo — Kayısı Çil Hastalığı",
    description=(
        "Jüri sunumu için hazırlanmış demo senaryosu. "
        "Malatya'dan bir çiftçinin kayısı hastalığı sorusunu simüle eder."
    ),
)
async def muhtar_demo():
    """
    🎬 Hackathon Demo Senaryosu

    Senaryo: Malatyalı çiftçi Mehmet Bey, kayısı yapraklarındaki
    kahverengi lekelerden şikayet ediyor.

    Bu endpoint fotoğraf yüklemeden tam bir Muhtar yanıtı döndürür.
    """
    try:
        from ai_services.muhtar.event_listener import muhtar_listener

        demo_post = {
            "post_id": "demo-kayisi-cil-001",
            "user_name": "Mehmet Yılmaz",
            "text": (
                "Kayısı ağacımın yaprakları sarardı ve üzerinde "
                "kahverengi-mor lekeler var. Meyvelerde de küçük "
                "çukurlaşmalar oluştu. Buna ne oldu? Ne yapmalıyım?"
            ),
            "image_bytes": None,
            "plant": "kayısı",
            "city": "Malatya",
        }

        result = await muhtar_listener.on_new_post(demo_post)
        return MuhtarResponse(**result)

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Demo hatası: {str(e)}",
        )


@router.get(
    "/health",
    summary="Muhtar modülü sağlık kontrolü",
    description="Muhtar AI modülünün durumunu kontrol eder.",
)
async def muhtar_health():
    """Muhtar modülü sağlık kontrolü."""
    try:
        from ai_services.muhtar.gemini_client import gemini_client
        from ai_services.muhtar.rag_engine import get_disease_db

        disease_db = get_disease_db()
        disease_count = len(disease_db.get("hastaliklar", []))

        return {
            "status": "healthy",
            "module": "dijital_muhtar",
            "gemini_api": "connected" if gemini_client.is_live else "mock_mode",
            "rag_database": {
                "disease_count": disease_count,
                "status": "loaded" if disease_count > 0 else "empty",
            },
            "guardrails": "active",
            "persona": "muhtar_v1",
        }
    except Exception as e:
        return {
            "status": "degraded",
            "module": "dijital_muhtar",
            "error": str(e),
        }
