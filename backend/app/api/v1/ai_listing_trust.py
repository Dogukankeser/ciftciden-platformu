"""
Ilan Guven Skoru API Endpoint'i
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
POST /api/v1/ai/listing-trust — Ilan fotografi + metin/ozellik analizi
"""

import json
import sys
from pathlib import Path

from fastapi import APIRouter, File, Form, UploadFile

from app.schemas.ai_responses import ListingTrustResponse

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent.parent))

router = APIRouter(prefix="/ai", tags=["AI — Ilan Guven Analizi"])


@router.post(
    "/listing-trust",
    response_model=ListingTrustResponse,
    summary="Ilan guven skoru analizi",
    description="Ilanin fotografini, aciklamasini ve ozelliklerini birlikte okuyarak kartta gosterilecek guven skorunu uretir.",
)
async def analyze_listing_trust_endpoint(
    payload: str = Form(...),
    image: UploadFile | None = File(None),
):
    try:
        listing_payload = json.loads(payload)
    except json.JSONDecodeError:
        listing_payload = {}

    image_bytes = await image.read() if image else None
    mime_type = image.content_type if image else "image/jpeg"

    from ai_services.listing_trust.analyzer import analyze_listing_trust

    result = await analyze_listing_trust(listing_payload, image_bytes, mime_type=mime_type or "image/jpeg")
    return ListingTrustResponse(**result)
