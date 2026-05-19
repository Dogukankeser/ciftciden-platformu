"""
Disease Detector - hastalik teshis motoru.

Fotograf/metin analizini Gemini ve RAG verileriyle birlestirir. Cevaplar
ozellikle kahvehane akisinda okunabilir olsun diye sade ve bolumlu uretilir.
"""

import json
from typing import Any

from ai_services.muhtar.gemini_client import gemini_client
from ai_services.muhtar.rag_engine import build_rag_prompt, retrieve_context
from ai_services.muhtar.persona import (
    DUSUK_GUVEN_DISCLAIMER,
    HASTALIK_TESPIT_SABLONU,
)


class DiseaseDetector:
    """Bitki hastaligi teshis motoru."""

    CONFIDENCE_THRESHOLD = 0.80

    async def detect_from_image(
        self,
        image_bytes: bytes,
        user_text: str,
        plant: str | None = None,
        city: str | None = None,
        media_type: str = "image/jpeg",
    ) -> dict[str, Any]:
        context = retrieve_context(query=user_text, plant=plant, city=city)
        rag_prompt = build_rag_prompt(user_text, context)

        gemini_result = await gemini_client.analyze_image(
            image_bytes=image_bytes,
            user_prompt=user_text,
            rag_context=rag_prompt,
            mime_type=media_type,
        )

        diagnosis = self._parse_gemini_response(gemini_result["text"])
        diagnosis = self._enrich_with_rag(diagnosis, context)
        return self._build_result(diagnosis, context, gemini_result)

    async def detect_from_text(
        self,
        user_text: str,
        plant: str | None = None,
        city: str | None = None,
    ) -> dict[str, Any]:
        context = retrieve_context(query=user_text, plant=plant, city=city)
        rag_prompt = build_rag_prompt(user_text, context)
        gemini_result = await gemini_client.generate_text(
            prompt=user_text,
            rag_context=rag_prompt,
        )

        has_symptom = self._looks_like_disease_question(user_text)
        diseases = context.get("diseases", [])
        if diseases and has_symptom:
            top = diseases[0]["disease"]
            confidence = min(0.78, max(0.45, diseases[0]["relevance_score"] / 20))
            diagnosis = {
                "detected_disease": top.get("ad", "Belirsiz"),
                "confidence_score": confidence,
                "symptoms": top.get("belirtiler", []),
                "causes": top.get("sebepler", []),
                "recommendations": top.get("tedavi", []),
                "prevention": top.get("onleme", []),
                "confusables": self._default_confusables(top.get("bitki", "")),
                "expert_warning": [
                    "Belirti hızlı yayılıyorsa",
                    "Aynı bahçede çok ağaçta görülüyorsa",
                    "İlaçlama zamanı ve ruhsatlı etken madde seçilecekse",
                ],
                "severity": top.get("risk_seviyesi", "bilinmiyor"),
                "affected_part": ", ".join(top.get("etkilenen_kisim", [])),
                "explanation": "",
            }
            return self._build_result(diagnosis, context, gemini_result)

        return {
            "disease_detection": None,
            "muhtar_response": self._clean_text(gemini_result["text"]),
            "recommendations": [],
            "prevention": [],
            "disclaimer": None,
            "rag_sources": context["sources_used"],
            "weather_alert": self._get_weather_alert(context),
            "price_info": self._get_price_summary(context),
            "metadata": {
                "model": gemini_result.get("model", "unknown"),
                "is_mock": gemini_result.get("is_mock", True),
                "processing_time_ms": gemini_result.get("processing_time_ms", 0),
            },
        }

    def _build_result(
        self,
        diagnosis: dict,
        context: dict,
        model_result: dict[str, Any],
    ) -> dict[str, Any]:
        confidence = float(diagnosis.get("confidence_score", 0))
        disclaimer = None
        if confidence < self.CONFIDENCE_THRESHOLD:
            disclaimer = DUSUK_GUVEN_DISCLAIMER.format(
                hastalik_adi=diagnosis.get("detected_disease", "bu sorun")
            )
            diagnosis["recommendations"] = self._remove_chemical_names(
                diagnosis.get("recommendations", [])
            )

        return {
            "disease_detection": {
                "detected_disease": diagnosis.get("detected_disease", "Belirsiz"),
                "confidence_score": round(confidence, 2),
                "severity": diagnosis.get("severity", "bilinmiyor"),
                "affected_part": diagnosis.get("affected_part", ""),
                "symptoms_found": diagnosis.get("symptoms", []),
            },
            "muhtar_response": self._build_muhtar_response(diagnosis, disclaimer),
            "recommendations": diagnosis.get("recommendations", []),
            "prevention": diagnosis.get("prevention", []),
            "disclaimer": disclaimer,
            "rag_sources": context["sources_used"],
            "weather_alert": self._get_weather_alert(context),
            "price_info": self._get_price_summary(context),
            "metadata": {
                "model": model_result.get("model", "unknown"),
                "is_mock": model_result.get("is_mock", True),
                "processing_time_ms": model_result.get("processing_time_ms", 0),
            },
        }

    def _parse_gemini_response(self, raw_text: str) -> dict:
        """Gemini JSON yanitini parse eder."""
        try:
            text = raw_text.strip()
            if "```json" in text:
                text = text.split("```json", 1)[1].split("```", 1)[0].strip()
            elif "```" in text:
                text = text.split("```", 1)[1].split("```", 1)[0].strip()

            data = json.loads(text)
            return {
                "detected_disease": data.get("hastalik_adi", "Belirsiz"),
                "confidence_score": float(data.get("guven_skoru", 50)) / 100,
                "symptoms": data.get("belirtiler", []),
                "causes": data.get("sebepler", []),
                "recommendations": data.get("tedavi", []),
                "prevention": data.get("onleme", []),
                "confusables": data.get("karisabilecekler", []),
                "expert_warning": data.get("uzman_uyarisi", []),
                "severity": data.get("risk_seviyesi", "bilinmiyor"),
                "affected_part": data.get("etkilenen_kisim", ""),
                "explanation": data.get("aciklama", ""),
            }
        except (json.JSONDecodeError, IndexError, TypeError, ValueError):
            return {
                "detected_disease": "Belirsiz",
                "confidence_score": 0.40,
                "symptoms": [],
                "causes": [],
                "recommendations": [],
                "prevention": [],
                "confusables": ["Don zararı", "Besin noksanlığı", "Zararlı böcek etkisi"],
                "expert_warning": ["Yakın plan fotoğraf ve ilçe bilgisiyle ziraat mühendisine gösterin"],
                "severity": "belirsiz",
                "affected_part": "",
                "explanation": raw_text,
            }

    def _enrich_with_rag(self, diagnosis: dict, context: dict) -> dict:
        diseases = context.get("diseases", [])
        if not diseases:
            return diagnosis

        best_match = diseases[0]["disease"]
        detected = diagnosis.get("detected_disease", "").lower()
        if not detected or detected == "belirsiz":
            diagnosis["detected_disease"] = best_match.get("ad", "Belirsiz")

        if not diagnosis.get("symptoms"):
            diagnosis["symptoms"] = best_match.get("belirtiler", [])
        if not diagnosis.get("causes"):
            diagnosis["causes"] = best_match.get("sebepler", [])
        if not diagnosis.get("recommendations"):
            diagnosis["recommendations"] = best_match.get("tedavi", [])
        if not diagnosis.get("prevention"):
            diagnosis["prevention"] = best_match.get("onleme", [])
        if not diagnosis.get("confusables"):
            diagnosis["confusables"] = self._default_confusables(best_match.get("bitki", ""))
        if not diagnosis.get("expert_warning"):
            diagnosis["expert_warning"] = [
                "Belirti hızlı yayılıyorsa",
                "Aynı bahçede çok ağaçta görülüyorsa",
                "Ruhsatlı mücadele zamanı belirlenecekse",
            ]
        if diagnosis.get("severity") in ("bilinmiyor", "belirsiz", ""):
            diagnosis["severity"] = best_match.get("risk_seviyesi", "bilinmiyor")
        if not diagnosis.get("affected_part"):
            diagnosis["affected_part"] = ", ".join(best_match.get("etkilenen_kisim", []))

        return diagnosis

    def _build_muhtar_response(self, diagnosis: dict, disclaimer: str | None) -> str:
        belirtiler = self._first_item(
            diagnosis.get("symptoms", []),
            "Fotoğraftan net belirti okunamadı; yakın plan yaprak, dal ve meyve fotoğrafı ekleyin.",
        )
        oneriler = self._first_item(
            diagnosis.get("recommendations", []),
            "Hastalıklı görünen kısımları ayırın, yayılımı izleyin ve uygulama için ziraat mühendisine danışın.",
        )
        onleme = self._first_item(
            diagnosis.get("prevention", []),
            "Bahçe temizliği, havalandırma budaması ve düzenli kontrol yapın.",
        )
        karisabilecekler = self._join_short(
            diagnosis.get("confusables", []),
            "don zararı veya besin eksikliği",
        )

        return HASTALIK_TESPIT_SABLONU.format(
            hastalik_adi=diagnosis.get("detected_disease", "Belirsiz"),
            guven_skoru=int(float(diagnosis.get("confidence_score", 0)) * 100),
            risk_seviyesi=diagnosis.get("severity", "bilinmiyor"),
            belirtiler=belirtiler,
            oneriler=oneriler,
            onleme=onleme,
            karisabilecekler=karisabilecekler,
            disclaimer="",
        ).strip()

    def _remove_chemical_names(self, recommendations: list[str]) -> list[str]:
        safe_recs = []
        blocked = ["bordo", "fungisit", "insektisit", "herbisit"]
        for rec in recommendations:
            if any(word in rec.lower() for word in blocked):
                safe_recs.append(
                    "Ruhsatlı etken madde ve doğru uygulama zamanı için ziraat mühendisine danışın."
                )
            else:
                safe_recs.append(rec)
        if not safe_recs:
            safe_recs.append("Kesin uygulama için ziraat mühendisine danışın.")
        return safe_recs

    def _looks_like_disease_question(self, text: str) -> bool:
        lower = text.lower()
        keywords = [
            "leke",
            "sar",
            "kuru",
            "kurudu",
            "hastalık",
            "hastalik",
            "böcek",
            "bocek",
            "zarar",
            "çürü",
            "curu",
            "sol",
            "dökül",
            "dokul",
            "yanık",
            "yanik",
            "küf",
            "kuf",
        ]
        return any(keyword in lower for keyword in keywords)

    def _default_confusables(self, plant: str) -> list[str]:
        if "kay" in plant.lower():
            return ["Don zararı", "Bakteriyel dal yanıklığı", "Besin noksanlığı"]
        return ["Besin noksanlığı", "Don veya sıcak zararı", "Zararlı böcek etkisi"]

    def _format_items(self, items: list[str], fallback: str) -> str:
        values = [item for item in items if item]
        if not values:
            values = [fallback]
        return "\n".join(f"- {item}" for item in values[:5])

    def _format_numbered(self, items: list[str], fallback: str) -> str:
        values = [item for item in items if item] or [fallback]
        return "\n".join(f"{index}. {item}" for index, item in enumerate(values[:5], start=1))

    def _first_item(self, items: list[str], fallback: str) -> str:
        values = [str(item).strip().rstrip(".") for item in items if str(item).strip()]
        return values[0] if values else fallback.rstrip(".")

    def _join_short(self, items: list[str], fallback: str) -> str:
        values = [str(item).strip().rstrip(".") for item in items if str(item).strip()]
        return ", ".join(values[:2]) if values else fallback

    def _clean_text(self, text: str) -> str:
        return (
            text.replace("**", "")
            .replace("##", "")
            .replace("🌿", "")
            .replace("🌾", "")
            .strip()
        )

    def _get_weather_alert(self, context: dict) -> str | None:
        weather = context.get("weather")
        if not weather:
            return None

        alerts = []
        if weather.get("don_riski"):
            alerts.append("Don riski var. Gece koruyucu önlem alın.")
        if weather.get("nem_yuzde", 0) > 75:
            alerts.append(f"Nem yüksek (%{weather['nem_yuzde']}). Mantar hastalıklarına dikkat edin.")
        if weather.get("sicaklik_c", 0) > 35:
            alerts.append(f"Sıcaklık yüksek ({weather['sicaklik_c']}°C). Sulama programını kontrol edin.")
        return " ".join(alerts) if alerts else None

    def _get_price_summary(self, context: dict) -> str | None:
        prices = context.get("prices")
        if not prices:
            return None
        p = prices[0]
        if "fiyat" in p:
            return (
                f"{p['urun']} ({p['cesit']}): "
                f"{p['fiyat']['min']}-{p['fiyat']['max']} TL/kg "
                f"({p['il']}, Trend: {p.get('trend', '?')})"
            )
        return None


disease_detector = DiseaseDetector()
