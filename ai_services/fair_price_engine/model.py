"""
Fiyat Tahmin Modeli
~~~~~~~~~~~~~~~~~~~
Hibrit model: Rule-based hesaplama + istatistiksel dağılım.
Hackathon için gerçekçi ve açıklanabilir sonuçlar üretir.

Not: Gerçek üretimde scikit-learn Random Forest veya
Gradient Boosting ile eğitilmiş bir model kullanılır.
Burada mock data üzerinde çalışan deterministik bir
algoritma kullanıyoruz — jüriye açıklanabilirlik sağlar.
"""

import numpy as np

from ai_services.fair_price_engine.data_processor import extract_features
from ai_services.shared.utils import calculate_confidence_interval


class FairPriceModel:
    """
    Adil fiyat tahmin modeli.

    Çalışma prensibi:
    1. Temel fiyatı katalogdan al
    2. Mevsimsellik, bölgesel arz-talep, enflasyon faktörleriyle ayarla
    3. Monte Carlo simülasyonu ile olasılık dağılımı oluştur
    4. Güven aralığı hesapla
    """

    MODEL_VERSION = "v1.0"

    def predict(
        self,
        category: str,
        variety: str | None = None,
        city: str = "Malatya",
        quality_grade: str = "1. Kalite",
        quantity_kg: float = 100.0,
    ) -> dict:
        """
        Fiyat tahmini yapar.

        Returns:
            dict: {
                "min_price": float,
                "max_price": float,
                "mean_price": float,
                "confidence": float,
                "factors": dict,
                "simulations": list[float],
            }
        """
        # Feature'ları çıkar
        features = extract_features(category, variety, city, quality_grade, quantity_kg)

        # Temel fiyat hesaplama
        adjusted_price = (
            features["recent_avg"]
            * features["seasonality_factor"]
            * features["regional_factor"]
            * features["quality_multiplier"]
            * features["volume_discount"]
        )

        # Monte Carlo simülasyonu (1000 iterasyon)
        np.random.seed(42)  # Tekrarlanabilirlik için
        noise_std = adjusted_price * 0.08  # %8 standart sapma
        simulations = np.random.normal(adjusted_price, noise_std, 1000)

        # Negatif fiyatları filtrele
        simulations = simulations[simulations > 0]

        # Fiyat tabanı ve tavanı kontrolü
        price_floor = features["price_floor"] * features["quality_multiplier"]
        price_ceiling = features["price_ceiling"] * features["quality_multiplier"]
        simulations = np.clip(simulations, price_floor * 0.9, price_ceiling * 1.1)

        # Güven aralığı
        lower, upper, mean = calculate_confidence_interval(
            simulations.tolist(), confidence=0.95
        )

        # Güven seviyesi (veri kalitesine göre)
        confidence = self._calculate_confidence(features)

        return {
            "min_price": round(lower, 1),
            "max_price": round(upper, 1),
            "mean_price": round(mean, 1),
            "confidence": confidence,
            "factors": {
                "temel_fiyat": round(features["base_price"], 2),
                "son_7_gun_ortalama": round(features["recent_avg"], 2),
                "mevsimsellik": round(features["seasonality_factor"], 3),
                "bolgesel_arz_talep": round(features["regional_factor"], 3),
                "kalite_carpani": features["quality_multiplier"],
                "hacim_indirimi": round(features["volume_discount"], 3),
                "trend": f"{features['trend']:+.1%}",
            },
            "simulations_count": len(simulations),
            "model_version": self.MODEL_VERSION,
        }

    def _calculate_confidence(self, features: dict) -> float:
        """
        Model güven seviyesini hesaplar.
        Daha fazla veri = daha yüksek güven.
        """
        confidence = 0.70  # Base confidence

        # Fiyat geçmişi varsa güven artar
        if features["recent_avg"] != features["base_price"]:
            confidence += 0.10

        # Trend stabil ise güven artar
        if abs(features["trend"]) < 0.05:
            confidence += 0.08
        elif abs(features["trend"]) < 0.10:
            confidence += 0.04

        # Bilinen bölge ise güven artar
        if features["regional_factor"] != 1.05:
            confidence += 0.07

        return round(min(confidence, 0.98), 2)
