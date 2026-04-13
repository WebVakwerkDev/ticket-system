import sys
from unittest.mock import MagicMock

# Mock WeasyPrint before any app imports — libpango system libs not available in test env
_weasyprint_mock = MagicMock()
sys.modules["weasyprint"] = _weasyprint_mock

import os

# Set test environment variables BEFORE importing app modules
# (app.database triggers Settings() at import time)
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("POSTGRES_PASSWORD", "test")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("REDIS_PASSWORD", "test")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key-that-is-at-least-32-characters-long")
os.environ.setdefault("EXTERNAL_API_KEY", "test-external-api-key-for-testing")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:3000")
os.environ.setdefault("SEED_ADMIN_EMAIL", "")
os.environ.setdefault("SEED_ADMIN_PASSWORD", "")
os.environ.setdefault("OAUTH_ISSUER", "http://testaccuro.test")

# Clear any cached settings
from app.config import get_settings
get_settings.cache_clear()

import pytest
from unittest.mock import AsyncMock, patch
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.database import Base, get_db
from app.main import create_app
from app.core.security import hash_password


# In-memory SQLite for tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSession = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSession() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


# Mock Redis functions
mock_redis_store = {}

mock_oauth_code_store: dict = {}


async def mock_store_auth_code(code: str, payload: dict) -> None:
    mock_oauth_code_store[code] = payload


async def mock_consume_auth_code(code: str) -> dict | None:
    return mock_oauth_code_store.pop(code, None)


async def mock_store_refresh_token(user_id: str, token: str, user_agent: str = ""):
    mock_redis_store[f"refresh:{user_id}"] = token


async def mock_get_stored_refresh_token(user_id: str):
    return mock_redis_store.get(f"refresh:{user_id}")


async def mock_delete_refresh_token(user_id: str):
    mock_redis_store.pop(f"refresh:{user_id}", None)


async def mock_invalidate_all_user_tokens(user_id: str):
    mock_redis_store.pop(f"refresh:{user_id}", None)


async def mock_check_rate_limit(key: str, max_requests: int, window_seconds: int):
    return True


@pytest.fixture(autouse=True)
def mock_redis(monkeypatch):
    mock_redis_store.clear()
    mock_oauth_code_store.clear()
    with patch("app.core.auth.store_refresh_token", side_effect=mock_store_refresh_token), \
         patch("app.core.auth.get_stored_refresh_token", side_effect=mock_get_stored_refresh_token), \
         patch("app.core.auth.delete_refresh_token", side_effect=mock_delete_refresh_token), \
         patch("app.core.auth.invalidate_all_user_tokens", side_effect=mock_invalidate_all_user_tokens), \
         patch("app.core.auth.check_rate_limit", side_effect=mock_check_rate_limit), \
         patch("app.routers.auth.store_refresh_token", side_effect=mock_store_refresh_token), \
         patch("app.routers.auth.get_stored_refresh_token", side_effect=mock_get_stored_refresh_token), \
         patch("app.routers.auth.delete_refresh_token", side_effect=mock_delete_refresh_token), \
         patch("app.routers.users.invalidate_all_user_tokens", side_effect=mock_invalidate_all_user_tokens):
        monkeypatch.setattr("app.routers.oauth.store_auth_code", mock_store_auth_code)
        monkeypatch.setattr("app.routers.oauth.consume_auth_code", mock_consume_auth_code)
        yield


@pytest.fixture(autouse=True)
def mock_settings(monkeypatch):
    monkeypatch.setenv("DATABASE_URL", TEST_DATABASE_URL)
    monkeypatch.setenv("POSTGRES_PASSWORD", "test")
    monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/0")
    monkeypatch.setenv("REDIS_PASSWORD", "test")
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-that-is-at-least-32-characters-long")
    monkeypatch.setenv("EXTERNAL_API_KEY", "test-external-api-key-for-testing")
    monkeypatch.setenv("CORS_ORIGINS", "http://localhost:3000")
    monkeypatch.setenv("SEED_ADMIN_EMAIL", "")
    monkeypatch.setenv("SEED_ADMIN_PASSWORD", "")
    # Clear lru_cache
    from app.config import get_settings
    get_settings.cache_clear()


@pytest.fixture
async def db_session():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSession() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def app(db_session):
    application = create_app()
    application.dependency_overrides[get_db] = override_get_db
    return application


@pytest.fixture
async def client(app):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def admin_user(db_session):
    from app.models.user import User
    user = User(
        name="Test Admin",
        email="admin@test.com",
        password_hash=hash_password("TestPassword1!"),
        role="ADMIN",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def employee_user(db_session):
    from app.models.user import User
    user = User(
        name="Test Employee",
        email="employee@test.com",
        password_hash=hash_password("TestPassword1!"),
        role="EMPLOYEE",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def finance_user(db_session):
    from app.models.user import User
    user = User(
        name="Test Finance",
        email="finance@test.com",
        password_hash=hash_password("TestPassword1!"),
        role="FINANCE",
        is_active=True,
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def admin_token(client, admin_user):
    response = await client.post("/api/v1/auth/login", json={
        "email": "admin@test.com",
        "password": "TestPassword1!",
    })
    return response.json()["access_token"]


@pytest.fixture
async def employee_token(client, employee_user):
    response = await client.post("/api/v1/auth/login", json={
        "email": "employee@test.com",
        "password": "TestPassword1!",
    })
    return response.json()["access_token"]


@pytest.fixture
async def finance_token(client, finance_user):
    response = await client.post("/api/v1/auth/login", json={
        "email": "finance@test.com",
        "password": "TestPassword1!",
    })
    return response.json()["access_token"]


@pytest.fixture(scope="session", autouse=True)
def test_rsa_key():
    """Generate a test RSA keypair and initialize the oauth core module."""
    import app.core.oauth as oauth_core
    from cryptography.hazmat.primitives.asymmetric import rsa
    from cryptography.hazmat.primitives import serialization

    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()
    oauth_core.init_rsa_key(pem)


def auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def test_business_settings(client, admin_token):
    """Create minimal business settings (required for PDF generation)."""
    await client.put("/api/v1/settings", json={
        "company_name": "Test BV",
        "email": "test@testbv.nl",
    }, headers=auth_header(admin_token))


@pytest.fixture
async def test_client_data(client, admin_token):
    """Create a test client and return its data."""
    response = await client.post("/api/v1/clients", json={
        "company_name": "Test Company",
        "contact_name": "John Doe",
        "email": "john@testcompany.com",
    }, headers=auth_header(admin_token))
    return response.json()


@pytest.fixture
async def test_project_data(client, admin_token, test_client_data):
    """Create a test project and return its data."""
    response = await client.post("/api/v1/projects", json={
        "client_id": test_client_data["id"],
        "name": "Test Project",
        "project_type": "NEW_WEBSITE",
        "priority": "MEDIUM",
    }, headers=auth_header(admin_token))
    return response.json()
