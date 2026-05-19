"""
Güven Skoru Algoritması
~~~~~~~~~~~~~~~~~~~~~~
Ağırlıklı skor hesaplama (Weighted Scoring) sistemi.

Formül:
    Trust Score = (İşlem Hacmi Skoru × 0.40) +
                  (Ödeme & Sicil Skoru × 0.40) +
                  (Çiftçi Değerlendirme Skoru × 0.20)

Her alt skor 0-10 arasında hesaplanır.
Toplam skor da 0-10 arasında olur.
"""

import numpy as np

from ai_services.config import ai_config
from ai_services.shared.utils import clamp


# Platform ortalamaları (mock baseline değerler)
PLATFORM_AVG_TRANSACTIONS = 50
PLATFORM_AVG_VOLUME = 500_000  # TL


class TrustScoreAlgorithm:
    """
    Tüccar Güven Skoru hesaplama algoritması.
    Basit yıldız/yoruma dayalı değil — çok parametreli matematiksel model.
    """

    def __init__(self):
        self.w_transaction = ai_config.TRUST_WEIGHT_TRANSACTION  # 0.40
        self.w_payment = ai_config.TRUST_WEIGHT_PAYMENT          # 0.40
        self.w_review = ai_config.TRUST_WEIGHT_REVIEW            # 0.20

    def calculate(
        self,
        successful_transactions: int,
        total_transaction_volume: float,
        avg_payment_speed_days: float,
        is_registry_verified: bool,
        reviews: list[dict] | None = None,
    ) -> dict:
        """
        Güven skorunu hesaplar.

        Args:
            successful_transactions: Başarılı işlem sayısı
            total_transaction_volume: Toplam işlem hacmi (TL)
            avg_payment_speed_days: Ortalama ödeme hızı (gün)
            is_registry_verified: Ticaret sicil onaylı mı
            reviews: Çiftçi değerlendirmeleri [{"rating": 1-5, ...}]

        Returns:
            dict: Detaylı skor bilgisi
        """
        reviews = reviews or []

        # --- Alt Skor 1: İşlem Hacmi (%40) ---
        transaction_score = self._calc_transaction_score(
            successful_transactions, total_transaction_volume
        )

        # --- Alt Skor 2: Ödeme & Sicil (%40) ---
        payment_score = self._calc_payment_score(
            avg_payment_speed_days, is_registry_verified
        )

        # --- Alt Skor 3: Çiftçi Değerlendirmeleri (%20) ---
        review_score = self._calc_review_score(reviews)

        # --- Toplam Ağırlıklı Skor ---
        overall = (
            transaction_score * self.w_transaction +
            payment_score * self.w_payment +
            review_score * self.w_review
        )
        overall = round(clamp(overall, 0.0, 10.0), 1)

        return {
            "overall_score": overall,
            "transaction_score": round(transaction_score, 1),
            "payment_score": round(payment_score, 1),
            "review_score": round(review_score, 1),
            "weights": {
                "transaction": self.w_transaction,
                "payment": self.w_payment,
                "review": self.w_review,
            },
            "details": {
                "successful_transactions": successful_transactions,
                "total_volume_tl": total_transaction_volume,
                "avg_payment_days": avg_payment_speed_days,
                "registry_verified": is_registry_verified,
                "review_count": len(reviews),
                "avg_rating": round(np.mean([r["rating"] for r in reviews]), 1) if reviews else 0,
            },
        }

    def _calc_transaction_score(
        self, successful_transactions: int, total_volume: float
    ) -> float:
        """
        İşlem hacmi skoru (0-10).
        Hem işlem sayısı hem de toplam hacmi dikkate alır.
        """
        # İşlem sayısı skoru (platfrom ortalamasına göre)
        tx_ratio = successful_transactions / PLATFORM_AVG_TRANSACTIONS
        tx_score = min(10.0, tx_ratio * 10.0)

        # Hacim skoru
        vol_ratio = total_volume / PLATFORM_AVG_VOLUME
        vol_score = min(10.0, vol_ratio * 10.0)

        # İkisinin ortalaması
        combined = (tx_score * 0.6 + vol_score * 0.4)

        # Yeni tüccar bonusu/cezası
        if successful_transactions < 5:
            combined = min(combined, 5.0)  # Yeni tüccar max 5 alabilir

        return clamp(combined, 0.0, 10.0)

    def _calc_payment_score(
        self, avg_payment_days: float, is_verified: bool
    ) -> float:
        """
        Ödeme hızı & sicil doğrulama skoru (0-10).

        Ödeme hızı skalası:
          ≤ 3 gün → 5.0 puan
          ≤ 7 gün → 3.0 puan
          ≤ 14 gün → 1.5 puan
          > 14 gün → 0.5 puan

        Sicil onayı: +5.0 puan
        """
        # Ödeme hızı puanı (max 5.0)
        if avg_payment_days <= 3:
            speed_score = 5.0
        elif avg_payment_days <= 7:
            speed_score = 3.0
        elif avg_payment_days <= 14:
            speed_score = 1.5
        else:
            speed_score = 0.5

        # Sicil doğrulama puanı (max 5.0)
        registry_score = 5.0 if is_verified else 0.0

        return clamp(speed_score + registry_score, 0.0, 10.0)

    def _calc_review_score(self, reviews: list[dict]) -> float:
        """
        Çiftçi değerlendirme skoru (0-10).
        5 üzerinden puanı 10'a normalize eder.
        Minimum 3 değerlendirme olmalı, yoksa nötr skor verir.
        """
        if not reviews or len(reviews) < 3:
            return 5.0  # Yetersiz veri → nötr skor

        ratings = [r["rating"] for r in reviews]
        avg = np.mean(ratings)

        # 5 üzerinden → 10 üzerinden normalize
        score = avg * 2.0

        # Değerlendirme sayısı az ise güveni düşür
        if len(reviews) < 5:
            score = score * 0.9  # %10 ceza

        return clamp(score, 0.0, 10.0)


# Singleton instance
trust_algorithm = TrustScoreAlgorithm()
