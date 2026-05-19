"""
API Router Birleştirici
~~~~~~~~~~~~~~~~~~~~~~
Tüm v1 route'larını tek bir router'da toplar.
main.py'de `app.include_router(api_router)` ile bağlanır.
"""

from fastapi import APIRouter

from app.api.v1.farmers import router as farmers_router
from app.api.v1.merchants import router as merchants_router
from app.api.v1.products import router as products_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.ai_price import router as ai_price_router
from app.api.v1.ai_trust import router as ai_trust_router
from app.api.v1.ai_quality import router as ai_quality_router
from app.api.v1.ai_listing_trust import router as ai_listing_trust_router
from app.api.v1.muhtar import router as muhtar_router

api_router = APIRouter(prefix="/api/v1")

# CRUD Endpoints
api_router.include_router(farmers_router)
api_router.include_router(merchants_router)
api_router.include_router(products_router)
api_router.include_router(transactions_router)

# AI Endpoints
api_router.include_router(ai_price_router)
api_router.include_router(ai_trust_router)
api_router.include_router(ai_quality_router)
api_router.include_router(ai_listing_trust_router)

# 🌿 Dijital Muhtar — Social AI Assistant
api_router.include_router(muhtar_router)
