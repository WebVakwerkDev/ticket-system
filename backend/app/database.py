from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import DateTime, func
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timezone
from typing import AsyncGenerator

from app.config import get_settings


class Base(DeclarativeBase):
    pass


def _utcnow():
    return datetime.now(timezone.utc)


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), default=_utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), default=_utcnow, onupdate=_utcnow, nullable=False
    )


class SoftDeleteMixin:
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True, default=None
    )


def _create_engine():
    settings = get_settings()
    kwargs: dict = {
        "echo": not settings.is_production,
        "pool_pre_ping": True,
    }
    # SQLite doesn't support pool_size/max_overflow
    if "sqlite" not in settings.DATABASE_URL:
        kwargs["pool_size"] = 20
        kwargs["max_overflow"] = 10
    return create_async_engine(settings.DATABASE_URL, **kwargs)


engine = _create_engine()
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except SQLAlchemyError:
            await session.rollback()
            raise
