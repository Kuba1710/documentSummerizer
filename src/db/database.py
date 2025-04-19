import os
from typing import AsyncGenerator
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from fastapi import Depends
from dotenv import load_dotenv

# Załaduj zmienne środowiskowe
load_dotenv()

# Konfiguracja loggera
logger = logging.getLogger(__name__)

# Pobranie URL bazy danych z zmiennej środowiskowej lub użycie domyślnej wartości
# Możemy użyć Supabase PostgreSQL URL
SUPABASE_URL = os.getenv("SUPABASE_URL", "http://127.0.0.1:54321")
# Przekształć URL Supabase do formatu połączenia PostgreSQL
# Domyślne wartości Supabase: użytkownik: postgres, hasło: postgres, baza: postgres, port: 54322
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:54322/postgres")

logger.info(f"Connecting to database: {DATABASE_URL}")

# Tworzenie silnika bazy danych
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Ustaw na True, aby zobaczyć generowane zapytania SQL (przydatne do debugowania)
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # Sprawdza połączenie przed użyciem
)

# Tworzenie fabryki sesji
async_session_factory = sessionmaker(
    engine, 
    class_=AsyncSession, 
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Asynchronous dependency for database session
    
    Yields:
        AsyncSession: SQLAlchemy async session
        
    Usage:
        ```
        @app.get("/items")
        async def get_items(db: AsyncSession = Depends(get_db)):
            # use db session
        ```
    """
    async with async_session_factory() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {str(e)}")
            await session.rollback()
            raise
        finally:
            await session.close()

# Funkcja inicjalizacji bazy danych (może być używana podczas startu aplikacji)
async def init_db():
    """Initialize database - create tables if they don't exist
    
    This should be called during application startup
    """
    from schemas.base import Base
    try:
        logger.info("Initializing database tables...")
        async with engine.begin() as conn:
            # Nie używamy drop_all w środowisku produkcyjnym!
            # await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise 