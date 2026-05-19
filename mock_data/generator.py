"""
Mock Data Generator — Dijital Tarım Pazar Yeri
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Hackathon demo ve test için gerçekçi sahte veri üretir.
Türkiye'nin tarım illerinden çiftçiler, tüccarlar, ürün ilanları
ve işlemler oluşturur.

Kullanım:
    python -m mock_data.generator
"""

import json
import random
import uuid
from datetime import date, datetime, timedelta
from pathlib import Path

# Faker olmadan Türkçe isim havuzu
ERKEK_ADLARI = [
    "Mehmet", "Ahmet", "Ali", "Mustafa", "Hasan", "Hüseyin", "İbrahim",
    "Yusuf", "Osman", "Murat", "Ömer", "Halil", "Ramazan", "Süleyman",
    "Kadir", "Recep", "Cemal", "Kemal", "Emre", "Burak", "Serkan",
    "Fatih", "Adem", "Yaşar", "Erkan", "Bayram", "Şükrü", "Salih",
]

KADIN_ADLARI = [
    "Fatma", "Ayşe", "Emine", "Hatice", "Zeynep", "Elif", "Merve",
    "Havva", "Sultan", "Hanife", "Hacer", "Gülsüm", "Nazlı", "Sevgi",
]

SOYADLARI = [
    "Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Özdemir",
    "Arslan", "Doğan", "Kılıç", "Aslan", "Aydın", "Öztürk", "Polat",
    "Koç", "Korkmaz", "Erdoğan", "Güneş", "Kurt", "Aktaş", "Bozkurt",
    "Uçar", "Taş", "Ateş", "Bulut", "Karaca", "Tuncer", "Başaran",
]

SIRKET_TIPLERI = [
    "{soyad} Tarım Tic. Ltd. Şti.",
    "{soyad}oğulları Gıda San. ve Tic. A.Ş.",
    "{il} {soyad} Tarım Ürünleri",
    "Anadolu {soyad} Tarım ve Hayvancılık",
    "{soyad} Kardeşler Komisyonculuk",
    "{il} Bereket Tarım Tic.",
    "{soyad} & Ortakları Gıda Paz.",
]

# Veri dosyalarını yükle
DATA_DIR = Path(__file__).parent / "data"


def load_json(filename: str) -> dict:
    with open(DATA_DIR / filename, "r", encoding="utf-8") as f:
        return json.load(f)


def rastgele_ad() -> str:
    """Rastgele Türkçe ad soyad üretir."""
    isimler = ERKEK_ADLARI + KADIN_ADLARI
    return f"{random.choice(isimler)} {random.choice(SOYADLARI)}"


def rastgele_telefon() -> str:
    """Rastgele Türk cep telefonu numarası üretir."""
    prefix = random.choice(["530", "531", "532", "533", "534", "535",
                            "536", "537", "538", "539", "540", "541",
                            "542", "543", "544", "545", "546", "547",
                            "548", "549", "550", "551", "552", "553"])
    return f"05{prefix[1:]}{random.randint(1000000, 9999999)}"


def rastgele_tc_masked() -> str:
    """Maskeli TC kimlik numarası."""
    digits = str(random.randint(10000, 99999))
    return f"***{digits}***"


def generate_farmers(cities_data: dict, count: int = 30) -> list[dict]:
    """Gerçekçi çiftçi verileri üretir."""
    farmers = []
    iller = cities_data["tarim_illeri"]

    for i in range(count):
        il_data = random.choice(iller)
        ad = rastgele_ad()
        email_ad = ad.lower().replace(" ", ".").replace("ı", "i")\
            .replace("ö", "o").replace("ü", "u").replace("ç", "c")\
            .replace("ş", "s").replace("ğ", "g")

        farmer = {
            "id": str(uuid.uuid4()),
            "full_name": ad,
            "email": f"{email_ad}{random.randint(1, 999)}@gmail.com",
            "phone": rastgele_telefon(),
            "password_hash": "pbkdf2_mock_hash_" + uuid.uuid4().hex[:16],
            "tc_kimlik_masked": rastgele_tc_masked(),
            "city": il_data["il"],
            "district": f"{il_data['il']} Merkez",
            "farm_size_hectare": round(random.uniform(0.5, 50.0), 1),
            "crops": random.sample(
                il_data["ana_urunler"],
                k=min(random.randint(1, 3), len(il_data["ana_urunler"]))
            ),
            "is_verified": random.random() > 0.2,  # %80 doğrulanmış
            "bio": None,
            "profile_image_url": None,
            "created_at": (datetime.now() - timedelta(days=random.randint(30, 365))).isoformat(),
        }
        farmers.append(farmer)

    return farmers


def generate_merchants(cities_data: dict, count: int = 15) -> list[dict]:
    """Gerçekçi tüccar verileri üretir. Farklı güven seviyelerinde."""
    merchants = []
    iller = cities_data["tarim_illeri"]

    trust_profiles = [
        {"label": "premium", "score_range": (8.0, 9.8), "pay_speed": (1, 3), "weight": 0.3},
        {"label": "normal", "score_range": (7.0, 8.0), "pay_speed": (3, 7), "weight": 0.4},
        {"label": "risky", "score_range": (4.0, 6.9), "pay_speed": (7, 21), "weight": 0.2},
        {"label": "new", "score_range": (5.0, 5.5), "pay_speed": (5, 10), "weight": 0.1},
    ]

    for i in range(count):
        il_data = random.choice(iller)
        soyad = random.choice(SOYADLARI)
        ad = rastgele_ad()
        profile = random.choices(trust_profiles, weights=[p["weight"] for p in trust_profiles])[0]

        trust_score = round(random.uniform(*profile["score_range"]), 1)
        risk_label = "normal" if trust_score >= 7.0 else "warning"
        if trust_score < 5.0:
            risk_label = "restricted"

        sirket = random.choice(SIRKET_TIPLERI).format(soyad=soyad, il=il_data["il"])
        successful = random.randint(5, 200) if profile["label"] != "new" else random.randint(0, 5)
        volume = round(successful * random.uniform(5000, 50000), 2)

        email_ad = ad.lower().replace(" ", ".")\
            .replace("ı", "i").replace("ö", "o").replace("ü", "u")\
            .replace("ç", "c").replace("ş", "s").replace("ğ", "g")

        merchant = {
            "id": str(uuid.uuid4()),
            "company_name": sirket,
            "full_name": ad,
            "email": f"{email_ad}.ticaret{random.randint(1, 99)}@gmail.com",
            "phone": rastgele_telefon(),
            "password_hash": "pbkdf2_mock_hash_" + uuid.uuid4().hex[:16],
            "city": il_data["il"],
            "trade_registry_no": f"TR-{il_data['il'][:3].upper()}-{random.randint(10000, 99999)}",
            "is_registry_verified": profile["label"] in ("premium", "normal"),
            "trust_score": trust_score,
            "risk_label": risk_label,
            "total_transaction_volume": volume,
            "successful_transactions": successful,
            "avg_payment_speed_days": round(random.uniform(*profile["pay_speed"]), 1),
            "created_at": (datetime.now() - timedelta(days=random.randint(60, 730))).isoformat(),
        }
        merchants.append(merchant)

    return merchants


def generate_products(
    farmers: list[dict],
    catalog_data: dict,
    count: int = 50
) -> list[dict]:
    """Gerçekçi ürün ilanları üretir."""
    products = []
    kategoriler = catalog_data["kategoriler"]

    for i in range(count):
        farmer = random.choice(farmers)
        farmer_crops = farmer.get("crops", [])

        # Çiftçinin yetiştirdiği ürün kategorisinden seç
        matching = [k for k in kategoriler if k["kategori"] in farmer_crops]
        if not matching:
            matching = kategoriler
        kategori = random.choice(matching)
        cesit = random.choice(kategori["cesitler"])

        asking_price = round(
            random.uniform(cesit["alt"], cesit["ust"]), 1
        )
        quantity = round(random.uniform(50, 5000), 0)

        status_choices = ["active"] * 7 + ["sold"] * 2 + ["expired"] * 1
        status = random.choice(status_choices)

        product = {
            "id": str(uuid.uuid4()),
            "farmer_id": farmer["id"],
            "title": f"{farmer['city']} {cesit['ad']} - {int(quantity)} kg",
            "category": kategori["kategori"],
            "variety": cesit["ad"],
            "description": f"{farmer['city']} bölgesinden taze {cesit['ad']}. "
                          f"Kaliteli ürün, toptan satış.",
            "quantity_kg": quantity,
            "asking_price_per_kg": asking_price,
            "quality_grade": random.choice(["1. Kalite", "2. Kalite", "Belirsiz"]),
            "image_urls": None,
            "city": farmer["city"],
            "status": status,
            "harvest_date": (date.today() - timedelta(days=random.randint(0, 30))).isoformat(),
            "created_at": (datetime.now() - timedelta(days=random.randint(0, 60))).isoformat(),
        }
        products.append(product)

    return products


def generate_transactions(
    products: list[dict],
    merchants: list[dict],
    count: int = 30
) -> list[dict]:
    """Gerçekçi işlem verileri üretir."""
    transactions = []
    sold_products = [p for p in products if p["status"] in ("sold", "active")]

    for i in range(min(count, len(sold_products))):
        product = sold_products[i]
        merchant = random.choice(merchants)

        discount = random.uniform(0.85, 1.05)
        agreed_price = round(product["asking_price_per_kg"] * discount, 1)
        qty = round(random.uniform(50, product["quantity_kg"]), 0)
        total = round(agreed_price * qty, 2)

        statuses = ["pending", "confirmed", "shipped", "completed", "cancelled"]
        weights = [0.1, 0.15, 0.15, 0.5, 0.1]
        status = random.choices(statuses, weights=weights)[0]

        pay_status = "paid" if status == "completed" else random.choice(["awaiting", "paid", "overdue"])
        created = datetime.now() - timedelta(days=random.randint(1, 90))

        transaction = {
            "id": str(uuid.uuid4()),
            "product_id": product["id"],
            "merchant_id": merchant["id"],
            "farmer_id": product["farmer_id"],
            "agreed_price_per_kg": agreed_price,
            "quantity_kg": qty,
            "total_amount": total,
            "status": status,
            "payment_status": pay_status,
            "payment_due_date": (created + timedelta(days=7)).isoformat(),
            "payment_completed_at": (created + timedelta(days=random.randint(1, 7))).isoformat() if pay_status == "paid" else None,
            "created_at": created.isoformat(),
        }
        transactions.append(transaction)

    return transactions


def generate_reviews(transactions: list[dict]) -> list[dict]:
    """Tamamlanmış işlemler için çiftçi değerlendirmeleri üretir."""
    reviews = []
    completed = [t for t in transactions if t["status"] == "completed"]

    yorumlar_iyi = [
        "Çok güvenilir tüccar, ödemeyi zamanında yaptı.",
        "Her zaman adil fiyat veriyor, memnunum.",
        "İletişimi çok iyi, tekrar çalışırım.",
        "Ürünümü zamanında aldı, ödeme hızlıydı.",
        "Profesyonel ve dürüst bir alıcı.",
    ]
    yorumlar_orta = [
        "İdare eder, ödeme biraz gecikti.",
        "Fiyatta biraz pazarlık yapmaya çalıştı ama sonuçta anlaştık.",
        "Normal bir işlem oldu, sorun yaşamadık.",
    ]
    yorumlar_kotu = [
        "Ödeme çok gecikti, bir daha çalışmam.",
        "Fiyatı düşürmeye çalıştı, dikkatli olun.",
    ]

    for t in completed:
        rating = random.choices([5, 4, 3, 2, 1], weights=[0.3, 0.3, 0.2, 0.1, 0.1])[0]
        if rating >= 4:
            comment = random.choice(yorumlar_iyi)
        elif rating == 3:
            comment = random.choice(yorumlar_orta)
        else:
            comment = random.choice(yorumlar_kotu)

        review = {
            "id": str(uuid.uuid4()),
            "merchant_id": t["merchant_id"],
            "farmer_id": t["farmer_id"],
            "transaction_id": t["id"],
            "rating": rating,
            "comment": comment,
            "created_at": t["created_at"],
        }
        reviews.append(review)

    return reviews


def generate_all():
    """Tüm mock verileri üretir ve JSON dosyasına kaydeder."""
    print("🌾 Mock Data Generator başlatılıyor...")

    cities = load_json("cities.json")
    catalog = load_json("products_catalog.json")

    print("  👨‍🌾 Çiftçiler üretiliyor...")
    farmers = generate_farmers(cities, count=30)

    print("  🏪 Tüccarlar üretiliyor...")
    merchants = generate_merchants(cities, count=15)

    print("  📦 Ürün ilanları üretiliyor...")
    products = generate_products(farmers, catalog, count=50)

    print("  💰 İşlemler üretiliyor...")
    transactions = generate_transactions(products, merchants, count=30)

    print("  ⭐ Değerlendirmeler üretiliyor...")
    reviews = generate_reviews(transactions)

    # Tüm veriyi tek dosyaya kaydet
    all_data = {
        "metadata": {
            "generated_at": datetime.now().isoformat(),
            "version": "1.0",
            "description": "BTK Akademi 2026 Hackathon — Mock Data",
        },
        "farmers": farmers,
        "merchants": merchants,
        "products": products,
        "transactions": transactions,
        "reviews": reviews,
        "stats": {
            "farmer_count": len(farmers),
            "merchant_count": len(merchants),
            "product_count": len(products),
            "transaction_count": len(transactions),
            "review_count": len(reviews),
        },
    }

    output_path = DATA_DIR / "generated_mock_data.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Mock data başarıyla oluşturuldu!")
    print(f"   📁 Dosya: {output_path}")
    print(f"   👨‍🌾 Çiftçi: {len(farmers)}")
    print(f"   🏪 Tüccar: {len(merchants)}")
    print(f"   📦 Ürün: {len(products)}")
    print(f"   💰 İşlem: {len(transactions)}")
    print(f"   ⭐ Değerlendirme: {len(reviews)}")

    return all_data


if __name__ == "__main__":
    generate_all()
