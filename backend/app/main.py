from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text, select
import structlog

from app.config import get_settings
from app.database import engine, async_session
from app.middleware.security_headers import SecurityHeadersMiddleware
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.logging import RequestLoggingMiddleware
from app.modules.registry import ModuleRegistry

# Core routers (not yet migrated to modules)
from app.routers import (
    auth,
    users,
    communication,
    notes,
    repositories,
    links,
    dashboard,
    settings as settings_router,
    change_requests,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    settings = get_settings()
    logger.info("application_startup", env=settings.APP_ENV)

    # Seed admin user on first startup
    await _seed_admin_user()
    await _seed_business_settings()

    yield

    await engine.dispose()
    logger.info("application_shutdown")


async def _seed_admin_user():
    """Create initial admin user if no users exist."""
    from app.models.user import User
    from app.core.security import hash_password

    settings = get_settings()
    if not settings.SEED_ADMIN_EMAIL or not settings.SEED_ADMIN_PASSWORD:
        return

    async with async_session() as db:
        result = await db.execute(select(User).limit(1))
        if result.scalar_one_or_none() is not None:
            return

        admin = User(
            name=settings.SEED_ADMIN_NAME,
            email=settings.SEED_ADMIN_EMAIL.lower().strip(),
            password_hash=hash_password(settings.SEED_ADMIN_PASSWORD),
            role="ADMIN",
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        logger.info("admin_user_seeded", email=settings.SEED_ADMIN_EMAIL)


async def _seed_business_settings():
    """Seed initial business settings from env vars if none exist yet."""
    from app.models.business_settings import BusinessSettings

    settings = get_settings()
    if not settings.SEED_COMPANY_NAME or not settings.SEED_COMPANY_EMAIL:
        return

    async with async_session() as db:
        result = await db.execute(select(BusinessSettings).where(BusinessSettings.id == 1))
        if result.scalar_one_or_none() is not None:
            return

        bs = BusinessSettings(
            id=1,
            company_name=settings.SEED_COMPANY_NAME,
            email=settings.SEED_COMPANY_EMAIL,
            phone=settings.SEED_COMPANY_PHONE or None,
            street=settings.SEED_COMPANY_STREET or None,
            postal_code=settings.SEED_COMPANY_POSTAL_CODE or None,
            city=settings.SEED_COMPANY_CITY or None,
            website_url=settings.SEED_COMPANY_WEBSITE or None,
            kvk_number=settings.SEED_COMPANY_KVK or None,
            vat_number=settings.SEED_COMPANY_VAT or None,
            iban=settings.SEED_COMPANY_IBAN or None,
            account_holder_name=settings.SEED_COMPANY_ACCOUNT_HOLDER or None,
        )
        db.add(bs)
        await db.commit()
        logger.info("business_settings_seeded", company=settings.SEED_COMPANY_NAME)


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.APP_NAME,
        version="1.0.0",
        docs_url="/api/docs" if not settings.is_production else None,
        redoc_url="/api/redoc" if not settings.is_production else None,
        openapi_url="/api/openapi.json" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # --- Middleware (order matters: last added = first executed) ---

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
        expose_headers=["Content-Disposition"],
    )

    # Security headers
    app.add_middleware(SecurityHeadersMiddleware)

    # Rate limiting
    app.add_middleware(RateLimitMiddleware)

    # Request logging
    app.add_middleware(RequestLoggingMiddleware)

    # --- Global exception handler ---
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error("unhandled_exception", path=request.url.path, error=str(exc))
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    # --- Health check ---
    @app.get("/api/v1/health", tags=["system"])
    async def health_check():
        errors = []

        # Check database
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
        except Exception as e:
            errors.append(f"database: {str(e)}")

        # Check Redis
        try:
            from app.core.auth import get_redis
            r = await get_redis()
            await r.ping()
        except Exception as e:
            errors.append(f"redis: {str(e)}")

        if errors:
            return JSONResponse(
                status_code=503,
                content={"status": "unhealthy", "errors": errors},
            )
        return {"status": "ok"}

    # --- Register core routers (always active) ---
    app.include_router(auth.router)
    app.include_router(users.router)
    app.include_router(dashboard.router)
    app.include_router(settings_router.router)

    # --- Register feature modules from app/modules/ ---
    registry = ModuleRegistry()
    registry.register_all(app)
    app.state.module_registry = registry

    # --- Legacy routers (not yet migrated to modules) ---
    app.include_router(communication.router)
    app.include_router(notes.router)
    app.include_router(repositories.router)
    app.include_router(links.router)
    app.include_router(change_requests.router)

    return app


app = create_app()
