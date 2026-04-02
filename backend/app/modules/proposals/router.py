from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import io

from app.database import get_db
from app.core.dependencies import require_role, get_client_ip
from app.core.rbac import Role
from app.services.audit_service import create_audit_log
from app.services.pdf_service import generate_proposal_pdf
from app.modules.proposals.models import ProposalDraft, ProposalStatus
from app.models.client import Client
from app.models.business_settings import BusinessSettings
from app.modules.proposals.schemas import ProposalCreate, ProposalUpdate, ProposalResponse

router = APIRouter(prefix="/api/v1/proposals", tags=["proposals"])


@router.get("", response_model=list[ProposalResponse])
async def list_all_proposals(
    current_user=Depends(require_role(Role.ADMIN, Role.EMPLOYEE)),
    db: AsyncSession = Depends(get_db),
) -> list[ProposalResponse]:
    result = await db.execute(
        select(ProposalDraft).order_by(ProposalDraft.created_at.desc())
    )
    return [ProposalResponse.model_validate(p) for p in result.scalars().all()]


@router.get("/by-project/{project_id}", response_model=list[ProposalResponse])
async def list_proposals(
    project_id: str,
    current_user=Depends(require_role(Role.ADMIN, Role.EMPLOYEE)),
    db: AsyncSession = Depends(get_db),
) -> list[ProposalResponse]:
    result = await db.execute(
        select(ProposalDraft)
        .where(ProposalDraft.project_id == project_id)
        .order_by(ProposalDraft.created_at.desc())
    )
    return [ProposalResponse.model_validate(p) for p in result.scalars().all()]


@router.post("", response_model=ProposalResponse, status_code=status.HTTP_201_CREATED)
async def create_proposal(
    body: ProposalCreate,
    request: Request,
    current_user=Depends(require_role(Role.ADMIN, Role.EMPLOYEE)),
    db: AsyncSession = Depends(get_db),
) -> ProposalResponse:
    client = await db.execute(select(Client).where(Client.id == body.client_id, Client.deleted_at.is_(None)))
    if not client.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    proposal = ProposalDraft(
        client_id=body.client_id,
        project_id=body.project_id,
        title=body.title,
        recipient_name=body.recipient_name,
        recipient_email=body.recipient_email.lower().strip(),
        recipient_company=body.recipient_company,
        recipient_address=body.recipient_address,
        summary=body.summary,
        scope=body.scope,
        price_label=body.price_label,
        amount=body.amount,
        delivery_time=body.delivery_time,
        notes=body.notes,
        status=ProposalStatus.DRAFT.value,
    )
    db.add(proposal)
    await db.flush()

    await create_audit_log(
        db, "Proposal", proposal.id, "CREATE",
        actor_user_id=current_user.id,
        metadata={"title": proposal.title},
        ip_address=get_client_ip(request),
    )
    return ProposalResponse.model_validate(proposal)


@router.get("/{proposal_id}", response_model=ProposalResponse)
async def get_proposal(
    proposal_id: str,
    current_user=Depends(require_role(Role.ADMIN, Role.EMPLOYEE)),
    db: AsyncSession = Depends(get_db),
) -> ProposalResponse:
    result = await db.execute(select(ProposalDraft).where(ProposalDraft.id == proposal_id))
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")
    return ProposalResponse.model_validate(proposal)


@router.patch("/{proposal_id}", response_model=ProposalResponse)
async def update_proposal(
    proposal_id: str,
    body: ProposalUpdate,
    request: Request,
    current_user=Depends(require_role(Role.ADMIN, Role.EMPLOYEE)),
    db: AsyncSession = Depends(get_db),
) -> ProposalResponse:
    result = await db.execute(select(ProposalDraft).where(ProposalDraft.id == proposal_id))
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")

    changes = {}
    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "recipient_email" and value:
            value = value.lower().strip()
        if hasattr(value, "value"):
            value = value.value
        old_value = getattr(proposal, field)
        if str(old_value) != str(value):
            changes[field] = {"old": str(old_value), "new": str(value)}
            setattr(proposal, field, value)

    if changes:
        await db.flush()
        await db.refresh(proposal)
        await create_audit_log(
            db, "Proposal", proposal.id, "UPDATE",
            actor_user_id=current_user.id,
            metadata=changes,
            ip_address=get_client_ip(request),
        )

    return ProposalResponse.model_validate(proposal)


@router.delete("/{proposal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_proposal(
    proposal_id: str,
    request: Request,
    current_user=Depends(require_role(Role.ADMIN, Role.EMPLOYEE)),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(ProposalDraft).where(ProposalDraft.id == proposal_id))
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")

    await db.delete(proposal)
    await create_audit_log(
        db, "Proposal", proposal.id, "DELETE",
        actor_user_id=current_user.id,
        metadata={"title": proposal.title},
        ip_address=get_client_ip(request),
    )


@router.get("/{proposal_id}/pdf")
async def download_proposal_pdf(
    proposal_id: str,
    current_user=Depends(require_role(Role.ADMIN, Role.EMPLOYEE)),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    result = await db.execute(select(ProposalDraft).where(ProposalDraft.id == proposal_id))
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposal not found")

    client_result = await db.execute(select(Client).where(Client.id == proposal.client_id))
    client = client_result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    settings_result = await db.execute(select(BusinessSettings).where(BusinessSettings.id == 1))
    settings = settings_result.scalar_one_or_none()
    if not settings:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Business settings not configured")

    proposal_data = {
        "id": proposal.id,
        "title": proposal.title,
        "recipient_name": proposal.recipient_name,
        "recipient_email": proposal.recipient_email,
        "recipient_company": proposal.recipient_company,
        "recipient_address": proposal.recipient_address,
        "summary": proposal.summary,
        "scope": proposal.scope,
        "price_label": proposal.price_label,
        "amount": proposal.amount,
        "delivery_time": proposal.delivery_time,
        "notes": proposal.notes,
    }
    client_data = {
        "company_name": client.company_name,
        "contact_name": client.contact_name,
        "email": client.email,
    }
    settings_data = {
        "company_name": settings.company_name,
        "street": settings.street,
        "postal_code": settings.postal_code,
        "city": settings.city,
        "email": settings.email,
        "phone": settings.phone,
        "website_url": settings.website_url,
        "default_vat_rate": settings.default_vat_rate,
        "default_quote_valid_days": settings.default_quote_valid_days,
        "quote_footer_text": settings.quote_footer_text,
        "default_terms_text": settings.default_terms_text,
    }

    pdf_bytes = generate_proposal_pdf(proposal_data, client_data, settings_data)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="offerte-{proposal.title[:30]}.pdf"'},
    )
