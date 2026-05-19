"""
Ürün API Endpoint'leri
~~~~~~~~~~~~~~~~~~~~~
"""

from fastapi import APIRouter, HTTPException, Query

from app.schemas.product import ProductResponse, ProductListResponse
from app.services.mock_data_store import mock_store

router = APIRouter(prefix="/products", tags=["Ürünler"])


@router.get("/", response_model=ProductListResponse, summary="Ürünleri listele & filtrele")
async def list_products(
    category: str | None = Query(None, description="Kategori (kayısı, domates...)"),
    city: str | None = Query(None, description="İl filtresi"),
    min_price: float | None = Query(None, ge=0, description="Min fiyat (TL/kg)"),
    max_price: float | None = Query(None, ge=0, description="Max fiyat (TL/kg)"),
    quality_grade: str | None = Query(None, description="Kalite derecesi"),
    status: str = Query("active", description="İlan durumu"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Ürün ilanlarını filtreler ve listeler."""
    products = mock_store.filter_products(
        category=category,
        city=city,
        min_price=min_price,
        max_price=max_price,
        quality_grade=quality_grade,
        status=status,
    )

    # Çiftçi adını ekle
    enriched = []
    for p in products:
        farmer = mock_store.get_farmer(p["farmer_id"])
        resp = ProductResponse(
            **p,
            farmer_name=farmer["full_name"] if farmer else None,
        )
        enriched.append(resp)

    total = len(enriched)
    start = (page - 1) * per_page
    paginated = enriched[start:start + per_page]

    return ProductListResponse(
        products=paginated,
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/categories", summary="Mevcut kategoriler")
async def get_categories():
    """Platformdaki tüm ürün kategorilerini ve sayılarını döndürür."""
    products = mock_store.products
    categories = {}
    for p in products:
        cat = p.get("category", "diğer")
        categories[cat] = categories.get(cat, 0) + 1
    return {"categories": categories, "total": len(categories)}


@router.get("/cities", summary="Ürün bulunan iller")
async def get_product_cities():
    """Aktif ürün ilanı bulunan illeri listeler."""
    active = [p for p in mock_store.products if p.get("status") == "active"]
    cities = {}
    for p in active:
        city = p.get("city", "Bilinmiyor")
        cities[city] = cities.get(city, 0) + 1
    return {"cities": cities, "total": len(cities)}


@router.get("/{product_id}", response_model=ProductResponse, summary="Ürün detayı")
async def get_product(product_id: str):
    """Belirli bir ürünün detay bilgilerini döndürür."""
    product = mock_store.get_product(product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")

    farmer = mock_store.get_farmer(product["farmer_id"])
    return ProductResponse(
        **product,
        farmer_name=farmer["full_name"] if farmer else None,
    )
