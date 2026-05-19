"""
Veritabanı Bağlantı Yönetimi
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
Async SQLAlchemy engine ve session factory.
PostgreSQL yoksa graceful degradation yapar — Mock Data modu aktif olur.
"""

try:
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    from sqlalchemy.orm import DeclarativeBase
    SQLALCHEMY_AVAILABLE = True
except ImportError:
    SQLALCHEMY_AVAILABLE = False

from app.config import settings


if SQLALCHEMY_AVAILABLE:
    # Async engine — connection pool ile veritabanı bağlantısı
    engine = create_async_engine(
        settings.DATABASE_URL,
        echo=settings.DEBUG,
        pool_size=20,
        max_overflow=10,
        pool_pre_ping=True,
    )

    async_session_factory = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )

    class Base(DeclarativeBase):
        """Tüm ORM modellerinin miras alacağı temel sınıf."""
        pass

    async def get_db() -> AsyncSession:
        """FastAPI Dependency: Her request için bir database session sağlar."""
        async with async_session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    async def init_db():
        """Veritabanı tablolarını oluşturur."""
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def close_db():
        """Engine'i dispose eder."""
        await engine.dispose()

else:
    # SQLAlchemy yoksa — Mock Data modu
    engine = None
    async_session_factory = None

    class Base:
        """Placeholder Base sınıfı (SQLAlchemy yokken)."""
        metadata = type("Metadata", (), {"create_all": lambda *a, **k: None, "sorted_tables": []})()

    async def get_db():
        yield None

    async def init_db():
        print("  [Mock Mode] Veritabanı bağlantısı atlandı — Mock Data kullanılıyor.")

    async def close_db():
        pass
