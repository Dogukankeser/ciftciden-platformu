"""
AI Modülleri Test Scripti
~~~~~~~~~~~~~~~~~~~~~~~~~
3 AI modülünü de test eder ve sonuçları gösterir.

Kullanım:
    python -m ai_services.test_all
"""

import json
import sys


def test_fair_price_engine():
    """Adil Fiyat Motoru testi."""
    print("=" * 60)
    print("MODUL 1: ADIL FIYAT MOTORU")
    print("=" * 60)

    from ai_services.fair_price_engine.predictor import fair_price_predictor

    test_cases = [
        {"category": "kayısı", "variety": "Hacıhaliloğlu", "city": "Malatya", "quality_grade": "1. Kalite", "quantity_kg": 500},
        {"category": "kayısı", "variety": "Kabaaşı", "city": "Elazığ", "quality_grade": "2. Kalite", "quantity_kg": 200},
        {"category": "domates", "variety": "Salkım Domates", "city": "Antalya", "quality_grade": "1. Kalite", "quantity_kg": 1000},
    ]

    for i, tc in enumerate(test_cases, 1):
        print(f"\n--- Test {i}: {tc['city']} {tc['variety']} ---")
        result = fair_price_predictor.predict(**tc)
        print(f"  Fiyat Araligi: {result.estimated_min_price} - {result.estimated_max_price} TL/kg")
        print(f"  Guven Seviyesi: %{result.confidence_level * 100:.0f}")
        print(f"  Aciklama: {result.explanation}")
        print(f"  Faktorler: {json.dumps(result.factors, ensure_ascii=False, indent=4)}")

    print("\n[OK] Adil Fiyat Motoru basariyla calisti!")
    return True


def test_trust_score():
    """Guven Skoru testi."""
    print("\n" + "=" * 60)
    print("MODUL 2: GUVEN SKORU ALGORITMASI")
    print("=" * 60)

    from ai_services.trust_score.guardrails import calculate_and_validate

    test_cases = [
        {
            "label": "Premium Tuccar",
            "merchant_id": "merchant-001",
            "successful_transactions": 120,
            "total_transaction_volume": 1_500_000,
            "avg_payment_speed_days": 2.0,
            "is_registry_verified": True,
            "reviews": [{"rating": 5}, {"rating": 4}, {"rating": 5}, {"rating": 4}, {"rating": 5}],
        },
        {
            "label": "Normal Tuccar",
            "merchant_id": "merchant-002",
            "successful_transactions": 30,
            "total_transaction_volume": 200_000,
            "avg_payment_speed_days": 5.5,
            "is_registry_verified": True,
            "reviews": [{"rating": 4}, {"rating": 3}, {"rating": 4}],
        },
        {
            "label": "Riskli Tuccar",
            "merchant_id": "merchant-003",
            "successful_transactions": 8,
            "total_transaction_volume": 50_000,
            "avg_payment_speed_days": 18.0,
            "is_registry_verified": False,
            "reviews": [{"rating": 2}, {"rating": 1}, {"rating": 3}, {"rating": 2}],
        },
    ]

    for tc in test_cases:
        label = tc.pop("label")
        print(f"\n--- {label} ---")
        result = calculate_and_validate(**tc)
        print(f"  Toplam Skor: {result.overall_score}/10")
        print(f"  Islem Skoru: {result.transaction_score}/10 (x0.40)")
        print(f"  Odeme Skoru: {result.payment_score}/10 (x0.40)")
        print(f"  Review Skoru: {result.review_score}/10 (x0.20)")
        print(f"  Risk Etiketi: {result.risk_label}")
        if result.risk_factors:
            print(f"  Risk Faktorleri: {result.risk_factors}")
        print(f"  Aciklama: {result.explanation}")

    print("\n[OK] Guven Skoru basariyla calisti!")
    return True


def test_quality_analyzer():
    """Gorsel Kalite Analizi testi."""
    print("\n" + "=" * 60)
    print("MODUL 3: GORSEL KALITE ANALIZI")
    print("=" * 60)

    from ai_services.quality_analyzer.guardrails import analyze_and_validate

    # Simule edilmis goruntu ile test (OpenCV gerekmez)
    print("\n--- Test: Simule Edilmis Kayisi Fotografi ---")
    result = analyze_and_validate(None)  # None = simule goruntu

    print(f"  Kalite: {result.predicted_grade}")
    print(f"  Guven: %{result.confidence_score * 100:.0f}")
    print(f"  Tekrar Tarama: {'Evet' if result.needs_rescan else 'Hayir'}")
    if result.fallback_message:
        print(f"  Fallback: {result.fallback_message}")
    print(f"  Aciklama: {result.explanation}")

    if result.color_analysis:
        ca = result.color_analysis
        print(f"  Renk - Hue: {ca.get('dominant_hue')}, Skor: {ca.get('color_score')}/10")
    if result.defect_analysis:
        da = result.defect_analysis
        print(f"  Kusur - Sayi: {da.get('defect_count')}, Siddet: {da.get('defect_severity')}")
    if result.size_analysis:
        sa = result.size_analysis
        print(f"  Boyut - Cap: {sa.get('estimated_diameter_mm')}mm, Kategori: {sa.get('size_category')}")

    print("\n[OK] Gorsel Kalite Analizi basariyla calisti!")
    return True


if __name__ == "__main__":
    print("=" * 60)
    print("DIJITAL TARIM PAZAR YERI — AI MODULLERI TEST")
    print("=" * 60)

    results = {}
    results["Adil Fiyat Motoru"] = test_fair_price_engine()
    results["Guven Skoru"] = test_trust_score()
    results["Kalite Analizi"] = test_quality_analyzer()

    print("\n" + "=" * 60)
    print("SONUC OZETI")
    print("=" * 60)
    for name, passed in results.items():
        status = "[BASARILI]" if passed else "[BASARISIZ]"
        print(f"  {status} {name}")
    print("=" * 60)
