from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from decimal import Decimal
from datetime import datetime, date, timedelta, timezone

from app.database import get_db
from app.core.dependencies import require_role
from app.core.rbac import Role
from app.models.project import ProjectWorkspace, ProjectStatus, ProjectType
from app.models.invoice import Invoice, InvoiceStatus
from app.models.audit_log import AuditLog
from app.models.repository import ProjectRepository
from app.models.time_entry import TimeEntry
from app.models.task import Task, TaskStatus
from app.schemas.dashboard import DashboardStats

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user=Depends(require_role(Role.ADMIN, Role.EMPLOYEE)),
    db: AsyncSession = Depends(get_db),
) -> DashboardStats:
    # In-progress projects
    in_progress = await db.execute(
        select(func.count(ProjectWorkspace.id))
        .where(ProjectWorkspace.status == ProjectStatus.IN_PROGRESS.value, ProjectWorkspace.deleted_at.is_(None))
    )
    projects_in_progress = in_progress.scalar() or 0

    # Waiting for client
    waiting = await db.execute(
        select(func.count(ProjectWorkspace.id))
        .where(ProjectWorkspace.status == ProjectStatus.WAITING_FOR_CLIENT.value, ProjectWorkspace.deleted_at.is_(None))
    )
    projects_waiting = waiting.scalar() or 0

    # Overdue invoices
    overdue_count = await db.execute(
        select(func.count(Invoice.id)).where(Invoice.status == InvoiceStatus.OVERDUE.value)
    )
    overdue_invoices = overdue_count.scalar() or 0

    overdue_sum = await db.execute(
        select(func.coalesce(func.sum(Invoice.total_amount), 0))
        .where(Invoice.status == InvoiceStatus.OVERDUE.value)
    )
    overdue_amount = overdue_sum.scalar() or Decimal("0")

    # Recent activity (last 7 days)
    seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
    recent = await db.execute(
        select(AuditLog)
        .where(AuditLog.created_at >= seven_days_ago)
        .order_by(AuditLog.created_at.desc())
        .limit(20)
    )
    recent_activity = [
        {
            "id": log.id,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "action": log.action,
            "created_at": str(log.created_at),
        }
        for log in recent.scalars().all()
    ]

    # Projects without repos
    WEB_TYPES = [
        ProjectType.NEW_WEBSITE.value,
        ProjectType.REDESIGN.value,
        ProjectType.MAINTENANCE.value,
        ProjectType.LANDING_PAGE.value,
        ProjectType.PORTFOLIO.value,
        ProjectType.WEBSHOP.value,
    ]

    subq = select(ProjectRepository.project_id).distinct()
    without_repos = await db.execute(
        select(func.count(ProjectWorkspace.id))
        .where(
            ProjectWorkspace.deleted_at.is_(None),
            ProjectWorkspace.status.in_([ProjectStatus.IN_PROGRESS.value, ProjectStatus.REVIEW.value]),
            ProjectWorkspace.project_type.in_(WEB_TYPES),
            ProjectWorkspace.id.notin_(subq),
        )
    )
    projects_without_repos = without_repos.scalar() or 0

    # Hours this year
    current_year = date.today().year
    hours_result = await db.execute(
        select(func.coalesce(func.sum(TimeEntry.hours), 0))
        .where(extract("year", TimeEntry.date) == current_year)
    )
    hours_this_year = hours_result.scalar() or Decimal("0")

    # Open tasks
    open_tasks_result = await db.execute(
        select(func.count(Task.id)).where(Task.status != TaskStatus.DONE.value)
    )
    open_tasks = open_tasks_result.scalar() or 0

    # Overdue tasks
    overdue_tasks_result = await db.execute(
        select(func.count(Task.id)).where(
            Task.status != TaskStatus.DONE.value,
            Task.deadline.isnot(None),
            Task.deadline < date.today(),
        )
    )
    overdue_tasks = overdue_tasks_result.scalar() or 0

    return DashboardStats(
        projects_in_progress=projects_in_progress,
        projects_waiting_for_client=projects_waiting,
        overdue_invoices=overdue_invoices,
        overdue_amount=overdue_amount,
        recent_activity=recent_activity,
        projects_without_repos=projects_without_repos,
        hours_this_year=hours_this_year,
        open_tasks=open_tasks,
        overdue_tasks=overdue_tasks,
    )
