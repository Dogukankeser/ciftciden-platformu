"""
Ortak Yardımcı Fonksiyonlar
~~~~~~~~~~~~~~~~~~~~~~~~~~~~
AI modülleri arasında paylaşılan utility fonksiyonlar.
"""

import numpy as np


def clamp(value: float, min_val: float, max_val: float) -> float:
    """Değeri belirtilen aralığa sınırlar."""
    return max(min_val, min(value, max_val))


def normalize(value: float, min_val: float, max_val: float) -> float:
    """Değeri 0-1 arasına normalize eder."""
    if max_val == min_val:
        return 0.5
    return clamp((value - min_val) / (max_val - min_val), 0.0, 1.0)


def scale_to_range(value: float, target_min: float, target_max: float) -> float:
    """0-1 arasındaki değeri hedef aralığa ölçekler."""
    return target_min + value * (target_max - target_min)


def calculate_confidence_interval(
    predictions: list[float],
    confidence: float = 0.95,
) -> tuple[float, float, float]:
    """
    Tahmin listesinden güven aralığı hesaplar.
    Returns: (alt_sınır, üst_sınır, ortalama)
    """
    arr = np.array(predictions)
    mean = float(np.mean(arr))
    std = float(np.std(arr))

    # Z-skoru: %95 güven → 1.96, %90 → 1.645
    z_scores = {0.90: 1.645, 0.95: 1.96, 0.99: 2.576}
    z = z_scores.get(confidence, 1.96)

    margin = z * std
    lower = max(0, round(mean - margin, 2))
    upper = round(mean + margin, 2)

    return lower, upper, round(mean, 2)


def weighted_average(values: list[float], weights: list[float]) -> float:
    """Ağırlıklı ortalama hesaplar."""
    if len(values) != len(weights):
        raise ValueError("Değer ve ağırlık listelerinin uzunlukları eşit olmalı")
    if sum(weights) == 0:
        return 0.0
    return sum(v * w for v, w in zip(values, weights)) / sum(weights)
