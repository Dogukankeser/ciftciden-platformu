"""
Fiyat Tahmin Servisi (Predictor)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Model çıktısını Guardrails'den geçirip kullanıcıya sunulacak
formatta döndüren ana servis sınıfı.
"""

from ai_services.config import ai_config
from ai_services.fair_price_engine.model import FairPriceModel
from ai_services.fair_price_engine.guardrails import validate_price_output
from ai_services.shared.schemas import PriceEstimationResult


class FairPricePredictor:
    """Adil fiyat tahmin servisi. Model + Guardrails entegrasyonu."""

    def __init__(self):
        self.model = FairPriceModel()

    def predict(
        self,
        category: str,
        variety: str | None = None,
        city: str = "Malatya",
        quality_grade: str = "1. Kalite",
        quantity_kg: float = 100.0,
    ) -> PriceEstimationResult:
        """
        Adil fiyat tahmini yapar ve Guardrails'den geçirir.

        Args:
            category: Ürün kategorisi (kayısı, domates, vb.)
            variety: Ürün çeşidi (Hacıhaliloğlu, Cherry, vb.)
            city: Bölge/İl
            quality_grade: Kalite derecesi
            quantity_kg: Miktar (kg)

        Returns:
            PriceEstimationResult: Valide edilmiş fiyat tahmini

        Raises:
            ValueError: Guardrails validasyonu başarısız olursa
        """
        # Model tahmini
        raw_result = self.model.predict(
            category=category,
            variety=variety,
            city=city,
            quality_grade=quality_grade,
            quantity_kg=quantity_kg,
        )

        # Kullanıcıya gösterilecek açıklama
        explanation = (
            f"Algoritmamız {city} bölgesindeki {variety or category} için "
            f"adil fiyatı {raw_result['min_price']:.1f} TL - {raw_result['max_price']:.1f} TL "
            f"olarak hesaplamıştır. "
            f"(Güven seviyesi: %{raw_result['confidence'] * 100:.0f})"
        )

        # Guardrails'den geçir
        validated = validate_price_output(
            category=category,
            variety=variety or "Genel",
            city=city,
            min_price=raw_result["min_price"],
            max_price=raw_result["max_price"],
            confidence=raw_result["confidence"],
            factors=raw_result["factors"],
            explanation=explanation,
            model_version=raw_result["model_version"],
        )

        return validated


# Singleton instance
fair_price_predictor = FairPricePredictor()
