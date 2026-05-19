"""
Veritabanı Seed Script
~~~~~~~~~~~~~~~~~~~~~~
Mock data'yı PostgreSQL veritabanına yükler.
SQLAlchemy async session ile bulk insert yapar.

Kullanım:
    python -m mock_data.seed_database
"""

import asyncio
import json
import sys
import uuid
from datetime import datetime
from pathlib import Path

# Backend app'i import edebilmek için path'e ekle
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from sqlalchemy import text

from app.config import settings
from app.database import async_session_factory, engine, Base
from app.models import (
    Farmer, Merchant, Product, Transaction,
    MerchantReview, QualityAnalysis, PriceEstimation,
)

DATA_DIR = Path(__file__).parent / "data"


def parse_dt(dt_str: str | None) -> datetime | None:
    """ISO format tarih string'ini datetime objesine çevirir."""
    if not dt_str:
        return None
    return datetime.fromisoformat(dt_str)


def parse_date(d_str: str | None):
    """ISO format tarih string'ini date objesine çevirir."""
    if not d_str:
        return None
    from datetime import date as date_type
    return date_type.fromisoformat(d_str)


async def seed():
    """Mock data'yı veritabanına yükler."""
    mock_file = DATA_DIR / "generated_mock_data.json"

    if not mock_file.exists():
        print("❌ Mock data dosyası bulunamadı!")
        print("   Önce generator'ı çalıştırın: python -m mock_data.generator")
        return

    with open(mock_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"🌾 Veritabanı seed işlemi başlatılıyor...")
    print(f"   📡 DB: {settings.DATABASE_URL}")

    # Tabloları oluştur
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("   ✅ Tablolar oluşturuldu.")

    async with async_session_factory() as session:
        # Mevcut verileri temizle
        for table in reversed(Base.metadata.sorted_tables):
            await session.execute(text(f"TRUNCATE TABLE {table.name} CASCADE"))
        await session.commit()
        print("   🧹 Eski veriler temizlendi.")

        # --- Çiftçileri yükle ---
        for f_data in data["farmers"]:
            farmer = Farmer(
                id=uuid.UUID(f_data["id"]),
                full_name=f_data["full_name"],
                email=f_data["email"],
                phone=f_data["phone"],
                password_hash=f_data["password_hash"],
                tc_kimlik_masked=f_data.get("tc_kimlik_masked"),
                city=f_data["city"],
                district=f_data.get("district"),
                farm_size_hectare=f_data.get("farm_size_hectare"),
                crops=f_data.get("crops"),
                is_verified=f_data.get("is_verified", False),
                bio=f_data.get("bio"),
                profile_image_url=f_data.get("profile_image_url"),
            )
            session.add(farmer)
        await session.commit()
        print(f"   👨‍🌾 {len(data['farmers'])} çiftçi yüklendi.")

        # --- Tüccarları yükle ---
        for m_data in data["merchants"]:
            merchant = Merchant(
                id=uuid.UUID(m_data["id"]),
                company_name=m_data["company_name"],
                full_name=m_data["full_name"],
                email=m_data["email"],
                phone=m_data["phone"],
                password_hash=m_data["password_hash"],
                city=m_data["city"],
                trade_registry_no=m_data.get("trade_registry_no"),
                is_registry_verified=m_data.get("is_registry_verified", False),
                trust_score=m_data.get("trust_score", 5.0),
                risk_label=m_data.get("risk_label", "normal"),
                total_transaction_volume=m_data.get("total_transaction_volume", 0),
                successful_transactions=m_data.get("successful_transactions", 0),
                avg_payment_speed_days=m_data.get("avg_payment_speed_days", 0),
            )
            session.add(merchant)
        await session.commit()
        print(f"   🏪 {len(data['merchants'])} tüccar yüklendi.")

        # --- Ürünleri yükle ---
        for p_data in data["products"]:
            product = Product(
                id=uuid.UUID(p_data["id"]),
                farmer_id=uuid.UUID(p_data["farmer_id"]),
                title=p_data["title"],
                category=p_data["category"],
                variety=p_data.get("variety"),
                description=p_data.get("description"),
                quantity_kg=p_data["quantity_kg"],
                asking_price_per_kg=p_data["asking_price_per_kg"],
                quality_grade=p_data.get("quality_grade", "Belirsiz"),
                image_urls=p_data.get("image_urls"),
                city=p_data["city"],
                status=p_data.get("status", "active"),
                harvest_date=parse_date(p_data.get("harvest_date")),
            )
            session.add(product)
        await session.commit()
        print(f"   📦 {len(data['products'])} ürün yüklendi.")

        # --- İşlemleri yükle ---
        for t_data in data["transactions"]:
            transaction = Transaction(
                id=uuid.UUID(t_data["id"]),
                product_id=uuid.UUID(t_data["product_id"]),
                merchant_id=uuid.UUID(t_data["merchant_id"]),
                farmer_id=uuid.UUID(t_data["farmer_id"]),
                agreed_price_per_kg=t_data["agreed_price_per_kg"],
                quantity_kg=t_data["quantity_kg"],
                total_amount=t_data["total_amount"],
                status=t_data.get("status", "pending"),
                payment_status=t_data.get("payment_status", "awaiting"),
                payment_due_date=parse_dt(t_data.get("payment_due_date")),
                payment_completed_at=parse_dt(t_data.get("payment_completed_at")),
            )
            session.add(transaction)
        await session.commit()
        print(f"   💰 {len(data['transactions'])} işlem yüklendi.")

        # --- Değerlendirmeleri yükle ---
        for r_data in data["reviews"]:
            review = MerchantReview(
                id=uuid.UUID(r_data["id"]),
                merchant_id=uuid.UUID(r_data["merchant_id"]),
                farmer_id=uuid.UUID(r_data["farmer_id"]),
                transaction_id=uuid.UUID(r_data["transaction_id"]),
                rating=r_data["rating"],
                comment=r_data.get("comment"),
            )
            session.add(review)
        await session.commit()
        print(f"   ⭐ {len(data['reviews'])} değerlendirme yüklendi.")

    print(f"\n🎉 Seed işlemi tamamlandı! Tüm veriler veritabanına yüklendi.")


if __name__ == "__main__":
    asyncio.run(seed())
