from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
from decimal import Decimal
import io

from app.database import get_db
from app.core.dependencies import require_role, get_client_ip
from app.core.rbac import Role
from app.services.audit_service import create_audit_log
from app.services.pdf_service import generate_invoice_pdf
from app.modules.invoices.models import Invoice, InvoiceStatus
from app.models.client import Client
from app.models.business_settings import BusinessSettings
from app.modules.invoices.schemas import InvoiceCreate, InvoiceUpdate, InvoiceResponse, InvoiceFilterParams

router = APIRouter(prefix="/api/v1/invoices", tags=["invoices"])


async def _generate_invoice_number(db: AsyncSession) -> str:
    year = datetime.now().year
    prefix = f"{year}-"
    result = await db.execute(
        select(Invoice.invoice_number)
        .where(Invoice.invoice_number.like(f"{prefix}%"))
        .order_by(Invoice.invoice_number.desc())
        .limit(1)
        .with_for_update()
    )
    last = result.scalar_one_or_none()
    if last:
        last_num = int(last.split("-")[1])
        return f"{prefix}{last_num + 1:03d}"
    return f"{prefix}001"


def _calculate_vat(subtotal: Decimal, vat_rate: Decimal) -> tuple[Decimal, Decimal]:
    vat_amount = (subtotal * vat_rate / Decimal("100")).quantize(Decimal("0.01"))
    total = subtotal + vat_amount
    return vat_amount, total


def _build_line_items(raw_items: list) -> tuple[list[dict], Decimal]:
    """Recalculate item totals server-side and return serialized items + subtotal."""
    items = []
    for item in raw_items:
        qty = Decimal(str(item.quantity if hasattr(item, "quantity") else item["quantity"]))
        price = Decimal(str(item.unit_price if hasattr(item, "unit_price") else item["unit_price"]))
        desc = item.description if hasattr(item, "description") else item["description"]
        item_total = (qty * price).quantize(Decimal("0.01"))
        items.append({
            "description": desc,
            "quantity": str(qty),
            "unit_price": str(price),
            "total": str(item_total),
        })
    subtotal = sum(Decimal(i["total"]) for i in items)
    return items, subtotal


@router.get("", response_model=list[InvoiceResponse])
async def list_invoices(
    client_id: str | None = None,
    project_id: str | None = None,
    invoice_status: str | None = Query(None, alias="status"),
    current_user=Depends(require_role(Role.ADMIN, Role.FINANCE)),
    db: AsyncSession = Depends(get_db),
) -> list[InvoiceResponse]:
    query = select(Invoice).order_by(Invoice.created_at.desc())
    if client_id:
        query = query.where(Invoice.client_id == client_id)
    if project_id:
        query = query.where(Invoice.project_id == project_id)
    if invoice_status:
        query = query.where(Invoice.status == invoice_status)

    result = await db.execute(query)
    return [InvoiceResponse.model_validate(inv) for inv in result.scalars().all()]


@router.post("", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    body: InvoiceCreate,
    request: Request,
    current_user=Depends(require_role(Role.ADMIN, Role.FINANCE)),
    db: AsyncSession = Depends(get_db),
) -> InvoiceResponse:
    client = await db.execute(select(Client).where(Client.id == body.client_id, Client.deleted_at.is_(None)))
    if not client.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    invoice_number = await _generate_invoice_number(db)

    if body.line_items:
        line_items_data, subtotal = _build_line_items(body.line_items)
    else:
        line_items_data = []
        subtotal = body.subtotal

    vat_amount, total_amount = _calculate_vat(subtotal, body.vat_rate)

    invoice = Invoice(
        client_id=body.client_id,
        project_id=body.project_id,
        invoice_number=invoice_number,
        issue_date=body.issue_date,
        service_date=body.service_date,
        due_date=body.due_date,
        status=InvoiceStatus.DRAFT.value,
        subtotal=subtotal,
        vat_rate=body.vat_rate,
        vat_amount=vat_amount,
        total_amount=total_amount,
        description=body.description,
        notes=body.notes,
        line_items=line_items_data,
    )
    db.add(invoice)
    await db.flush()

    await create_audit_log(
        db, "Invoice", invoice.id, "CREATE",
        actor_user_id=current_user.id,
        metadata={"invoice_number": invoice_number, "total": str(total_amount)},
        ip_address=get_client_ip(request),
    )
    return InvoiceResponse.model_validate(invoice)


@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(
    invoice_id: str,
    current_user=Depends(require_role(Role.ADMIN, Role.FINANCE)),
    db: AsyncSession = Depends(get_db),
) -> InvoiceResponse:
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")
    return InvoiceResponse.model_validate(invoice)


@router.patch("/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(
    invoice_id: str,
    body: InvoiceUpdate,
    request: Request,
    current_user=Depends(require_role(Role.ADMIN, Role.FINANCE)),
    db: AsyncSession = Depends(get_db),
) -> InvoiceResponse:
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    changes = {}
    update_data = body.model_dump(exclude_unset=True)

    # Handle line_items with server-side recalculation
    if "line_items" in update_data and update_data["line_items"] is not None:
        raw_items = update_data.pop("line_items")
        line_items_data, new_subtotal = _build_line_items(raw_items)
        changes["line_items"] = {"old": str(invoice.line_items), "new": str(line_items_data)}
        invoice.line_items = line_items_data
        invoice.subtotal = new_subtotal

    for field, value in update_data.items():
        if hasattr(value, "value"):
            value = value.value
        old_value = getattr(invoice, field)
        if str(old_value) != str(value):
            changes[field] = {"old": str(old_value), "new": str(value)}
            setattr(invoice, field, value)

    if changes:
        vat_amount, total_amount = _calculate_vat(invoice.subtotal, invoice.vat_rate)
        invoice.vat_amount = vat_amount
        invoice.total_amount = total_amount
        await db.flush()
        await db.refresh(invoice)
        await create_audit_log(
            db, "Invoice", invoice.id, "UPDATE",
            actor_user_id=current_user.id,
            metadata=changes,
            ip_address=get_client_ip(request),
        )

    return InvoiceResponse.model_validate(invoice)


@router.delete("/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(
    invoice_id: str,
    request: Request,
    current_user=Depends(require_role(Role.ADMIN, Role.FINANCE)),
    db: AsyncSession = Depends(get_db),
) -> None:
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    await db.delete(invoice)
    await create_audit_log(
        db, "Invoice", invoice.id, "DELETE",
        actor_user_id=current_user.id,
        metadata={"invoice_number": invoice.invoice_number},
        ip_address=get_client_ip(request),
    )


@router.post("/{invoice_id}/mark-paid", response_model=InvoiceResponse)
async def mark_invoice_paid(
    invoice_id: str,
    request: Request,
    current_user=Depends(require_role(Role.ADMIN, Role.FINANCE)),
    db: AsyncSession = Depends(get_db),
) -> InvoiceResponse:
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    invoice.status = InvoiceStatus.PAID.value
    invoice.paid_at = datetime.now(timezone.utc)
    db.add(invoice)

    await create_audit_log(
        db, "Invoice", invoice.id, "MARK_PAID",
        actor_user_id=current_user.id,
        metadata={"invoice_number": invoice.invoice_number, "total": str(invoice.total_amount)},
        ip_address=get_client_ip(request),
    )
    return InvoiceResponse.model_validate(invoice)


@router.get("/{invoice_id}/pdf")
async def download_invoice_pdf(
    invoice_id: str,
    current_user=Depends(require_role(Role.ADMIN, Role.FINANCE)),
    db: AsyncSession = Depends(get_db),
) -> StreamingResponse:
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invoice not found")

    client_result = await db.execute(select(Client).where(Client.id == invoice.client_id))
    client = client_result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")

    settings_result = await db.execute(select(BusinessSettings).where(BusinessSettings.id == 1))
    settings = settings_result.scalar_one_or_none()
    if not settings:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Business settings not configured")

    invoice_data = {
        "invoice_number": invoice.invoice_number,
        "issue_date": invoice.issue_date,
        "service_date": invoice.service_date,
        "due_date": invoice.due_date,
        "subtotal": invoice.subtotal,
        "vat_rate": invoice.vat_rate,
        "vat_amount": invoice.vat_amount,
        "total_amount": invoice.total_amount,
        "description": invoice.description,
        "notes": invoice.notes,
        "line_items": invoice.line_items or [],
    }
    client_data = {
        "company_name": client.company_name,
        "contact_name": client.contact_name,
        "email": client.email,
        "street": client.street,
        "postal_code": client.postal_code,
        "city": client.city,
    }
    settings_data = {
        "company_name": settings.company_name,
        "street": settings.street,
        "postal_code": settings.postal_code,
        "city": settings.city,
        "email": settings.email,
        "phone": settings.phone,
        "kvk_number": settings.kvk_number,
        "vat_number": settings.vat_number,
        "iban": settings.iban,
        "account_holder_name": settings.account_holder_name,
        "payment_term_days": settings.payment_term_days,
        "invoice_footer_text": settings.invoice_footer_text,
        "website_url": settings.website_url,
    }

    pdf_bytes = generate_invoice_pdf(invoice_data, client_data, settings_data)

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="factuur-{invoice.invoice_number}.pdf"'},
    )
