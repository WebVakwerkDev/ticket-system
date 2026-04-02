from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone

from app.database import get_db
from app.core.dependencies import require_role, get_client_ip
from app.core.rbac import Role
from app.core.security import verify_password
from app.services.audit_service import create_audit_log
from app.models.user import User
from app.modules.clients.models import Client
from app.modules.projects.models import ProjectWorkspace
from app.models.communication import CommunicationEntry
from app.models.change_request import ChangeRequest
from app.models.internal_note import InternalNote
from app.models.invoice import Invoice
from app.models.proposal import ProposalDraft
from app.models.repository import ProjectRepository
from app.models.project_link import ProjectLink
from app.models.agent_run import AgentRun
from app.models.business_settings import BusinessSettings
from app.models.audit_log import AuditLog
from app.schemas.export import ExportRequest, ExportResponse

router = APIRouter(prefix="/api/v1/export", tags=["export"])


def _serialize(obj) -> dict:
    """Convert SQLAlchemy model to dict with safe serialization."""
    data = {}
    for column in obj.__table__.columns:
        value = getattr(obj, column.name)
        if isinstance(value, datetime):
            value = value.isoformat()
        elif hasattr(value, "__str__") and not isinstance(value, (str, int, float, bool, type(None))):
            value = str(value)
        data[column.name] = value
    return data


@router.post("/database", response_model=ExportResponse)
async def export_database(
    body: ExportRequest,
    request: Request,
    current_user=Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> ExportResponse:
    if not verify_password(body.password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password verification failed",
        )

    tables = {
        "users": User,
        "clients": Client,
        "projects": ProjectWorkspace,
        "communications": CommunicationEntry,
        "change_requests": ChangeRequest,
        "internal_notes": InternalNote,
        "invoices": Invoice,
        "proposals": ProposalDraft,
        "repositories": ProjectRepository,
        "project_links": ProjectLink,
        "agent_runs": AgentRun,
        "business_settings": BusinessSettings,
        "audit_logs": AuditLog,
    }

    data = {}
    counts = {}
    for name, model in tables.items():
        result = await db.execute(select(model))
        rows = result.scalars().all()
        data[name] = [_serialize(row) for row in rows]
        counts[name] = len(data[name])

    await create_audit_log(
        db, "System", "database", "EXPORT",
        actor_user_id=current_user.id,
        metadata={"counts": counts},
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )

    return ExportResponse(
        exported_by=current_user.email,
        exported_at=datetime.now(timezone.utc).isoformat(),
        counts=counts,
        data=data,
    )
