"""
Tüccar API Endpoint'leri
~~~~~~~~~~~~~~~~~~~~~~~
"""

from fastapi import APIRouter, HTTPException, Query, UploadFile, File
from typing import List

from app.schemas.merchant import MerchantResponse, MerchantListResponse
from app.services.mock_data_store import mock_store
from ai_services.ocr_scanner.scanner import DocumentOCRScanner
from app.services.gov_api import MockGovAPI

router = APIRouter(prefix="/merchants", tags=["Tüccarlar"])


@router.get("/", response_model=MerchantListResponse, summary="Tüm tüccarları listele")
async def list_merchants(
    city: str | None = Query(None, description="İl filtresi"),
    risk_label: str | None = Query(None, description="Risk etiketi filtresi"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    """Tüccarları listeler. İl ve risk etiketi bazında filtreleme."""
    merchants = mock_store.merchants
    if city:
        merchants = [m for m in merchants if m.get("city") == city]
    if risk_label:
        merchants = [m for m in merchants if m.get("risk_label") == risk_label]

    # Güven skoruna göre sırala (yüksekten düşüğe)
    merchants = sorted(merchants, key=lambda m: m.get("trust_score", 0), reverse=True)

    total = len(merchants)
    start = (page - 1) * per_page
    paginated = merchants[start:start + per_page]

    return MerchantListResponse(
        merchants=[MerchantResponse(**m) for m in paginated],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/{merchant_id}", response_model=MerchantResponse, summary="Tüccar detayı")
async def get_merchant(merchant_id: str):
    """Belirli bir tüccarın detay bilgilerini döndürür."""
    merchant = mock_store.get_merchant(merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Tüccar bulunamadı")
    return MerchantResponse(**merchant)


@router.get("/{merchant_id}/reviews", summary="Tüccar değerlendirmeleri")
async def get_merchant_reviews(merchant_id: str):
    """Bir tüccarın aldığı tüm çiftçi değerlendirmelerini listeler."""
    merchant = mock_store.get_merchant(merchant_id)
    if not merchant:
        raise HTTPException(status_code=404, detail="Tüccar bulunamadı")

    reviews = mock_store.get_merchant_reviews(merchant_id)
    avg_rating = sum(r["rating"] for r in reviews) / len(reviews) if reviews else 0

    return {
        "merchant_id": merchant_id,
        "company_name": merchant["company_name"],
        "trust_score": merchant.get("trust_score", 5.0),
        "reviews": reviews,
        "total_reviews": len(reviews),
        "average_rating": round(avg_rating, 1),
    }

@router.post("/{merchant_id}/verify-documents", summary="Belgeleri Yükle ve Doğrula")
async def verify_merchant_documents(
    merchant_id: str,
    tax_plate: UploadFile = File(..., description="Vergi Levhası (JPG/PNG/PDF)"),
    registry_gazette: UploadFile = File(..., description="Ticaret Sicil Gazetesi"),
    signature_circular: UploadFile = File(..., description="İmza Sirküleri")
):
    """
    Tüccar belgelerini tarar (OCR) ve sahte e-Devlet API'si ile doğrular.
    Her 3 belgenin de geçerli ve NACE kodunun uygun olması gerekir.
    """
    # 1. Dosyaları belleğe al (Demo)
    tax_plate_bytes = await tax_plate.read()
    gazette_bytes = await registry_gazette.read()
    signature_bytes = await signature_circular.read()

    # 2. AI OCR Taraması
    tax_data = DocumentOCRScanner.scan_tax_plate(tax_plate_bytes)
    gazette_data = DocumentOCRScanner.scan_registry_gazette(gazette_bytes)
    sig_data = DocumentOCRScanner.scan_signature_circular(signature_bytes)

    if tax_data["confidence"] < 0.7 or gazette_data["confidence"] < 0.7 or sig_data["confidence"] < 0.7:
        raise HTTPException(status_code=400, detail="Belgeler okunamadı. Lütfen yüksek çözünürlüklü yükleyin.")

    vkn = tax_data["vkn"]
    nace = tax_data["nace_code"]
    applicant_name = sig_data["authorized_person"]

    # 3. Mock e-Devlet Doğrulaması (Ticaret Bakanlığı / MERSİS Simülasyonu)
    gov_result = MockGovAPI.verify_merchant(vkn, nace, applicant_name)

    if not gov_result["verified"]:
        raise HTTPException(status_code=403, detail=gov_result["reason"])

    # 4. Mock DB'yi veya Gerçek DB'yi Güncelle
    merchant = mock_store.get_merchant(merchant_id)
    if merchant:
        merchant["is_registry_verified"] = True
        merchant["nace_code"] = nace
        merchant["tax_id"] = vkn

    return {
        "status": "success",
        "message": "Tüm belgeleriniz başarıyla e-Devlet ve MERSİS üzerinden onaylandı.",
        "extracted_data": {
            "vkn": vkn,
            "company_name": tax_data["company_name"],
            "nace_code": nace,
            "authorized_person": applicant_name
        },
        "is_registry_verified": True
    }

