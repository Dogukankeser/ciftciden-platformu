"""
Gemini Client - Google Gemini AI entegrasyonu.

Gemini yoksa demo guvenli mock cevap uretir. Mock cevaplar da juri
sunumunda sade ve hastalik odakli gorunsun diye gercek akisa yakin tutulur.
"""

import base64
import os
import time
from pathlib import Path
from typing import Any

from ai_services.muhtar.persona import MUHTAR_SYSTEM_PROMPT
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).resolve().parents[2]
load_dotenv(ROOT_DIR / "backend" / ".env")
load_dotenv(ROOT_DIR / ".env")

try:
    import google.generativeai as genai

    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None


class GeminiClient:
    """Gemini text ve vision modellerini yoneten istemci."""

    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.model_name = "gemini-2.0-flash"
        self.vision_model_name = "gemini-2.0-flash"
        self.fallback_model_names = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"]
        self._configured = False
        self._model = None
        self._vision_model = None

        if GEMINI_AVAILABLE and self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self._model = genai.GenerativeModel(
                    model_name=self.model_name,
                    system_instruction=MUHTAR_SYSTEM_PROMPT,
                )
                self._vision_model = genai.GenerativeModel(
                    model_name=self.vision_model_name,
                    system_instruction=MUHTAR_SYSTEM_PROMPT,
                )
                self._configured = True
            except Exception as exc:
                print(f"Gemini yapilandirma hatasi: {exc}")
                self._configured = False

    @property
    def is_live(self) -> bool:
        return self._configured and GEMINI_AVAILABLE

    def _generate_with_fallback(self, content):
        last_error = None
        for model_name in dict.fromkeys(self.fallback_model_names):
            try:
                model = genai.GenerativeModel(
                    model_name=model_name,
                    system_instruction=MUHTAR_SYSTEM_PROMPT,
                )
                return model.generate_content(content), model_name
            except Exception as exc:
                last_error = exc
        if last_error:
            raise last_error
        raise RuntimeError("Gemini modeli bulunamadi")

    async def analyze_image(
        self,
        image_bytes: bytes,
        user_prompt: str,
        rag_context: str = "",
        mime_type: str = "image/jpeg",
    ) -> dict[str, Any]:
        """Gemini Vision API ile fotograf + metin analizi yapar."""
        if not self.is_live:
            return self._mock_vision_response(user_prompt)

        try:
            start = time.time()
            image_b64 = base64.b64encode(image_bytes).decode("utf-8")

            full_prompt = (
                f"{rag_context}\n\n"
                f"Kullanici bu fotografi paylasip sunu sordu:\n{user_prompt}\n\n"
                "Fotografi/videoyu ve kullanici metnini birlikte incele. Sadece gorulen bulgulara "
                "ve verilen tarimsal kaynaklara dayan. Goruntu net degilse tani uydurma; yakin plan "
                "yaprak, dal, cicek veya meyve fotografi iste. Emin degilsen guven skorunu dusuk ver. "
                "Ilac markasi verme; ruhsatli etken madde icin Ilce Tarim veya ziraat muhendisine yonlendir. "
                "Cevap ciftcinin anlayacagi sadelikte olsun.\n\n"
                "Yalnizca gecerli JSON dondur, markdown kullanma. JSON semasi:\n"
                '{"hastalik_adi": "...", "guven_skoru": 0-100, '
                '"belirtiler": ["..."], "sebepler": ["..."], '
                '"tedavi": ["..."], "onleme": ["..."], '
                '"karisabilecekler": ["..."], "uzman_uyarisi": ["..."], '
                '"risk_seviyesi": "dusuk|orta|yuksek|belirsiz", '
                '"etkilenen_kisim": "...", "aciklama": "..."}'
            )

            image_part = {"mime_type": mime_type or "image/jpeg", "data": image_b64}
            response, used_model = self._generate_with_fallback([full_prompt, image_part])
            elapsed = int((time.time() - start) * 1000)

            return {
                "text": response.text,
                "model": used_model,
                "is_mock": False,
                "processing_time_ms": elapsed,
            }
        except Exception as exc:
            print(f"Gemini Vision hatasi: {exc}")
            return self._mock_vision_response(user_prompt)

    async def generate_text(self, prompt: str, rag_context: str = "") -> dict[str, Any]:
        """Gemini Text API ile metin yaniti uretir."""
        if not self.is_live:
            return self._mock_text_response(prompt)

        try:
            start = time.time()
            full_prompt = (
                f"{rag_context}\n\n"
                f"Kullanici sorusu:\n{prompt}\n\n"
                "Sade Turkceyle en fazla 5 kisa madde yaz. Gereksiz emoji, markdown ve uzun akademik cumle kullanma."
            )
            response, used_model = self._generate_with_fallback(full_prompt)
            elapsed = int((time.time() - start) * 1000)

            return {
                "text": response.text,
                "model": used_model,
                "is_mock": False,
                "processing_time_ms": elapsed,
            }
        except Exception as exc:
            print(f"Gemini Text hatasi: {exc}")
            return self._mock_text_response(prompt)

    def _mock_vision_response(self, prompt: str) -> dict[str, Any]:
        """Gemini erisilemezse kullanilan simulasyon yaniti."""
        prompt_lower = prompt.lower()
        is_apricot_branch = "kay" in prompt_lower and any(
            word in prompt_lower
            for word in ["dal", "cicek", "çiçek", "kuruma", "kurudu", "hastalik", "hastalık"]
        )

        if is_apricot_branch:
            text = (
                '{"hastalik_adi": "Kayısı Monilya (çiçek ve sürgün yanıklığı)", '
                '"guven_skoru": 78, '
                '"belirtiler": ['
                '"Çiçek ve genç sürgünlerde kuruma görülüyor", '
                '"Dalda kahverengileşme ve geriye doğru kuruma var", '
                '"Nemli ilkbahar sonrası kayısıda sık görülür"'
                '], '
                '"sebepler": ['
                '"Çiçeklenme döneminde yağış ve yüksek nem", '
                '"Ağaç üzerinde kalan hastalıklı dal ve mumyalaşmış meyveler", '
                '"Bahçede hava dolaşımının zayıf olması"'
                '], '
                '"tedavi": ['
                '"Kuruyan çiçek ve sürgünleri sağlam dokudan 10-15 cm aşağıdan kesip bahçeden uzaklaştırın", '
                '"Budama makasını ağaçtan ağaca geçerken temizleyin", '
                '"Ruhsatlı mücadele zamanı ve etken madde için ziraat mühendisine danışın"'
                '], '
                '"onleme": ['
                '"Sonbahar ve kış temizliğinde hastalıklı dal ve mumyalaşmış meyveleri toplayın", '
                '"Tacın içini havalandıracak budama yapın", '
                '"Çiçeklenme döneminde yağışlı hava varsa bahçeyi sık kontrol edin"'
                '], '
                '"karisabilecekler": ["Don zararı", "Bakteriyel dal yanıklığı", "Fiziksel dal kırılması"], '
                '"uzman_uyarisi": ["Kuruma hızlı yayılıyorsa", "Aynı bahçede çok ağaçta görülüyorsa", "Gövdeye doğru ilerliyorsa"], '
                '"risk_seviyesi": "orta", '
                '"etkilenen_kisim": "çiçek, sürgün ve ince dallar", '
                '"aciklama": "Görüntü kayısıda monilya kaynaklı çiçek ve sürgün yanıklığına benziyor."'
                '}'
            )
        else:
            text = (
                '{"hastalik_adi": "Kayısı Çil Hastalığı (Cladosporium carpophilum)", '
                '"guven_skoru": 82, '
                '"belirtiler": ['
                '"Yaprak veya meyvede küçük kahverengi lekeler", '
                '"Leke çevresinde sararma", '
                '"Meyvede küçük çukurlaşmalar"'
                '], '
                '"sebepler": ['
                '"Nemli ve serin dönemler", '
                '"Bahçede hava dolaşımının az olması", '
                '"Hastalıklı yaprak ve dalların bahçede kalması"'
                '], '
                '"tedavi": ['
                '"Hastalıklı yaprak ve dalları bahçeden uzaklaştırın", '
                '"Tacın içini havalandıracak budama yapın", '
                '"Ruhsatlı mücadele için ziraat mühendisine danışın"'
                '], '
                '"onleme": ['
                '"Yaprak dökümünden sonra bahçe temizliği yapın", '
                '"Sulamada yaprak ve meyveyi uzun süre ıslak bırakmayın", '
                '"Bahçeyi düzenli kontrol edin"'
                '], '
                '"karisabilecekler": ["Bakteriyel leke", "Dolu zararı", "Besin noksanlığı"], '
                '"uzman_uyarisi": ["Leke hızla yayılıyorsa", "Meyvede pazar değerini düşüren çukurlaşma artıyorsa"], '
                '"risk_seviyesi": "orta", '
                '"etkilenen_kisim": "yaprak ve meyve", '
                '"aciklama": "Belirtiler kayısı çil hastalığına benziyor."'
                '}'
            )

        return {
            "text": text,
            "model": f"{self.model_name} (simulasyon)",
            "is_mock": True,
            "processing_time_ms": 150,
        }

    def _mock_text_response(self, prompt: str) -> dict[str, Any]:
        """Metin sorusu icin simulasyon yaniti."""
        lower = prompt.lower()
        if "monilya" in lower:
            answer = (
                "Monilya riski çiçeklenme ve nemli havada artar.\n"
                "Marka söylemem; ruhsatlı fungisit etken maddesini ilçe tarım veya ziraat mühendisiyle seçin.\n"
                "Kuruyan sürgünleri sağlam yerden 10-15 cm aşağıdan kesip bahçeden çıkarın.\n"
                "Yağış sonrası bahçeyi sık kontrol edin."
            )
        elif any(word in lower for word in ["gübre", "gubre", "azot", "fosfor", "potasyum"]):
            answer = (
                "Toprak analizi yoksa gübreyi tek seferde yüklenmeyin.\n"
                "Azotlu gübreyi gelişim dönemine bölerek verin.\n"
                "Fosfor ve potasyumu ürünün kök ve meyve ihtiyacına göre planlayın.\n"
                "Dozu kesinleştirmek için ilçe tarım veya ziraat mühendisine analiz sonucu gösterin."
            )
        elif any(word in lower for word in ["ilaç", "ilac", "hastalık", "hastalik", "zararlı", "zararli"]):
            answer = (
                "İlaçlamadan önce belirtiyi, ürünü ve dönemi netleştirin.\n"
                "Rüzgarlı ve sıcak saatlerde uygulama yapmayın.\n"
                "Marka yerine ruhsatlı etken maddeyi ziraat mühendisiyle seçin.\n"
                "Belirti hızla yayılıyorsa beklemeden yerel uzmana gösterin."
            )
        elif any(word in lower for word in ["sulama", "damla", "su", "nem"]):
            answer = (
                "Sulamayı sabah erken veya akşam serinliğinde yapın.\n"
                "Toprağın üstü kuru ama altı nemliyse sulamayı erteleyin.\n"
                "Damla sulamada kısa ve düzenli uygulama kökü daha dengeli besler.\n"
                "Yağış bekleniyorsa aynı gün ekstra sulama yapmayın."
            )
        elif any(word in lower for word in ["finans", "gider", "gelir", "kar", "kâr", "nakit", "mazot"]):
            answer = (
                "Önce mazot, işçilik ve gübre giderlerini ayrı ayrı takip edin.\n"
                "Net kar pozitifse hasat öncesi nakit payı ayırın.\n"
                "Satış fiyatı düşerse hangi gideri azaltacağınızı şimdiden belirleyin.\n"
                "Büyük harcamayı ürün tesliminden önce tek seferde yapmayın."
            )
        else:
            answer = (
                "Daha net cevap için ürün, şehir, dönem ve hedefinizi yazın.\n"
                "Finans, gübre, ilaçlama veya sulama planını buna göre çıkaralım.\n"
                "Emin olmadığınız hastalık ve ilaç konularında yerel ziraat uzmanına danışın."
            )
        return {
            "text": answer,
            "model": f"{self.model_name} (simulasyon)",
            "is_mock": True,
            "processing_time_ms": 50,
        }


gemini_client = GeminiClient()
