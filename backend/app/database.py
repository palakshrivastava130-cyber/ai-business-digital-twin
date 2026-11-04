"""
Database setup using SQLAlchemy with async PostgreSQL & SQLite fallback support.
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from app.config import get_settings

settings = get_settings()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SQLITE_DB_PATH = os.path.join(BASE_DIR, "digital_twin.db")
SQLITE_URL = f"sqlite+aiosqlite:///{SQLITE_DB_PATH.replace(os.sep, '/')}"


def _create_engine_for_url(db_url: str):
    if "sqlite" in db_url:
        return create_async_engine(
            db_url,
            echo=False,
            connect_args={"check_same_thread": False},
        )
    return create_async_engine(
        db_url,
        echo=False,
        pool_size=10,
        max_overflow=20,
    )


# Active engine & session factory
engine = _create_engine_for_url(settings.DATABASE_URL)
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for SQLAlchemy ORM models."""
    pass


async def get_db():
    """Dependency that provides a database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Create all tables on startup, falling back to SQLite if PostgreSQL is unavailable."""
    global engine, async_session

    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
            await conn.run_sync(Base.metadata.create_all)
        print("  Connected to database successfully.")
    except Exception as pg_err:
        print(f"  PostgreSQL unavailable ({pg_err}). Falling back to local SQLite ({SQLITE_URL})...")
        engine = _create_engine_for_url(SQLITE_URL)
        async_session = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("  SQLite database initialized successfully.")


async def close_db():
    """Dispose of the engine on shutdown."""
    await engine.dispose()
