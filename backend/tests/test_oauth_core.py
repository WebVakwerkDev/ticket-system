"""Tests for app/core/oauth.py"""
import pytest


class TestOAuthCore:
    def test_get_public_key_jwks_structure(self):
        """JWKS endpoint returns correct structure."""
        import app.core.oauth as oauth_core
        jwks = oauth_core.get_public_key_jwks()
        assert "keys" in jwks
        assert len(jwks["keys"]) == 1
        key = jwks["keys"][0]
        assert key["kty"] == "RSA"
        assert key["alg"] == "RS256"
        assert key["use"] == "sig"
        assert "n" in key
        assert "e" in key

    def test_generate_auth_code_is_random_and_long(self):
        """Auth codes are random and long enough."""
        import app.core.oauth as oauth_core
        code1 = oauth_core.generate_auth_code()
        code2 = oauth_core.generate_auth_code()
        assert code1 != code2
        assert len(code1) >= 32

    def test_create_id_token_structure(self):
        """ID token is a valid RS256 JWT with required claims."""
        import app.core.oauth as oauth_core
        from jose import jwt
        from cryptography.hazmat.primitives import serialization

        token = oauth_core.create_id_token(
            user_id=1,
            email="test@example.com",
            name="Test User",
            role="ADMIN",
            is_active=True,
            client_id="launchpad",
            issuer="http://testaccuro.test",
        )

        pub_pem = oauth_core._public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo,
        ).decode()

        claims = jwt.decode(token, pub_pem, algorithms=["RS256"], audience="launchpad")
        assert claims["sub"] == "1"
        assert claims["email"] == "test@example.com"
        assert claims["name"] == "Test User"
        assert claims["role"] == "ADMIN"
        assert claims["is_active"] is True
        assert claims["iss"] == "http://testaccuro.test"
        assert claims["aud"] == "launchpad"
