"""OAuth / OIDC core utilities for Accuro."""
import base64
import json
import secrets
from datetime import datetime, timedelta, timezone

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from jose import jwt

from app.core.auth import get_redis

# Module-level state — initialized at startup
_private_key = None
_public_key = None


def init_rsa_key(pem: str) -> None:
    """Load RSA keypair from PEM-encoded private key string."""
    global _private_key, _public_key
    from cryptography.hazmat.primitives.serialization import load_pem_private_key
    _private_key = load_pem_private_key(pem.encode(), password=None)
    _public_key = _private_key.public_key()


def _int_to_base64url(n: int) -> str:
    length = (n.bit_length() + 7) // 8
    b = n.to_bytes(length, "big")
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def get_public_key_jwks() -> dict:
    """Return the public key as a JWKS dict."""
    if _public_key is None:
        raise RuntimeError("RSA key not initialized")

    pub_numbers = _public_key.public_numbers()
    n = pub_numbers.n
    e = pub_numbers.e

    return {
        "keys": [
            {
                "kty": "RSA",
                "use": "sig",
                "alg": "RS256",
                "kid": "accuro-oauth-key",
                "n": _int_to_base64url(n),
                "e": _int_to_base64url(e),
            }
        ]
    }


def generate_auth_code() -> str:
    """Generate a cryptographically random auth code."""
    return secrets.token_urlsafe(32)


async def store_auth_code(code: str, payload: dict) -> None:
    """Store auth code in Redis with 600s TTL."""
    redis = await get_redis()
    await redis.set(f"oauth_code:{code}", json.dumps(payload), ex=600)


async def consume_auth_code(code: str) -> dict | None:
    """Atomically get and delete auth code from Redis."""
    redis = await get_redis()
    key = f"oauth_code:{code}"
    pipe = redis.pipeline()
    pipe.get(key)
    pipe.delete(key)
    results = await pipe.execute()
    raw = results[0]
    if raw is None:
        return None
    return json.loads(raw)


def create_id_token(
    user_id: int,
    email: str,
    name: str,
    role: str,
    is_active: bool,
    client_id: str,
    issuer: str,
) -> str:
    """Create an RS256-signed OIDC ID token."""
    if _private_key is None:
        raise RuntimeError("RSA key not initialized")

    now = datetime.now(tz=timezone.utc)
    private_pem = _private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode()

    claims = {
        "iss": issuer,
        "sub": str(user_id),
        "aud": client_id,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(hours=1)).timestamp()),
        "email": email,
        "name": name,
        "role": role,
        "is_active": is_active,
    }
    return jwt.encode(claims, private_pem, algorithm="RS256", headers={"kid": "accuro-oauth-key"})
