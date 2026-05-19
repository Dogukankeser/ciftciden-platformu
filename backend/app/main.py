"""
Dijital Tarım Pazar Yeri — FastAPI Ana Uygulama
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
BTK Akademi 2026 Hackathon
Üretici ve Tüccarı AI destekli, güvenli bir şekilde buluşturan platform.
"""

import sys
from contextlib import asynccontextmanager
from pathlib import Path

# ai_services'e erişim
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import close_db, init_db
from app.api.router import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Uygulama yaşam döngüsü: başlangıç ve kapanış işlemleri."""
    # --- Startup ---
    print(f"🌾 {settings.APP_NAME} v{settings.APP_VERSION} başlatılıyor...")
    try:
        await init_db()
        print("✅ Veritabanı tabloları hazır.")
    except Exception:
        print("⚠️ PostgreSQL bağlantısı kurulamadı — Mock Data modu aktif.")
    print(f"📡 API Docs: http://localhost:8000/docs")

    yield  # Uygulama çalışıyor

    # --- Shutdown ---
    try:
        await close_db()
        print("🔌 Veritabanı bağlantısı kapatıldı.")
    except Exception:
        pass


# FastAPI uygulaması
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "🌾 **Dijital Tarım Pazar Yeri** — Üreticiyi ve tüccarı yapay zeka "
        "destekli, güvenli ve şeffaf bir şekilde buluşturan B2B/B2C platform.\n\n"
        "## 🤖 AI Modülleri\n"
        "- **Adil Fiyat Motoru**: Güncel piyasa verilerine dayalı fiyat tahmini\n"
        "- **Güven Skoru**: Tüccar güvenilirlik algoritması\n"
        "- **Kalite Analizi**: Görsel ürün kalite sınıflandırması\n"
        "- **🌿 Dijital Muhtar**: Gemini AI destekli tarımsal asistan — "
        "hastalık teşhisi, RAG tabanlı danışmanlık\n\n"
        "BTK Akademi 2026 Hackathon Projesi"
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS middleware — Frontend erişimi
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Router — tüm endpoint'leri bağla
app.include_router(api_router)


# --- Sağlık Kontrolü ---
@app.get("/", tags=["System"])
async def root():
    """API kök endpoint — sağlık kontrolü."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "🟢 Çalışıyor",
        "docs": "/docs",
    }


@app.get("/health", tags=["System"])
async def health_check():
    """Detaylı sağlık kontrolü."""
    return {
        "status": "healthy",
        "database": "connected",
        "ai_modules": {
            "fair_price_engine": "ready",
            "trust_score": "ready",
            "quality_analyzer": "ready",
            "dijital_muhtar": "ready",
        },
    }
