"""
Güven Skoru Guardrails
~~~~~~~~~~~~~~~~~~~~~
Güven skoru çıktısını valide eder.
Tutarsız skor-risk etiketi kombinasyonlarını engeller.
"""

from ai_services.config import ai_config
from ai_services.shared.schemas import TrustScoreResult
from ai_services.trust_score.algorithm import trust_algorithm
from ai_services.trust_score.risk_classifier import classify_risk


def calculate_and_validate(
    merchant_id: str,
    successful_transactions: int,
    total_transaction_volume: float,
    avg_payment_speed_days: float,
    is_registry_verified: bool,
    reviews: list[dict] | None = None,
) -> TrustScoreResult:
    """
    Güven skorunu hesaplar, risk sınıflandırması yapar ve
    Guardrails validasyonundan geçirir.

    Tek giriş noktası: Bu fonksiyon dışarıdan çağrılır.
    """
    # Skor hesapla
    score_data = trust_algorithm.calculate(
        successful_transactions=successful_transactions,
        total_transaction_volume=total_transaction_volume,
        avg_payment_speed_days=avg_payment_speed_days,
        is_registry_verified=is_registry_verified,
        reviews=reviews,
    )

    # Risk sınıflandır
    risk_data = classify_risk(
        overall_score=score_data["overall_score"],
        details=score_data["details"],
    )

    # --- Guardrail: Skor-risk tutarlılığı kontrolü ---
    overall = score_data["overall_score"]
    label = risk_data["risk_label"]

    # Skor 7+ ama label warning/restricted ise düzelt
    if overall >= ai_config.TRUST_RISK_THRESHOLD and label != "normal":
        label = "normal"

    # Skor < 7 ama label normal ise düzelt
    if overall < ai_config.TRUST_RISK_THRESHOLD and label == "normal":
        label = "warning"

    # Skor < 5 ama label warning ise → restricted olmalı
    if overall < 5.0 and label == "warning":
        label = "restricted"

    # --- Guardrail: Skor sınır kontrolü ---
    overall = max(ai_config.TRUST_SCORE_MIN, min(overall, ai_config.TRUST_SCORE_MAX))

    # Pydantic validasyonu (son savunma hattı)
    result = TrustScoreResult(
        merchant_id=merchant_id,
        overall_score=overall,
        transaction_score=score_data["transaction_score"],
        payment_score=score_data["payment_score"],
        review_score=score_data["review_score"],
        risk_label=label,
        risk_factors=risk_data["risk_factors"],
        explanation=risk_data["explanation"],
    )

    return result
