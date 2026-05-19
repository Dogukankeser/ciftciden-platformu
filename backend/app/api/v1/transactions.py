"""
İşlem API Endpoint'leri
~~~~~~~~~~~~~~~~~~~~~~
"""

from fastapi import APIRouter, HTTPException, Query

from app.schemas.transaction import TransactionResponse, TransactionListResponse
from app.services.mock_data_store import mock_store

router = APIRouter(prefix="/transactions", tags=["İşlemler"])


@router.get("/", response_model=TransactionListResponse, summary="İşlemleri listele")
async def list_transactions(
    status: str | None = Query(None, description="İşlem durumu filtresi"),
    merchant_id: str | None = Query(None, description="Tüccar ID filtresi"),
    farmer_id: str | None = Query(None, description="Çiftçi ID filtresi"),
):
    """İşlemleri filtreler ve listeler."""
    txs = mock_store.transactions

    if status:
        txs = [t for t in txs if t.get("status") == status]
    if merchant_id:
        txs = [t for t in txs if t.get("merchant_id") == merchant_id]
    if farmer_id:
        txs = [t for t in txs if t.get("farmer_id") == farmer_id]

    enriched = []
    for t in txs:
        product = mock_store.get_product(t["product_id"])
        merchant = mock_store.get_merchant(t["merchant_id"])
        farmer = mock_store.get_farmer(t["farmer_id"])
        enriched.append(TransactionResponse(
            **t,
            product_title=product["title"] if product else None,
            merchant_name=merchant["company_name"] if merchant else None,
            farmer_name=farmer["full_name"] if farmer else None,
        ))

    return TransactionListResponse(transactions=enriched, total=len(enriched))


@router.get("/stats", summary="İşlem istatistikleri")
async def transaction_stats():
    """Platform geneli işlem istatistiklerini döndürür."""
    txs = mock_store.transactions
    completed = [t for t in txs if t["status"] == "completed"]
    total_volume = sum(t.get("total_amount", 0) for t in completed)

    return {
        "total_transactions": len(txs),
        "completed": len(completed),
        "pending": len([t for t in txs if t["status"] == "pending"]),
        "cancelled": len([t for t in txs if t["status"] == "cancelled"]),
        "total_volume_tl": round(total_volume, 2),
        "avg_transaction_tl": round(total_volume / max(1, len(completed)), 2),
    }
