import random
import time

class DocumentOCRScanner:
    """
    Belge Tanıma (OCR) Simülasyonu
    Hackathon ortamında Tesseract/OpenCV bağımlılıkları ağır olacağı için
    yapay zeka mantığı simüle edilmektedir. Gerçek bir sistemde burada
    fotoğraf piksellerinden metin çıkarılır (pytesseract.image_to_string).
    """

    @staticmethod
    def scan_tax_plate(image_bytes: bytes) -> dict:
        """
        Vergi Levhası OCR Taraması
        Dönen veriler: vkn, company_name, nace_code, confidence
        """
        # Simüle edilmiş analiz süresi (1-2 sn)
        time.sleep(1.5)

        # Gerçek hayatta burada OCR çalışır ve Regex ile VKN / NACE aranır.
        # Demo amaçlı her zaman başarılı bir tarama dönüyoruz ancak
        # verileri sabit değil, rastgele üreterek gerçekçilik sağlıyoruz.
        # (veya hackathonda sunum sırasında spesifik bir resim yüklenirse ona göre dönebiliriz)
        
        # Dosya boyutu vb. üzerinden basit bir randomizasyon yapalım
        seed = len(image_bytes) % 10
        
        # NACE Kodları:
        # 46.31.04: Taze incir, üzüm, kayısı vb. toptan ticareti (Geçerli)
        # 41.20.02: İkamet amaçlı bina inşaatı (Geçersiz)
        nace = "46.31.04" if seed < 8 else "41.20.02" 
        
        return {
            "vkn": f"12345678{seed}0",
            "company_name": "ÖRNEK TARIM ÜRÜNLERİ LİMİTED ŞİRKETİ",
            "nace_code": nace,
            "confidence": round(random.uniform(0.85, 0.99), 2),
            "raw_text": "T.C. HAZİNE VE MALİYE BAKANLIĞI... VERGİ LEVHASI..."
        }

    @staticmethod
    def scan_registry_gazette(image_bytes: bytes) -> dict:
        """Ticaret Sicil Gazetesi taraması (Ortaklık ve faaliyet teyidi)"""
        time.sleep(1.0)
        return {
            "found_keywords": ["TOPTAN TİCARET", "MEYVE SEBZE", "ŞİRKET KURULUŞU"],
            "confidence": 0.92
        }

    @staticmethod
    def scan_signature_circular(image_bytes: bytes) -> dict:
        """İmza Sirküleri taraması (Şirket yetkilisi teyidi)"""
        time.sleep(1.0)
        return {
            "authorized_person": "Ahmet Yılmaz", # Demo isim
            "confidence": 0.88
        }
