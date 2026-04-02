from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.core.dependencies import require_role, get_client_ip
from app.core.rbac import Role
from app.services.audit_service import create_audit_log
from app.modules.clients.models import Client
from app.models.project import ProjectWorkspace
from app.modules.clients.schemas import ClientCreate, ClientUpdate, ClientResponse, ClientDetailResponse

router = APIRouter(prefix="/api/v1/clients", tags=["clients"])


@router.get("", response_model=list[ClientResponse])
async def list_clients(
    current_user=Depends(require_role(Role.ADMIN, Role.EMPLOYEE, Role.FINANCE)),
    db: AsyncSession = Depends(get_db),
) -> list[ClientResponse]:
    # Single query with LEFT JOIN to count projects per client
    project_count_subq = (
        select(
            ProjectWorkspace.client_id,
            func.count(ProjectWorkspace.id).label("project_count"),
        )
        .where(ProjectWorkspace.deleted_at.is_(None))
        .group_by(ProjectWorkspace.client_id)
        .subquery()
    )

    result = await db.execute(
        select(Client, func.coalesce(project_count_subq.c.project_count, 0).label("project_count"))
        .outerjoin(project_count_subq, Client.id == project_count_subq.c.client_id)
        .where(Client.deleted_at.is_(None))
        .order_by(Client.company_name)
    )
    rows = result.all()

    return [
        ClientResponse(
            id=client.id, company_name=client.company_name,
            contact_name=client.contact_name, email=client.email,
            phone=client.phone, street=client.street,
            postal_code=client.postal_code, city=client.city,
            notes=client.notes, invoice_details=client.invoice_details,
            created_at=client.created_at, updated_at=client.updated_at,
            project_count=project_count,
        )
        for client, project_count in rows
    ]


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    body: ClientCreate,
    request: Request,
    current_user=Depends(require_role(Role.ADMIN, Role.EMPLOYEE)),
    db: AsyncSession = Depends(get_db),
) -> ClientResponse:
    # Duplicate check
    email_lower = body.email.lower().strip()
    existing = await db.execute(
        select(Client).where(
            (Client.email == email_lower) | (Client.company_name == body.company_name.strip()),
            Client.deleted_at.is_(None),
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Client with this email or company name already exists")

    client = Client(
        company_name=body.company_name.strip(),
        contact_name=body.contact_name.strip(),
        email=email_lower,
        phone=body.phone,
        street=body.street,
        postal_code=body.postal_code,
        city=body.city,
        notes=body.notes,
        invoice_details=body.invoice_details,
    )
    db.add(client)
    await db.flush()

    await create_audit_log(
        db, "Client", client.id, "CREATE",
        actor_user_id=current_user.id,
        metadata={"company_name": client.company_name},
        ip_address=get_client_ip(request),
    )

    return ClientResponse(
        id=client.id, company_name=client.company_name,
        contact_name=client.contact_name, email=client.email,
        phone=client.phone, street=client.street,
        postal_code=client.postal_code, city=client.city,
        notes=client.notes, invoice_details=client.invoice_details,
        created_at=client.created_at, updated_at=client.updated_at,
        project_count=0,
    )


@router.get("/{client_id}", response_model=ClientDetailResponse)
async def get_client(
    client_id: str,
    current_user=Depends(require_role(Role.ADMIN, Role.EMPLOYEE, Role.FINANCE)),
    db: AsyncSession = Depends(get_db),
) -> ClientDetailResponse:
    result = await db.execute(
        select(Client).where(Client.id == client_id, Client.deleted_at.is_(None))
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    projects_result = await db.execute(
        select(ProjectWorkspace).where(
            ProjectWorkspace.client_id == client_id, ProjectWorkspace.deleted_at.is_(None)
        )
    )
    projects = [{"id": p.id, "name": p.name, "slug": p.slug, "status": p.status} for p in projects_result.scalars().all()]

    from app.models.invoice import Invoice
    invoices_result = await db.execute(
        select(Invoice).where(Invoice.client_id == client_id)
    )
    invoices = [
        {"id": i.id, "invoice_number": i.invoice_number, "status": i.status, "total_amount": str(i.total_amount)}
        for i in invoices_result.scalars().all()
    ]

    return ClientDetailResponse(
        id=client.id, company_name=client.company_name,
        contact_name=client.contact_name, email=client.email,
        phone=client.phone, street=client.street,
        postal_code=client.postal_code, city=client.city,
        notes=client.notes, invoice_details=client.invoice_details,
        created_at=client.created_at, updated_at=client.updated_at,
        project_count=len(projects),
        projects=projects, invoices=invoices,
    )


@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: str,
    body: ClientUpdate,
    request: Request,
    current_user=Depends(require_role(Role.ADMIN, Role.EMPLOYEE)),
    db: AsyncSession = Depends(get_db),
) -> ClientResponse:
    result = await db.execute(
        select(Client).where(Client.id == client_id, Client.deleted_at.is_(None))
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    changes = {}
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "email" and value:
            value = value.lower().strip()
        old_value = getattr(client, field)
        if old_value != value:
            changes[field] = {"old": str(old_value), "new": str(value)}
            setattr(client, field, value)

    if changes:
        await db.flush()
        await db.refresh(client)
        await create_audit_log(
            db, "Client", client.id, "UPDATE",
            actor_user_id=current_user.id,
            metadata=changes,
            ip_address=get_client_ip(request),
        )

    count_result = await db.execute(
        select(func.count(ProjectWorkspace.id))
        .where(ProjectWorkspace.client_id == client.id, ProjectWorkspace.deleted_at.is_(None))
    )
    project_count = count_result.scalar() or 0

    return ClientResponse(
        id=client.id, company_name=client.company_name,
        contact_name=client.contact_name, email=client.email,
        phone=client.phone, street=client.street,
        postal_code=client.postal_code, city=client.city,
        notes=client.notes, invoice_details=client.invoice_details,
        created_at=client.created_at, updated_at=client.updated_at,
        project_count=project_count,
    )


@router.delete("/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: str,
    request: Request,
    current_user=Depends(require_role(Role.ADMIN)),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(
        select(Client).where(Client.id == client_id, Client.deleted_at.is_(None))
    )
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    # Check for active projects
    project_count = await db.execute(
        select(func.count(ProjectWorkspace.id))
        .where(ProjectWorkspace.client_id == client_id, ProjectWorkspace.deleted_at.is_(None))
    )
    if (project_count.scalar() or 0) > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete client with active projects",
        )

    from datetime import datetime, timezone
    client.deleted_at = datetime.now(timezone.utc)
    db.add(client)

    await create_audit_log(
        db, "Client", client.id, "DELETE",
        actor_user_id=current_user.id,
        metadata={"company_name": client.company_name},
        ip_address=get_client_ip(request),
    )
