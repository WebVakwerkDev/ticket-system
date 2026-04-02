from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slugify import slugify
import uuid

from app.database import get_db
from app.core.dependencies import require_role, get_client_ip
from app.core.rbac import Role
from app.core.security import sanitize_html
from app.services.audit_service import create_audit_log
from app.modules.projects.models import ProjectWorkspace, ProjectStatus, Priority
from app.modules.clients.models import Client
from app.modules.projects.schemas import ProjectCreate, ProjectUpdate, ProjectResponse, ProjectDetailResponse

router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


async def _generate_unique_slug(db: AsyncSession, name: str) -> str:
    base_slug = slugify(name, max_length=250)
    slug = base_slug
    for attempt in range(5):
        result = await db.execute(select(ProjectWorkspace).where(ProjectWorkspace.slug == slug))
        if not result.scalar_one_or_none():
            return slug
        slug = f"{base_slug}-{uuid.uuid4().hex[:8]}"
    raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not generate unique slug")


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    status_filter: str | None = Query(None, alias="status"),
    client_id: str | None = None,
    priority: str | None = None,
    current_user=Depends(require_role(Role.ADMIN, Role.EMPLOYEE)),
    db: AsyncSession = Depends(get_db),
) -> list[ProjectResponse]:
    query = select(ProjectWorkspace).where(ProjectWorkspace.deleted_at.is_(None))
    if status_filter:
        query = query.where(ProjectWorkspace.status == status_filter)
    if client_id:
        query = query.where(ProjectWorkspace.client_id == client_id)
    if priority:
        query = query.where(ProjectWorkspace.priority == priority)
    query = query.order_by(ProjectWorkspace.created_at.desc())

    result = await db.execute(query)
    projects = result.scalars().all()
    return [ProjectResponse.model_validate(p) for p in projects]


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    request: Request,
    current_user=Depends(require_role(Role.ADMIN, Role.EMPLOYEE)),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    client_result = await db.execute(
        select(Client).where(Client.id == body.client_id, Client.deleted_at.is_(None))
    )
    if not client_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    slug = await _generate_unique_slug(db, body.name)

    project = ProjectWorkspace(
        client_id=body.client_id,
        name=body.name,
        slug=slug,
        project_type=body.project_type.value,
        status=body.status.value,
        priority=body.priority.value,
        description=sanitize_html(body.description) if body.description else None,
        intake_summary=body.intake_summary,
        scope=body.scope,
        tech_stack=body.tech_stack,
        domain_name=body.domain_name,
        hosting_info=body.hosting_info,
        start_date=body.start_date,
        owner_user_id=body.owner_user_id,
        tags=body.tags,
    )
    db.add(project)
    await db.flush()

    await create_audit_log(
        db, "Project", project.id, "CREATE",
        actor_user_id=current_user.id,
        metadata={"name": project.name, "slug": slug},
        ip_address=get_client_ip(request),
    )

    return ProjectResponse.model_validate(project)


@router.get("/by-slug/{slug}", response_model=ProjectDetailResponse)
async def get_project_by_slug(
    slug: str,
    current_user=Depends(require_role(Role.ADMIN, Role.EMPLOYEE)),
    db: AsyncSession = Depends(get_db),
) -> ProjectDetailResponse:
    result = await db.execute(
        select(ProjectWorkspace).where(ProjectWorkspace.slug == slug, ProjectWorkspace.deleted_at.is_(None))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return await _build_project_detail(db, project)


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: str,
    current_user=Depends(require_role(Role.ADMIN, Role.EMPLOYEE)),
    db: AsyncSession = Depends(get_db),
) -> ProjectDetailResponse:
    result = await db.execute(
        select(ProjectWorkspace).where(ProjectWorkspace.id == project_id, ProjectWorkspace.deleted_at.is_(None))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return await _build_project_detail(db, project)


async def _build_project_detail(db: AsyncSession, project: ProjectWorkspace) -> ProjectDetailResponse:
    from app.models.communication import CommunicationEntry
    from app.models.change_request import ChangeRequest
    from app.models.repository import ProjectRepository
    from app.models.project_link import ProjectLink

    comms = await db.execute(
        select(CommunicationEntry)
        .where(CommunicationEntry.project_id == project.id)
        .order_by(CommunicationEntry.occurred_at.desc())
        .limit(100)
    )
    crs = await db.execute(
        select(ChangeRequest).where(ChangeRequest.project_id == project.id).order_by(ChangeRequest.created_at.desc())
    )
    repos = await db.execute(
        select(ProjectRepository).where(ProjectRepository.project_id == project.id)
    )
    links = await db.execute(
        select(ProjectLink).where(ProjectLink.project_id == project.id)
    )

    client_result = await db.execute(select(Client).where(Client.id == project.client_id))
    client = client_result.scalar_one_or_none()
    client_dict = {"id": client.id, "company_name": client.company_name, "contact_name": client.contact_name, "email": client.email} if client else None

    owner_dict = None
    if project.owner_user_id:
        from app.models.user import User
        owner_result = await db.execute(select(User).where(User.id == project.owner_user_id))
        owner = owner_result.scalar_one_or_none()
        if owner:
            owner_dict = {"id": owner.id, "name": owner.name, "email": owner.email}

    base = ProjectResponse.model_validate(project).model_dump()
    base["client"] = client_dict
    base["owner"] = owner_dict
    base["communications"] = [
        {"id": c.id, "type": c.type, "subject": c.subject, "occurred_at": str(c.occurred_at)}
        for c in comms.scalars().all()
    ]
    base["change_requests"] = [
        {"id": cr.id, "title": cr.title, "status": cr.status, "impact": cr.impact}
        for cr in crs.scalars().all()
    ]
    base["repositories"] = [
        {"id": r.id, "repo_name": r.repo_name, "repo_url": r.repo_url}
        for r in repos.scalars().all()
    ]
    base["links"] = [
        {"id": l.id, "label": l.label, "url": l.url}
        for l in links.scalars().all()
    ]
    return ProjectDetailResponse(**base)


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    body: ProjectUpdate,
    request: Request,
    current_user=Depends(require_role(Role.ADMIN, Role.EMPLOYEE)),
    db: AsyncSession = Depends(get_db),
) -> ProjectResponse:
    result = await db.execute(
        select(ProjectWorkspace).where(ProjectWorkspace.id == project_id, ProjectWorkspace.deleted_at.is_(None))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    changes = {}
    update_data = body.model_dump(exclude_unset=True)

    updatable_fields = {
        "name", "project_type", "status", "priority", "description",
        "intake_summary", "scope", "tech_stack", "domain_name",
        "hosting_info", "start_date", "owner_user_id", "tags",
    }

    for field_name, value in update_data.items():
        if field_name not in updatable_fields:
            continue
        if field_name == "description" and value:
            value = sanitize_html(value)
        if hasattr(value, "value"):
            value = value.value
        old_value = getattr(project, field_name)
        if old_value != value:
            changes[field_name] = {"old": str(old_value), "new": str(value)}
            setattr(project, field_name, value)

    if changes:
        await db.flush()
        await db.refresh(project)
        action = "STATUS_CHANGE" if "status" in changes else "UPDATE"
        await create_audit_log(
            db, "Project", project.id, action,
            actor_user_id=current_user.id,
            metadata=changes,
            ip_address=get_client_ip(request),
        )

    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    request: Request,
    current_user=Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(ProjectWorkspace).where(ProjectWorkspace.id == project_id, ProjectWorkspace.deleted_at.is_(None))
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")

    from datetime import datetime, timezone
    project.deleted_at = datetime.now(timezone.utc)
    db.add(project)

    from app.models.invoice import Invoice
    invoices = await db.execute(select(Invoice).where(Invoice.project_id == project_id))
    for invoice in invoices.scalars().all():
        invoice.project_id = None
        db.add(invoice)

    await create_audit_log(
        db, "Project", project.id, "DELETE",
        actor_user_id=current_user.id,
        metadata={"name": project.name},
        ip_address=get_client_ip(request),
    )
