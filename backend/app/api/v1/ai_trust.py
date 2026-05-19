"""
AI Güven Skoru API Endpoint'i
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
GET  /api/v1/ai/trust/{merchant_id} — Tüccar güven skoru hesapla
POST /api/v1/ai/trust — Manuel parametrelerle hesapla
"""

import sys
from pathlib import Path
from fastapi import APIRouter, HTTPException

from app.schemas.ai_responses import TrustScoreRequest, TrustScoreResponse
from app.services.mock_data_store import mock_store

sys.path.insert(0, str(Path(__file__).parent.parent.parent.parent.parent))

router = APIRouter(prefix="/ai", tags=["AI — Güven Skoru"])


@router.get(
    "/trust/{merchant_id}",
    response_model=TrustScoreResponse,
    summary="Tüccar güven skoru",
    description="Tüccarın platform verilerine dayalı güven skorunu hesaplar.",
)
async def get_trust_score(merchant_id: str):
    """
    🛡️ Güven Skoru Algoritması

    İşlem hacmi (%40), ödeme hızı & sicil (%40) ve
    çiftçi değerlendirmeleri (%20) ağırlıklı skor hesaplar.

    **7.0 altı = Risk etiketi basılır!**
    """
    merchant = mock_store.get_merchant(merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Tüccar bulunamadı")

    try:
        from ai_services.trust_score.guardrails import calculate_and_validate

        reviews = mock_store.get_merchant_reviews(merchant_id)
        review_dicts = [{"rating": r["rating"]} for r in reviews]

        result = calculate_and_validate(
            merchant_id=merchant_id,
            successful_transactions=merchant.get("successful_transactions", 0),
            total_transaction_volume=merchant.get("total_transaction_volume", 0),
            avg_payment_speed_days=merchant.get("avg_payment_speed_days", 0),
            is_registry_verified=merchant.get("is_registry_verified", False),
            reviews=review_dicts if review_dicts else None,
        )
        from ai_services.trust_score.gemini_trust import refine_trust_with_gemini

        result = await refine_trust_with_gemini(
            local_result=result,
            merchant_payload={
                "successful_transactions": merchant.get("successful_transactions", 0),
                "total_transaction_volume": merchant.get("total_transaction_volume", 0),
                "avg_payment_speed_days": merchant.get("avg_payment_speed_days", 0),
                "is_registry_verified": merchant.get("is_registry_verified", False),
                "review_count": len(review_dicts),
                "reviews": review_dicts[:8],
            },
        )

        return TrustScoreResponse(
            merchant_id=result.merchant_id,
            overall_score=result.overall_score,
            transaction_score=result.transaction_score,
            payment_score=result.payment_score,
            review_score=result.review_score,
            risk_label=result.risk_label,
            risk_factors=result.risk_factors,
            explanation=result.explanation,
        )
    except Exception as e:
        # Graceful Degradation - AI Modülü çökerse varsayılan güvenli değerler dön
        return TrustScoreResponse(
            merchant_id=merchant_id,
            overall_score=5.0,
            transaction_score=5.0,
            payment_score=5.0,
            review_score=5.0,
            risk_label="Bilinmiyor (Bağlantı Hatası)",
            risk_factors=["Sistem değerlendirme yapamadı."],
            explanation="Muhtar güvenilirlik kayıtlarını inceliyor, lütfen daha sonra tekrar kontrol edin."
        )
