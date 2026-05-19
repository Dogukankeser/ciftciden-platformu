"""
Risk Sınıflandırıcı
~~~~~~~~~~~~~~~~~~
Güven skoruna göre tüccarları sınıflandırır ve
uygun kısıtlamaları belirler.

Eşikler:
  ≥ 7.0 → "normal" (tam erişim)
  5.0-6.9 → "warning" (uyarı gösterilir)
  < 5.0 → "restricted" (işlem kısıtlı)
"""

from ai_services.config import ai_config


def classify_risk(overall_score: float, details: dict) -> dict:
    """
    Güven skoruna ve detaylara göre risk sınıflandırması yapar.

    Returns:
        dict: {
            "risk_label": str,
            "risk_factors": list[str],
            "restrictions": list[str],
            "explanation": str,
        }
    """
    risk_factors = []
    restrictions = []

    # --- Risk faktörlerini tespit et ---
    if not details.get("registry_verified", False):
        risk_factors.append("Ticaret sicil kaydı doğrulanmamış")

    if details.get("avg_payment_days", 0) > 14:
        risk_factors.append(f"Ödeme süresi çok yüksek ({details['avg_payment_days']:.0f} gün)")
    elif details.get("avg_payment_days", 0) > 7:
        risk_factors.append(f"Ödeme süresi ortalamanın üstünde ({details['avg_payment_days']:.1f} gün)")

    if details.get("successful_transactions", 0) < 5:
        risk_factors.append("Platform üzerinde yeterli işlem geçmişi yok")

    if details.get("avg_rating", 0) > 0 and details["avg_rating"] < 3.0:
        risk_factors.append(f"Çiftçi değerlendirmeleri düşük ({details['avg_rating']:.1f}/5)")

    # --- Risk etiketi belirle ---
    if overall_score >= ai_config.TRUST_RISK_THRESHOLD:  # 7.0
        risk_label = "normal"
        explanation = (
            f"Bu tüccar {overall_score:.1f}/10 güven skoruyla güvenilir "
            f"kategorisindedir. Platformdaki işlem geçmişi olumludur."
        )
    elif overall_score >= 5.0:
        risk_label = "warning"
        restrictions.append("Yeni işlem başlatırken çiftçiye uyarı gösterilir")
        restrictions.append("Maksimum işlem tutarı sınırlandırılmıştır")
        explanation = (
            f"⚠️ Bu tüccar {overall_score:.1f}/10 güven skoru ile dikkat "
            f"gerektiren kategoridedir. İşlem yapmadan önce risk "
            f"faktörlerini incelemenizi öneririz."
        )
    else:
        risk_label = "restricted"
        restrictions.append("Yeni işlem başlatması kısıtlanmıştır")
        restrictions.append("Sadece ön ödemeli işlem yapabilir")
        restrictions.append("Platform tarafından denetim altındadır")
        explanation = (
            f"🚫 Bu tüccar {overall_score:.1f}/10 güven skoru ile kısıtlı "
            f"kategoridedir. Güvenilirlik kriterleri karşılanmamaktadır."
        )

    return {
        "risk_label": risk_label,
        "risk_factors": risk_factors,
        "restrictions": restrictions,
        "explanation": explanation,
    }
