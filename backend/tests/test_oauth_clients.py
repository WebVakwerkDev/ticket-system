import pytest
from tests.conftest import auth_header


@pytest.mark.asyncio
class TestOAuthClients:

    # ── List ──────────────────────────────────────────────────────────────

    async def test_list_empty(self, client, admin_token):
        response = await client.get("/api/v1/oauth-clients", headers=auth_header(admin_token))
        assert response.status_code == 200
        assert response.json() == []

    async def test_list_after_create(self, client, admin_token):
        await client.post("/api/v1/oauth-clients", json={
            "name": "Listed App",
            "redirect_uris": ["https://app.example.com/callback"],
            "allowed_scopes": "openid profile email",
        }, headers=auth_header(admin_token))
        response = await client.get("/api/v1/oauth-clients", headers=auth_header(admin_token))
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["name"] == "Listed App"

    async def test_list_does_not_include_secret(self, client, admin_token):
        await client.post("/api/v1/oauth-clients", json={
            "name": "Secret App",
            "redirect_uris": ["https://app.example.com/callback"],
            "allowed_scopes": "openid profile email",
        }, headers=auth_header(admin_token))
        response = await client.get("/api/v1/oauth-clients", headers=auth_header(admin_token))
        assert "client_secret" not in response.json()[0]

    # ── Create ────────────────────────────────────────────────────────────

    async def test_create_returns_201_with_secret(self, client, admin_token):
        response = await client.post("/api/v1/oauth-clients", json={
            "name": "Test App",
            "redirect_uris": ["https://app.example.com/callback"],
            "allowed_scopes": "openid profile email",
        }, headers=auth_header(admin_token))
        assert response.status_code == 201
        data = response.json()
        assert "client_id" in data
        assert "client_secret" in data
        assert len(data["client_secret"]) == 64  # secrets.token_hex(32)
        assert data["name"] == "Test App"
        assert data["redirect_uris"] == ["https://app.example.com/callback"]
        assert data["is_active"] is True

    async def test_create_auto_generates_client_id(self, client, admin_token):
        response = await client.post("/api/v1/oauth-clients", json={
            "name": "UUID App",
            "redirect_uris": ["https://app.example.com/callback"],
        }, headers=auth_header(admin_token))
        assert response.status_code == 201
        client_id = response.json()["client_id"]
        # Should be a valid UUID (36 chars with dashes)
        assert len(client_id) == 36
        assert client_id.count("-") == 4

    async def test_create_default_scopes(self, client, admin_token):
        response = await client.post("/api/v1/oauth-clients", json={
            "name": "Default Scopes App",
            "redirect_uris": ["https://app.example.com/callback"],
        }, headers=auth_header(admin_token))
        assert response.status_code == 201
        assert response.json()["allowed_scopes"] == "openid profile email"

    async def test_create_duplicate_name_returns_409(self, client, admin_token):
        await client.post("/api/v1/oauth-clients", json={
            "name": "Duplicate App",
            "redirect_uris": ["https://app.example.com/callback"],
        }, headers=auth_header(admin_token))
        response = await client.post("/api/v1/oauth-clients", json={
            "name": "Duplicate App",
            "redirect_uris": ["https://other.example.com/callback"],
        }, headers=auth_header(admin_token))
        assert response.status_code == 409

    async def test_create_missing_name_returns_422(self, client, admin_token):
        response = await client.post("/api/v1/oauth-clients", json={
            "redirect_uris": ["https://app.example.com/callback"],
        }, headers=auth_header(admin_token))
        assert response.status_code == 422

    async def test_create_empty_redirect_uris_returns_422(self, client, admin_token):
        response = await client.post("/api/v1/oauth-clients", json={
            "name": "Empty URI App",
            "redirect_uris": [],
        }, headers=auth_header(admin_token))
        assert response.status_code == 422

    # ── Update ────────────────────────────────────────────────────────────

    async def test_update_name(self, client, admin_token):
        create_resp = await client.post("/api/v1/oauth-clients", json={
            "name": "Old Name",
            "redirect_uris": ["https://app.example.com/callback"],
        }, headers=auth_header(admin_token))
        client_id = create_resp.json()["client_id"]
        response = await client.patch(f"/api/v1/oauth-clients/{client_id}", json={
            "name": "New Name",
        }, headers=auth_header(admin_token))
        assert response.status_code == 200
        assert response.json()["name"] == "New Name"

    async def test_update_redirect_uris(self, client, admin_token):
        create_resp = await client.post("/api/v1/oauth-clients", json={
            "name": "URI App",
            "redirect_uris": ["https://old.example.com/callback"],
        }, headers=auth_header(admin_token))
        client_id = create_resp.json()["client_id"]
        response = await client.patch(f"/api/v1/oauth-clients/{client_id}", json={
            "redirect_uris": ["https://new.example.com/callback", "https://other.example.com/cb"],
        }, headers=auth_header(admin_token))
        assert response.status_code == 200
        assert response.json()["redirect_uris"] == [
            "https://new.example.com/callback",
            "https://other.example.com/cb",
        ]

    async def test_update_deactivate(self, client, admin_token):
        create_resp = await client.post("/api/v1/oauth-clients", json={
            "name": "Active App",
            "redirect_uris": ["https://app.example.com/callback"],
        }, headers=auth_header(admin_token))
        client_id = create_resp.json()["client_id"]
        response = await client.patch(f"/api/v1/oauth-clients/{client_id}", json={
            "is_active": False,
        }, headers=auth_header(admin_token))
        assert response.status_code == 200
        assert response.json()["is_active"] is False

    async def test_update_does_not_return_secret(self, client, admin_token):
        create_resp = await client.post("/api/v1/oauth-clients", json={
            "name": "Patch App",
            "redirect_uris": ["https://app.example.com/callback"],
        }, headers=auth_header(admin_token))
        client_id = create_resp.json()["client_id"]
        response = await client.patch(f"/api/v1/oauth-clients/{client_id}", json={
            "name": "Updated App",
        }, headers=auth_header(admin_token))
        assert "client_secret" not in response.json()

    async def test_update_nonexistent_returns_404(self, client, admin_token):
        response = await client.patch("/api/v1/oauth-clients/does-not-exist", json={
            "name": "Whatever",
        }, headers=auth_header(admin_token))
        assert response.status_code == 404

    # ── Delete ────────────────────────────────────────────────────────────

    async def test_delete(self, client, admin_token):
        create_resp = await client.post("/api/v1/oauth-clients", json={
            "name": "Delete Me",
            "redirect_uris": ["https://app.example.com/callback"],
        }, headers=auth_header(admin_token))
        client_id = create_resp.json()["client_id"]
        response = await client.delete(
            f"/api/v1/oauth-clients/{client_id}",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 204
        list_resp = await client.get("/api/v1/oauth-clients", headers=auth_header(admin_token))
        assert len(list_resp.json()) == 0

    async def test_delete_nonexistent_returns_404(self, client, admin_token):
        response = await client.delete(
            "/api/v1/oauth-clients/does-not-exist",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 404

    # ── Regenerate secret ─────────────────────────────────────────────────

    async def test_regenerate_secret_returns_new_secret(self, client, admin_token):
        create_resp = await client.post("/api/v1/oauth-clients", json={
            "name": "Regen App",
            "redirect_uris": ["https://app.example.com/callback"],
        }, headers=auth_header(admin_token))
        old_secret = create_resp.json()["client_secret"]
        client_id = create_resp.json()["client_id"]
        response = await client.post(
            f"/api/v1/oauth-clients/{client_id}/regenerate-secret",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 200
        data = response.json()
        assert "client_secret" in data
        assert len(data["client_secret"]) == 64
        assert data["client_secret"] != old_secret

    async def test_regenerate_secret_nonexistent_returns_404(self, client, admin_token):
        response = await client.post(
            "/api/v1/oauth-clients/does-not-exist/regenerate-secret",
            headers=auth_header(admin_token),
        )
        assert response.status_code == 404

    # ── Authorization ─────────────────────────────────────────────────────

    async def test_employee_cannot_list(self, client, employee_token):
        response = await client.get(
            "/api/v1/oauth-clients",
            headers=auth_header(employee_token),
        )
        assert response.status_code == 403

    async def test_employee_cannot_create(self, client, employee_token):
        response = await client.post("/api/v1/oauth-clients", json={
            "name": "Hacked",
            "redirect_uris": ["https://attacker.example.com/callback"],
        }, headers=auth_header(employee_token))
        assert response.status_code == 403

    async def test_finance_cannot_create(self, client, finance_token):
        response = await client.post("/api/v1/oauth-clients", json={
            "name": "Hacked",
            "redirect_uris": ["https://attacker.example.com/callback"],
        }, headers=auth_header(finance_token))
        assert response.status_code == 403

    async def test_unauthenticated_cannot_list(self, client):
        response = await client.get("/api/v1/oauth-clients")
        assert response.status_code == 403
