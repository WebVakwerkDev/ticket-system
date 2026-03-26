import pytest
from tests.conftest import auth_header


class TestInvoices:
    async def test_create_invoice_with_description(self, client, admin_token, test_client_data):
        """Legacy path: description only, no line items."""
        response = await client.post("/api/v1/invoices", json={
            "client_id": test_client_data["id"],
            "subtotal": 1000.00,
            "vat_rate": 21.00,
            "issue_date": "2026-01-15",
            "due_date": "2026-02-14",
            "description": "Website development",
        }, headers=auth_header(admin_token))
        assert response.status_code == 201
        data = response.json()
        assert data["invoice_number"].startswith("2026-")
        assert float(data["subtotal"]) == 1000.00
        assert float(data["vat_rate"]) == 21.00
        assert float(data["vat_amount"]) == 210.00
        assert float(data["total_amount"]) == 1210.00
        assert data["status"] == "DRAFT"

    async def test_create_invoice_with_line_items(self, client, admin_token, test_client_data):
        """Server recalculates subtotal, VAT, and total from line items."""
        response = await client.post("/api/v1/invoices", json={
            "client_id": test_client_data["id"],
            "vat_rate": 21.00,
            "issue_date": "2026-01-15",
            "due_date": "2026-02-14",
            "line_items": [
                {"description": "Website", "quantity": "2", "unit_price": "500.00", "total": "0"},
                {"description": "Hosting", "quantity": "1", "unit_price": "100.00", "total": "0"},
            ],
        }, headers=auth_header(admin_token))
        assert response.status_code == 201
        data = response.json()
        assert float(data["subtotal"]) == 1100.00
        assert float(data["vat_amount"]) == 231.00
        assert float(data["total_amount"]) == 1331.00
        assert float(data["line_items"][0]["total"]) == 1000.00
        assert float(data["line_items"][1]["total"]) == 100.00

    async def test_create_invoice_line_items_no_description(self, client, admin_token, test_client_data):
        """Line items present with no description → 201."""
        response = await client.post("/api/v1/invoices", json={
            "client_id": test_client_data["id"],
            "vat_rate": 21.00,
            "issue_date": "2026-01-15",
            "due_date": "2026-02-14",
            "line_items": [
                {"description": "Design", "quantity": "1", "unit_price": "750.00", "total": "750.00"},
            ],
        }, headers=auth_header(admin_token))
        assert response.status_code == 201
        assert response.json()["description"] is None

    async def test_create_invoice_item_total_recalculated_server_side(self, client, admin_token, test_client_data):
        """Client-supplied item total is ignored; backend recalculates from quantity * unit_price."""
        response = await client.post("/api/v1/invoices", json={
            "client_id": test_client_data["id"],
            "vat_rate": 0,
            "issue_date": "2026-01-15",
            "due_date": "2026-02-14",
            "line_items": [
                {"description": "Item", "quantity": "3", "unit_price": "200.00", "total": "99999"},
            ],
        }, headers=auth_header(admin_token))
        assert response.status_code == 201
        assert float(response.json()["line_items"][0]["total"]) == 600.00

    async def test_create_invoice_no_description_no_items_returns_422(self, client, admin_token, test_client_data):
        """Neither description nor line_items → 422."""
        response = await client.post("/api/v1/invoices", json={
            "client_id": test_client_data["id"],
            "vat_rate": 21.00,
            "issue_date": "2026-01-15",
            "due_date": "2026-02-14",
        }, headers=auth_header(admin_token))
        assert response.status_code == 422

    async def test_mark_paid(self, client, admin_token, test_client_data):
        inv = await client.post("/api/v1/invoices", json={
            "client_id": test_client_data["id"],
            "subtotal": 500.00,
            "vat_rate": 21.00,
            "issue_date": "2026-01-15",
            "due_date": "2026-02-14",
            "description": "Consulting",
        }, headers=auth_header(admin_token))
        inv_id = inv.json()["id"]

        response = await client.post(f"/api/v1/invoices/{inv_id}/mark-paid", headers=auth_header(admin_token))
        assert response.status_code == 200
        assert response.json()["status"] == "PAID"
        assert response.json()["paid_at"] is not None

    async def test_update_invoice_recalculates_via_line_items(self, client, admin_token, test_client_data):
        """PATCH with new line_items recalculates subtotal, VAT, and total."""
        inv = await client.post("/api/v1/invoices", json={
            "client_id": test_client_data["id"],
            "vat_rate": 21.00,
            "issue_date": "2026-01-15",
            "due_date": "2026-02-14",
            "line_items": [
                {"description": "Initial", "quantity": "1", "unit_price": "1000.00", "total": "1000.00"},
            ],
        }, headers=auth_header(admin_token))
        inv_id = inv.json()["id"]

        response = await client.patch(f"/api/v1/invoices/{inv_id}", json={
            "line_items": [
                {"description": "Updated", "quantity": "2", "unit_price": "1000.00", "total": "0"},
            ],
        }, headers=auth_header(admin_token))
        assert response.status_code == 200
        assert float(response.json()["subtotal"]) == 2000.00
        assert float(response.json()["vat_amount"]) == 420.00
        assert float(response.json()["total_amount"]) == 2420.00

    async def test_update_invoice_line_items_item_total_recalculated(self, client, admin_token, test_client_data):
        """PATCH line_items: stored item.total must equal quantity * unit_price."""
        inv = await client.post("/api/v1/invoices", json={
            "client_id": test_client_data["id"],
            "vat_rate": 21.00,
            "issue_date": "2026-01-15",
            "due_date": "2026-02-14",
            "line_items": [
                {"description": "A", "quantity": "1", "unit_price": "100.00", "total": "100.00"},
            ],
        }, headers=auth_header(admin_token))
        inv_id = inv.json()["id"]

        response = await client.patch(f"/api/v1/invoices/{inv_id}", json={
            "line_items": [
                {"description": "B", "quantity": "5", "unit_price": "50.00", "total": "0"},
            ],
        }, headers=auth_header(admin_token))
        assert response.status_code == 200
        assert float(response.json()["line_items"][0]["total"]) == 250.00

    async def test_invoice_pdf_returns_pdf_content_type(self, client, admin_token, test_client_data, test_business_settings):
        """PDF endpoint returns application/pdf for an invoice with line items."""
        from unittest.mock import patch

        inv = await client.post("/api/v1/invoices", json={
            "client_id": test_client_data["id"],
            "vat_rate": 21.00,
            "issue_date": "2026-01-15",
            "due_date": "2026-02-14",
            "line_items": [
                {"description": "Service", "quantity": "1", "unit_price": "500.00", "total": "500.00"},
            ],
        }, headers=auth_header(admin_token))
        inv_id = inv.json()["id"]

        with patch("app.services.pdf_service.HTML") as mock_html:
            mock_html.return_value.write_pdf.return_value = b"%PDF-1.4 fake"
            response = await client.get(
                f"/api/v1/invoices/{inv_id}/pdf",
                headers=auth_header(admin_token),
            )
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"

    async def test_invoice_pdf_without_line_items_uses_fallback(self, client, admin_token, test_client_data, test_business_settings):
        """Legacy invoice with description only still generates a PDF."""
        from unittest.mock import patch

        inv = await client.post("/api/v1/invoices", json={
            "client_id": test_client_data["id"],
            "subtotal": 1000.00,
            "vat_rate": 21.00,
            "issue_date": "2026-01-15",
            "due_date": "2026-02-14",
            "description": "Legacy invoice",
        }, headers=auth_header(admin_token))
        inv_id = inv.json()["id"]

        with patch("app.services.pdf_service.HTML") as mock_html:
            mock_html.return_value.write_pdf.return_value = b"%PDF-1.4 fake"
            response = await client.get(
                f"/api/v1/invoices/{inv_id}/pdf",
                headers=auth_header(admin_token),
            )
        assert response.status_code == 200
        assert response.headers["content-type"] == "application/pdf"

    async def test_list_invoices(self, client, admin_token, test_client_data):
        await client.post("/api/v1/invoices", json={
            "client_id": test_client_data["id"],
            "subtotal": 100.00, "vat_rate": 21.00,
            "issue_date": "2026-01-01", "due_date": "2026-01-31",
            "description": "Test",
        }, headers=auth_header(admin_token))

        response = await client.get("/api/v1/invoices", headers=auth_header(admin_token))
        assert response.status_code == 200
        assert len(response.json()) >= 1

    async def test_delete_invoice(self, client, admin_token, test_client_data):
        inv = await client.post("/api/v1/invoices", json={
            "client_id": test_client_data["id"],
            "subtotal": 100.00, "vat_rate": 21.00,
            "issue_date": "2026-01-01", "due_date": "2026-01-31",
            "description": "Delete test",
        }, headers=auth_header(admin_token))
        inv_id = inv.json()["id"]

        response = await client.delete(f"/api/v1/invoices/{inv_id}", headers=auth_header(admin_token))
        assert response.status_code == 204

    async def test_employee_cannot_access_invoices(self, client, employee_token):
        response = await client.get("/api/v1/invoices", headers=auth_header(employee_token))
        assert response.status_code == 403

    async def test_finance_can_access_invoices(self, client, finance_token, test_client_data):
        response = await client.get("/api/v1/invoices", headers=auth_header(finance_token))
        assert response.status_code == 200
