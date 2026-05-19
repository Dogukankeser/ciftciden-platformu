"""
RAG Engine — Tarımsal Bilgi Tabanı Erişimi
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Muhtar'ın sorulara cevap verirken kullanacağı
Retrieval-Augmented Generation motoru.

Mock veri tabanlarından (hastalık, fiyat, hava durumu)
ilgili bilgileri çeker ve Gemini'ye zenginleştirilmiş
prompt oluşturur.
"""

import json
from pathlib import Path

# ─── Veri Dosyaları ─────────────────────────────────────────────────
DATA_DIR = Path(__file__).parent.parent.parent / "mock_data" / "data"


def _load_json(filename: str) -> dict:
    """JSON veri dosyasını yükler."""
    filepath = DATA_DIR / filename
    if not filepath.exists():
        return {}
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


# ─── Lazy-loaded veri cache ────────────────────────────────────────
_cache: dict = {}


def _get_data(key: str, filename: str) -> dict:
    """Veriyi cache'den veya dosyadan yükler."""
    if key not in _cache:
        _cache[key] = _load_json(filename)
    return _cache[key]


def get_disease_db() -> dict:
    return _get_data("diseases", "disease_database.json")


def get_weather_db() -> dict:
    return _get_data("weather", "weather_data.json")


def get_market_db() -> dict:
    return _get_data("market", "market_prices.json")


# ─── Hastalık Arama ────────────────────────────────────────────────
def search_diseases(query: str, plant: str | None = None) -> list[dict]:
    """
    Sorguya göre hastalık veri tabanında arama yapar.
    Keyword eşleştirmesi ile en alakalı hastalıkları döndürür.
    """
    db = get_disease_db()
    hastaliklar = db.get("hastaliklar", [])
    query_lower = query.lower()
    results = []

    for h in hastaliklar:
        score = 0
        # Bitki eşleşmesi (yüksek ağırlık)
        if plant and plant.lower() in h.get("bitki", "").lower():
            score += 10

        # Hastalık adı eşleşmesi
        if any(word in h.get("ad", "").lower() for word in query_lower.split()):
            score += 8

        # Belirti eşleşmesi
        for belirti in h.get("belirtiler", []):
            matching_words = sum(
                1 for word in query_lower.split()
                if len(word) > 2 and word in belirti.lower()
            )
            score += matching_words * 2

        # Bilimsel ad eşleşmesi
        if any(w in h.get("bilimsel_ad", "").lower() for w in query_lower.split()):
            score += 5

        if score > 0:
            results.append({"disease": h, "relevance_score": score})

    # Skora göre sırala
    results.sort(key=lambda x: x["relevance_score"], reverse=True)
    return results[:3]  # En alakalı 3 sonuç


# ─── Hava Durumu Bilgisi ──────────────────────────────────────────
def get_weather_for_city(city: str) -> dict | None:
    """Belirtilen il için hava durumu verisini döndürür."""
    db = get_weather_db()
    iller = db.get("iller", {})
    # Büyük/küçük harf duyarsız arama
    for il_adi, veri in iller.items():
        if il_adi.lower() == city.lower():
            return {"il": il_adi, **veri}
    return None


# ─── Hal Fiyatları ────────────────────────────────────────────────
def get_market_prices(product: str, city: str | None = None) -> list[dict]:
    """Ürün ve isteğe bağlı il için hal fiyatlarını döndürür."""
    db = get_market_db()
    fiyatlar = db.get("fiyatlar", [])
    product_lower = product.lower()
    results = []

    for f in fiyatlar:
        if product_lower in f.get("urun", "").lower():
            if city:
                il_fiyatlari = f.get("fiyatlar", {})
                for il_adi, fiyat in il_fiyatlari.items():
                    if city.lower() in il_adi.lower():
                        results.append({
                            "urun": f["urun"],
                            "cesit": f["cesit"],
                            "il": il_adi,
                            "fiyat": fiyat,
                            "trend": f.get("trend"),
                            "degisim": f.get("degisim_yuzde"),
                        })
            else:
                results.append({
                    "urun": f["urun"],
                    "cesit": f["cesit"],
                    "tum_fiyatlar": f.get("fiyatlar", {}),
                    "trend": f.get("trend"),
                    "degisim": f.get("degisim_yuzde"),
                })

    return results


# ─── Bağlam Oluşturucu ───────────────────────────────────────────
def retrieve_context(
    query: str,
    plant: str | None = None,
    city: str | None = None,
) -> dict:
    """
    Sorguya göre tüm veri kaynaklarından ilgili bağlamı toplar.
    Gemini'ye gönderilecek zenginleştirilmiş prompt için kullanılır.

    Returns:
        {
            "diseases": [...],
            "weather": {...} | None,
            "prices": [...],
            "sources_used": ["disease_database", "weather_data", ...]
        }
    """
    context = {
        "diseases": [],
        "weather": None,
        "prices": [],
        "sources_used": [],
    }

    # 1. Hastalık arama
    disease_results = search_diseases(query, plant)
    if disease_results:
        context["diseases"] = disease_results
        context["sources_used"].append("disease_database")

    # 2. Hava durumu
    if city:
        weather = get_weather_for_city(city)
        if weather:
            context["weather"] = weather
            context["sources_used"].append("weather_data")

    # 3. Hal fiyatları
    if plant:
        prices = get_market_prices(plant, city)
        if prices:
            context["prices"] = prices
            context["sources_used"].append("market_prices")

    return context


def build_rag_prompt(query: str, context: dict) -> str:
    """
    RAG bağlamını Gemini'ye gönderilebilecek formata dönüştürür.
    """
    parts = [f"Kullanıcı sorusu: {query}\n"]

    # Hastalık bilgisi
    if context["diseases"]:
        parts.append("=== TARIMSAL VERİ TABANI BİLGİLERİ ===")
        for item in context["diseases"]:
            d = item["disease"]
            parts.append(f"\nHastalık: {d['ad']} ({d.get('bilimsel_ad', '')})")
            parts.append(f"Bitki: {d['bitki']}")
            parts.append(f"Belirtiler: {', '.join(d.get('belirtiler', []))}")
            parts.append(f"Tedavi: {', '.join(d.get('tedavi', []))}")
            parts.append(f"Önleme: {', '.join(d.get('onleme', []))}")
            parts.append(f"Risk: {d.get('risk_seviyesi', 'bilinmiyor')}")

    # Hava durumu
    if context["weather"]:
        w = context["weather"]
        parts.append("\n=== HAVA DURUMU VERİSİ ===")
        parts.append(
            f"{w['il']}: {w['sicaklik_c']}°C, Nem: %{w['nem_yuzde']}, "
            f"Durum: {w['hava_durumu']}, Yağış: {w['yagis_mm']}mm"
        )
        if w.get("don_riski"):
            parts.append("⚠️ DON RİSKİ VAR!")

    # Fiyat bilgisi
    if context["prices"]:
        parts.append("\n=== GÜNCEL HAL FİYATLARI ===")
        for p in context["prices"]:
            if "fiyat" in p:
                parts.append(
                    f"{p['urun']} ({p['cesit']}) — {p['il']}: "
                    f"{p['fiyat']['min']}-{p['fiyat']['max']} TL/kg "
                    f"(Trend: {p.get('trend', '?')})"
                )

    parts.append(
        "\n\nYukarıdaki verilere dayanarak, Muhtar karakterinde yanıt ver. "
        "Sadece veri tabanındaki bilgileri kullan, halüsinasyon yapma."
    )

    return "\n".join(parts)
