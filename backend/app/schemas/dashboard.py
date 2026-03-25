from pydantic import BaseModel
from decimal import Decimal


class DashboardStats(BaseModel):
    projects_in_progress: int
    projects_waiting_for_client: int
    overdue_invoices: int
    overdue_amount: Decimal
    recent_activity: list[dict]
    projects_without_repos: int
    hours_this_year: Decimal
    open_tasks: int
    overdue_tasks: int
