import time

class MockGovAPI:
    """
    E-Devlet / Ticaret Bakanlığı (Mersis/VDO) Mock API'si.
    Sisteme girilen VKN ve NACE kodunun yasal karşılığını sorgular.
    """

    # Kabul edilen NACE kodları (Yaş Meyve Sebze Toptan Ticareti vb.)
    ALLOWED_NACE_PREFIXES = ["46.31"]

    @staticmethod
    def verify_merchant(vkn: str, nace_code: str, applicant_name: str) -> dict:
        """
        Şirketin yasal durumunu doğrular.
        """
        time.sleep(1.2) # API gecikmesi simülasyonu

        # NACE Kodu uygunluğu kontrolü
        is_nace_valid = any(nace_code.startswith(prefix) for prefix in MockGovAPI.ALLOWED_NACE_PREFIXES)
        
        if not is_nace_valid:
            return {
                "verified": False,
                "reason": f"Reddedildi: NACE kodunuz ({nace_code}) tarım/gıda toptancılığına uygun değildir."
            }

        # VKN format kontrolü
        if not vkn or len(vkn) not in [10, 11]:
            return {
                "verified": False,
                "reason": "Reddedildi: Geçersiz Vergi Kimlik Numarası formatı."
            }

        # İsim eşleşmesi (Gerçek senaryoda vergi levhasındaki isimle karşılaştırılır)
        # Burada basit bir kontrol: İsim çok kısa ise reddet (Demo)
        if len(applicant_name) < 3:
            return {
                "verified": False,
                "reason": "Reddedildi: Başvuru sahibi ismi ile şirket yetkilisi eşleşmiyor."
            }

        # Tüm kontroller başarılı
        return {
            "verified": True,
            "reason": "Başarılı: Şirket aktif ve tarım ticareti yetkisine sahip."
        }
