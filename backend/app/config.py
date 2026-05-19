"""
Uygulama Konfigürasyonu
~~~~~~~~~~~~~~~~~~~~~~~
Pydantic Settings ile tip-güvenli ortam değişkenleri yönetimi.
.env dosyasından otomatik yükleme yapar.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Ana uygulama ayarları. .env dosyasından otomatik okunur."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Veritabanı ---
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/tarim_pazar"

    # --- Güvenlik ---
    SECRET_KEY: str = "hackathon-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # --- Uygulama ---
    APP_NAME: str = "Dijital Tarım Pazar Yeri"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # --- CORS ---
    FRONTEND_URL: str = "http://localhost:3000"


# Singleton settings instance
settings = Settings()
