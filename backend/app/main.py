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
    oauth,
    oauth_clients,
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

    # Initialize OAuth RSA key and seed OAuth client
    _init_oauth_rsa_key(settings)
    async with async_session() as db:
        await _seed_oauth_client(db)

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


def _init_oauth_rsa_key(settings) -> None:
    """Load or auto-generate the RSA private key used for JWT signing."""
    import logging

    import app.core.oauth as oauth_core
    from cryptography.hazmat.primitives import serialization
    from cryptography.hazmat.primitives.asymmetric import rsa

    _logger = logging.getLogger(__name__)

    if settings.OAUTH_RSA_PRIVATE_KEY:
        oauth_core.init_rsa_key(settings.OAUTH_RSA_PRIVATE_KEY)
    else:
        _logger.warning(
            "OAUTH_RSA_PRIVATE_KEY not set — generating ephemeral RSA key. "
            "DO NOT use this in production."
        )
        private_key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        pem = private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.TraditionalOpenSSL,
            encryption_algorithm=serialization.NoEncryption(),
        ).decode()
        oauth_core.init_rsa_key(pem)


async def _seed_oauth_client(db) -> None:
    """Seed a test OAuth client if SEED_OAUTH_CLIENT_ID is configured."""
    from sqlalchemy import select

    from app.core.security import hash_password
    from app.models.oauth_client import OAuthClient

    settings = get_settings()
    if not settings.SEED_OAUTH_CLIENT_ID:
        return

    result = await db.execute(
        select(OAuthClient).where(OAuthClient.client_id == settings.SEED_OAUTH_CLIENT_ID)
    )
    existing = result.scalar_one_or_none()
    if existing:
        return

    client = OAuthClient(
        client_id=settings.SEED_OAUTH_CLIENT_ID,
        client_secret_hash=hash_password(settings.SEED_OAUTH_CLIENT_SECRET),
        name=settings.SEED_OAUTH_CLIENT_NAME,
        redirect_uris=[settings.SEED_OAUTH_REDIRECT_URI],
        allowed_scopes="openid profile email",
        is_active=True,
    )
    db.add(client)
    await db.commit()
    logger.info("oauth_client_seeded", client_id=settings.SEED_OAUTH_CLIENT_ID)


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
    app.include_router(oauth.router)
    app.include_router(oauth_clients.router)
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
