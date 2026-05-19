"""
Veri Ön İşleme Modülü
~~~~~~~~~~~~~~~~~~~~~
Mock data'dan gelen ham verileri ML modeline beslenecek
feature matrix'e dönüştürür.

Faktörler:
  - Hal fiyat geçmişi (son 30 gün ortalaması, trendi)
  - Bölgesel arz-talep simülasyonu
  - Mevsimsellik katsayısı
  - Enflasyon etkisi simülasyonu
"""

import json
from datetime import datetime
from pathlib import Path

import numpy as np

DATA_DIR = Path(__file__).parent.parent.parent / "mock_data" / "data"

# Ay bazında mevsimsellik katsayıları (1.0 = normal)
SEASONALITY = {
    "kayısı": {6: 1.0, 7: 0.95, 8: 1.10, 9: 1.20, 10: 1.30, "default": 1.15},
    "domates": {4: 1.05, 5: 0.95, 6: 0.85, 7: 0.80, 8: 0.85, 9: 0.90, 10: 1.0, "default": 1.10},
    "biber": {5: 1.0, 6: 0.90, 7: 0.85, 8: 0.90, 9: 1.0, "default": 1.15},
    "elma": {8: 0.90, 9: 0.85, 10: 0.90, 11: 1.0, "default": 1.10},
    "portakal": {11: 1.0, 12: 0.95, 1: 0.90, 2: 0.95, 3: 1.0, 4: 1.05, "default": 1.20},
    "üzüm": {8: 0.95, 9: 0.90, 10: 1.0, "default": 1.15},
}

# Bölgesel arz-talep simülasyonu (üretim yoğunluğu düşük = fiyat yüksek)
REGIONAL_DEMAND = {
    "Malatya": {"kayısı": 0.90},  # Ana üretici → arz yüksek → fiyat biraz düşük
    "Elazığ": {"kayısı": 0.95},
    "Antalya": {"domates": 0.85, "biber": 0.90},  # Sera bölgesi → bol arz
    "Mersin": {"domates": 0.88, "portakal": 0.85},
    "İstanbul": {},  # Tüketim merkezi → her şey pahalı (default 1.10)
    "Ankara": {},
}


def get_seasonality_factor(category: str, month: int | None = None) -> float:
    """Mevsimsellik katsayısını döndürür."""
    if month is None:
        month = datetime.now().month

    cat_seasons = SEASONALITY.get(category, {})
    return cat_seasons.get(month, cat_seasons.get("default", 1.0))


def get_regional_factor(city: str, category: str) -> float:
    """Bölgesel arz-talep katsayısını döndürür."""
    city_factors = REGIONAL_DEMAND.get(city, {})
    return city_factors.get(category, 1.05)  # Bilinmeyen bölge = hafif yüksek


def simulate_inflation_factor(base_year: int = 2025) -> float:
    """Basit enflasyon simülasyonu. Yıllık %35 varsayımı."""
    current_year = datetime.now().year
    years_diff = current_year - base_year
    annual_rate = 0.35
    return (1 + annual_rate) ** years_diff


def load_price_history(category: str) -> dict | None:
    """Mock fiyat geçmişi verilerini yükler."""
    try:
        with open(DATA_DIR / "price_history.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("fiyat_gecmisi", {}).get(category)
    except (FileNotFoundError, json.JSONDecodeError):
        return None


def load_catalog_info(category: str, variety: str | None = None) -> dict | None:
    """Ürün katalog bilgilerini yükler."""
    try:
        with open(DATA_DIR / "products_catalog.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        for cat in data.get("kategoriler", []):
            if cat["kategori"] == category:
                if variety:
                    for cesit in cat.get("cesitler", []):
                        if cesit["ad"] == variety:
                            return cesit
                    # Çeşit bulunamazsa ilk çeşidi döndür
                    return cat["cesitler"][0] if cat["cesitler"] else None
                return cat["cesitler"][0] if cat["cesitler"] else None
    except (FileNotFoundError, json.JSONDecodeError):
        return None
    return None


def extract_features(
    category: str,
    variety: str | None,
    city: str,
    quality_grade: str = "1. Kalite",
    quantity_kg: float = 100.0,
) -> dict:
    """
    Tüm faktörleri birleştirerek feature dictionary oluşturur.
    ML modeline ve rule-based tahmine girdi sağlar.
    """
    # Katalog bilgisi
    catalog = load_catalog_info(category, variety)
    base_price = catalog["ort_fiyat"] if catalog else 30.0
    price_floor = catalog["alt"] if catalog else base_price * 0.7
    price_ceiling = catalog["ust"] if catalog else base_price * 1.4

    # Fiyat geçmişi
    history = load_price_history(category)
    if history and history.get("gunluk_fiyatlar"):
        prices = history["gunluk_fiyatlar"]
        recent_avg = np.mean([p["ortalama"] for p in prices[-7:]])  # Son 7 gün
        overall_avg = np.mean([p["ortalama"] for p in prices])
        trend = float((recent_avg - overall_avg) / overall_avg) if overall_avg > 0 else 0.0
    else:
        recent_avg = base_price
        overall_avg = base_price
        trend = 0.0

    # Faktörler
    seasonality = get_seasonality_factor(category)
    regional = get_regional_factor(city, category)
    inflation = simulate_inflation_factor()
    quality_multiplier = 1.0 if quality_grade == "1. Kalite" else 0.75
    volume_discount = 1.0 - min(0.10, quantity_kg / 50000)  # Toptan indirim

    return {
        "base_price": base_price,
        "price_floor": price_floor,
        "price_ceiling": price_ceiling,
        "recent_avg": float(recent_avg),
        "overall_avg": float(overall_avg),
        "trend": trend,
        "seasonality_factor": seasonality,
        "regional_factor": regional,
        "inflation_factor": inflation,
        "quality_multiplier": quality_multiplier,
        "volume_discount": volume_discount,
        "category": category,
        "variety": variety or "Genel",
        "city": city,
    }
