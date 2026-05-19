"""
Mock Data Servis Katmanı
~~~~~~~~~~~~~~~~~~~~~~~~
PostgreSQL olmadan hackathon demo'su yapabilmek için
generated_mock_data.json'dan veri okur.
Tüm CRUD servisleri bu dosyayı veri kaynağı olarak kullanır.
"""

import json
from pathlib import Path
from functools import lru_cache

MOCK_DATA_PATH = Path(__file__).parent.parent.parent.parent / "mock_data" / "data" / "generated_mock_data.json"


class MockDataStore:
    """Bellekte tutulan mock veri deposu."""

    def __init__(self):
        self._data: dict = {}
        self._loaded = False

    def _ensure_loaded(self):
        if not self._loaded:
            self.reload()

    def reload(self):
        """Mock data'yı diskten yükler."""
        if MOCK_DATA_PATH.exists():
            with open(MOCK_DATA_PATH, "r", encoding="utf-8") as f:
                self._data = json.load(f)
            self._loaded = True
        else:
            self._data = {
                "farmers": [], "merchants": [], "products": [],
                "transactions": [], "reviews": [],
            }
            self._loaded = True

    @property
    def farmers(self) -> list[dict]:
        self._ensure_loaded()
        return self._data.get("farmers", [])

    @property
    def merchants(self) -> list[dict]:
        self._ensure_loaded()
        return self._data.get("merchants", [])

    @property
    def products(self) -> list[dict]:
        self._ensure_loaded()
        return self._data.get("products", [])

    @property
    def transactions(self) -> list[dict]:
        self._ensure_loaded()
        return self._data.get("transactions", [])

    @property
    def reviews(self) -> list[dict]:
        self._ensure_loaded()
        return self._data.get("reviews", [])

    def get_farmer(self, farmer_id: str) -> dict | None:
        return next((f for f in self.farmers if f["id"] == farmer_id), None)

    def get_merchant(self, merchant_id: str) -> dict | None:
        return next((m for m in self.merchants if m["id"] == merchant_id), None)

    def get_product(self, product_id: str) -> dict | None:
        return next((p for p in self.products if p["id"] == product_id), None)

    def get_merchant_reviews(self, merchant_id: str) -> list[dict]:
        return [r for r in self.reviews if r["merchant_id"] == merchant_id]

    def get_farmer_products(self, farmer_id: str) -> list[dict]:
        return [p for p in self.products if p["farmer_id"] == farmer_id]

    def get_merchant_transactions(self, merchant_id: str) -> list[dict]:
        return [t for t in self.transactions if t["merchant_id"] == merchant_id]

    def filter_products(
        self,
        category: str | None = None,
        city: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        quality_grade: str | None = None,
        status: str = "active",
    ) -> list[dict]:
        """Ürünleri filtreler."""
        result = self.products
        if status:
            result = [p for p in result if p.get("status") == status]
        if category:
            result = [p for p in result if p.get("category") == category]
        if city:
            result = [p for p in result if p.get("city") == city]
        if min_price is not None:
            result = [p for p in result if p.get("asking_price_per_kg", 0) >= min_price]
        if max_price is not None:
            result = [p for p in result if p.get("asking_price_per_kg", 0) <= max_price]
        if quality_grade:
            result = [p for p in result if p.get("quality_grade") == quality_grade]
        return result


# Singleton
mock_store = MockDataStore()
