"""
Çiftçi API Endpoint'leri
~~~~~~~~~~~~~~~~~~~~~~~
"""

from fastapi import APIRouter, HTTPException, Query

from app.schemas.farmer import FarmerResponse, FarmerListResponse
from app.services.mock_data_store import mock_store

router = APIRouter(prefix="/farmers", tags=["Çiftçiler"])


@router.get("/", response_model=FarmerListResponse, summary="Tüm çiftçileri listele")
async def list_farmers(
    city: str | None = Query(None, description="İl filtresi"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Çiftçileri listeler. İl bazında filtreleme yapılabilir."""
    farmers = mock_store.farmers
    if city:
        farmers = [f for f in farmers if f.get("city") == city]

    total = len(farmers)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = farmers[start:end]

    return FarmerListResponse(
        farmers=[FarmerResponse(**f) for f in paginated],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{farmer_id}", response_model=FarmerResponse, summary="Çiftçi detayı")
async def get_farmer(farmer_id: str):
    """Belirli bir çiftçinin detay bilgilerini döndürür."""
    farmer = mock_store.get_farmer(farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Çiftçi bulunamadı")
    return FarmerResponse(**farmer)


@router.get("/{farmer_id}/products", summary="Çiftçinin ürünleri")
async def get_farmer_products(farmer_id: str):
    """Bir çiftçinin tüm ürün ilanlarını listeler."""
    farmer = mock_store.get_farmer(farmer_id)
    if not farmer:
        raise HTTPException(status_code=404, detail="Çiftçi bulunamadı")

    products = mock_store.get_farmer_products(farmer_id)
    return {
        "farmer_id": farmer_id,
        "farmer_name": farmer["full_name"],
        "products": products,
        "total": len(products),
    }
