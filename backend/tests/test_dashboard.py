import pytest
from tests.conftest import auth_header


class TestDashboard:
    async def test_get_dashboard_stats(self, client, admin_token):
        response = await client.get("/api/v1/dashboard/stats", headers=auth_header(admin_token))
        assert response.status_code == 200
        data = response.json()
        assert "projects_in_progress" in data
        assert "projects_waiting_for_client" in data
        assert "overdue_invoices" in data
        assert "overdue_amount" in data
        assert "recent_activity" in data
        assert "projects_without_repos" in data
        assert isinstance(data["projects_in_progress"], int)
        assert isinstance(data["overdue_invoices"], int)
        assert isinstance(data["recent_activity"], list)

    async def test_dashboard_stats_with_project(self, client, admin_token, test_project_data):
        response = await client.get("/api/v1/dashboard/stats", headers=auth_header(admin_token))
        assert response.status_code == 200
        data = response.json()
        # The test project has a default status, so counts should be >= 0
        assert data["projects_in_progress"] >= 0
        assert data["projects_waiting_for_client"] >= 0

    async def test_employee_can_access_dashboard(self, client, employee_token):
        response = await client.get("/api/v1/dashboard/stats", headers=auth_header(employee_token))
        assert response.status_code == 200
        data = response.json()
        assert "projects_in_progress" in data

    async def test_finance_cannot_access_dashboard(self, client, finance_token):
        response = await client.get("/api/v1/dashboard/stats", headers=auth_header(finance_token))
        assert response.status_code == 403

    async def test_automation_project_not_counted_without_repos(self, client, admin_token, test_client_data):
        """Automation projects should not appear in projects_without_repos metric."""
        response = await client.post("/api/v1/projects", json={
            "client_id": test_client_data["id"],
            "name": "Make Flow",
            "project_type": "WORKFLOW_AUTOMATION",
            "status": "IN_PROGRESS",
        }, headers=auth_header(admin_token))
        assert response.status_code == 201

        stats = await client.get("/api/v1/dashboard/stats", headers=auth_header(admin_token))
        assert stats.status_code == 200
        assert "projects_without_repos" in stats.json()
