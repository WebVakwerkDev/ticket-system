from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slugify import slugify
import uuid
import structlog

from app.database import get_db
from app.core.dependencies import verify_external_api_key, get_client_ip
from app.core.security import sanitize_html
from app.services.audit_service import create_audit_log
from app.services.discord_service import send_ticket_notification
from app.modules.clients.models import Client
from app.modules.projects.models import ProjectWorkspace, ProjectStatus, Priority
from app.models.change_request import ChangeRequest, ChangeRequestSource, ChangeRequestStatus, Impact
from app.models.user import User
from app.core.rbac import Role
from app.schemas.external import ExternalTicketCreate, ExternalTicketResponse

logger = structlog.get_logger(__name__)

router = APIRouter(prefix="/api/v1/external", tags=["external"])


@router.post("/tickets", response_model=ExternalTicketResponse, status_code=status.HTTP_201_CREATED)
async def create_external_ticket(
    body: ExternalTicketCreate,
    request: Request,
    api_key_valid: bool = Depends(verify_external_api_key),
    db: AsyncSession = Depends(get_db),
) -> ExternalTicketResponse:
    client = None
    if body.client_id:
        result = await db.execute(select(Client).where(Client.id == body.client_id, Client.deleted_at.is_(None)))
        client = result.scalar_one_or_none()
        if not client:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
    elif body.client:
        email_lower = body.client.email.lower().strip()
        result = await db.execute(
            select(Client).where(
                (Client.email == email_lower) | (Client.company_name == body.client.company_name),
                Client.deleted_at.is_(None),
            )
        )
        client = result.scalar_one_or_none()
        if not client:
            client = Client(
                company_name=body.client.company_name,
                contact_name=body.client.contact_name,
                email=email_lower,
                phone=body.client.phone,
            )
            db.add(client)
            await db.flush()
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Either client_id or client data is required")

    base_slug = slugify(body.project_name, max_length=250)
    slug = base_slug
    for attempt in range(5):
        result = await db.execute(select(ProjectWorkspace).where(ProjectWorkspace.slug == slug))
        if not result.scalar_one_or_none():
            break
        slug = f"{base_slug}-{uuid.uuid4().hex[:8]}"

    admin_result = await db.execute(
        select(User).where(User.role == Role.ADMIN.value, User.is_active == True).limit(1)
    )
    system_actor = admin_result.scalar_one_or_none()
    actor_id = system_actor.id if system_actor else None

    project = ProjectWorkspace(
        client_id=client.id,
        name=body.project_name,
        slug=slug,
        project_type="OTHER",
        status=ProjectStatus.LEAD.value,
        priority=body.priority if body.priority in [p.value for p in Priority] else Priority.MEDIUM.value,
        description=sanitize_html(body.description),
    )
    db.add(project)
    await db.flush()

    source_value = body.source if body.source in [s.value for s in ChangeRequestSource] else ChangeRequestSource.WEBSITE_FORM.value
    cr = ChangeRequest(
        project_id=project.id,
        title=body.project_name,
        description=sanitize_html(body.description),
        source_type=source_value,
        status=ChangeRequestStatus.NEW.value,
        impact=Impact.MEDIUM.value,
        created_by_user_id=actor_id or "system",
    )
    db.add(cr)
    await db.flush()

    await create_audit_log(
        db, "Project", project.id, "CREATE",
        actor_user_id=actor_id,
        metadata={
            "source": "external_api",
            "client_name": client.company_name,
            "project_name": project.name,
        },
        ip_address=get_client_ip(request),
        user_agent=request.headers.get("User-Agent"),
    )

    try:
        await send_ticket_notification(
            project_name=project.name,
            client_name=client.company_name,
            description=body.description[:200],
            project_slug=project.slug,
            change_request_id=cr.id,
        )
    except Exception as exc:
        logger.error("discord_notification_failed", project_slug=project.slug, error=str(exc))

    return ExternalTicketResponse(
        ticket_id=cr.id,
        project_id=project.id,
        project_slug=project.slug,
        status=project.status,
        created_at=project.created_at,
    )


@router.get("/tickets/{ticket_id}/status")
async def get_ticket_status(
    ticket_id: str,
    api_key_valid: bool = Depends(verify_external_api_key),
    db: AsyncSession = Depends(get_db),
) -> dict:
    result = await db.execute(select(ChangeRequest).where(ChangeRequest.id == ticket_id))
    cr = result.scalar_one_or_none()
    if not cr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ticket not found")

    project_result = await db.execute(select(ProjectWorkspace).where(ProjectWorkspace.id == cr.project_id))
    project = project_result.scalar_one_or_none()

    return {
        "ticket_id": cr.id,
        "status": cr.status,
        "project_status": project.status if project else None,
        "impact": cr.impact,
        "created_at": str(cr.created_at),
        "updated_at": str(cr.updated_at),
        "closed_at": str(cr.closed_at) if cr.closed_at else None,
    }
