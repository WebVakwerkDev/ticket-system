from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from decimal import Decimal
from datetime import date
import csv
import io
import calendar

from app.database import get_db
from app.core.dependencies import require_role
from app.core.rbac import Role
from app.services.pdf_service import generate_report_pdf
from app.models.invoice import Invoice, InvoiceStatus
from app.models.expense import Expense
from app.models.client import Client
from app.models.business_settings import BusinessSettings
from app.schemas.finance import FinanceOverview, VatBreakdown, QuarterVatSummary, MonthlyReport, YearlyReport

router = APIRouter(prefix="/api/v1/finance", tags=["finance"])


@router.get("/overview", response_model=FinanceOverview)
async def get_finance_overview(
    current_user=Depends(require_role(Role.ADMIN, Role.FINANCE)),
    db: AsyncSession = Depends(get_db),
) -> FinanceOverview:
    # Total revenue (PAID)
    paid = await db.execute(
        select(func.coalesce(func.sum(Invoice.total_amount), 0))
        .where(Invoice.status == InvoiceStatus.PAID.value)
    )
    total_revenue = paid.scalar() or Decimal("0")

    # Open amount (SENT)
    sent = await db.execute(
        select(func.coalesce(func.sum(Invoice.total_amount), 0))
        .where(Invoice.status == InvoiceStatus.SENT.value)
    )
    open_amount = sent.scalar() or Decimal("0")

    # Overdue amount
    overdue = await db.execute(
        select(func.coalesce(func.sum(Invoice.total_amount), 0))
        .where(Invoice.status == InvoiceStatus.OVERDUE.value)
    )
    overdue_amount = overdue.scalar() or Decimal("0")

    # Total expenses (excl VAT)
    expenses_result = await db.execute(
        select(func.coalesce(func.sum(Expense.amount_excl_vat), 0))
    )
    total_expenses = expenses_result.scalar() or Decimal("0")

    # VAT by quarter for current year
    year = date.today().year
    vat_by_quarter: dict[str, QuarterVatSummary] = {}
    for quarter in range(1, 5):
        start_month = (quarter - 1) * 3 + 1
        end_month = quarter * 3

        # Received VAT (from paid invoices)
        result = await db.execute(
            select(
                Invoice.vat_rate,
                func.sum(Invoice.subtotal).label("subtotal"),
                func.sum(Invoice.vat_amount).label("vat_amount"),
                func.sum(Invoice.total_amount).label("total"),
            )
            .where(
                Invoice.status == InvoiceStatus.PAID.value,
                extract("year", Invoice.issue_date) == year,
                extract("month", Invoice.issue_date) >= start_month,
                extract("month", Invoice.issue_date) <= end_month,
            )
            .group_by(Invoice.vat_rate)
        )
        rows = result.all()
        breakdown = [
            VatBreakdown(
                vat_rate=row.vat_rate,
                subtotal=row.subtotal or Decimal("0"),
                vat_amount=row.vat_amount or Decimal("0"),
                total=row.total or Decimal("0"),
            )
            for row in rows
        ]
        received_vat = sum(b.vat_amount for b in breakdown)

        # Paid VAT (from expenses)
        expense_vat_result = await db.execute(
            select(func.coalesce(func.sum(Expense.vat_amount), 0))
            .where(
                extract("year", Expense.date) == year,
                extract("month", Expense.date) >= start_month,
                extract("month", Expense.date) <= end_month,
            )
        )
        paid_vat = expense_vat_result.scalar() or Decimal("0")

        vat_by_quarter[f"Q{quarter}"] = QuarterVatSummary(
            received_vat=received_vat,
            paid_vat=paid_vat,
            vat_due=received_vat - paid_vat,
            breakdown=breakdown,
        )

    return FinanceOverview(
        total_revenue=total_revenue,
        open_amount=open_amount,
        overdue_amount=overdue_amount,
        total_expenses=total_expenses,
        profit=total_revenue - total_expenses,
        vat_by_quarter=vat_by_quarter,
    )


@router.get("/reports/monthly")
async def monthly_report(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    format: str = Query("json", pattern="^(json|csv|pdf)$"),
    current_user=Depends(require_role(Role.ADMIN, Role.FINANCE)),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Invoice, Client.company_name.label("client_name"))
        .join(Client, Invoice.client_id == Client.id)
        .where(
            Invoice.status == InvoiceStatus.PAID.value,
            extract("year", Invoice.issue_date) == year,
            extract("month", Invoice.issue_date) == month,
        )
        .order_by(Invoice.issue_date)
    )
    rows = result.all()

    invoice_list = [
        {
            "invoice_number": inv.invoice_number,
            "client_name": client_name or "Unknown",
            "issue_date": inv.issue_date,
            "subtotal": inv.subtotal,
            "vat_rate": inv.vat_rate,
            "vat_amount": inv.vat_amount,
            "total_amount": inv.total_amount,
            "status": inv.status,
        }
        for inv, client_name in rows
    ]

    # VAT breakdown
    vat_result = await db.execute(
        select(
            Invoice.vat_rate,
            func.sum(Invoice.subtotal).label("subtotal"),
            func.sum(Invoice.vat_amount).label("vat_amount"),
            func.sum(Invoice.total_amount).label("total"),
        )
        .where(
            Invoice.status == InvoiceStatus.PAID.value,
            extract("year", Invoice.issue_date) == year,
            extract("month", Invoice.issue_date) == month,
        )
        .group_by(Invoice.vat_rate)
    )
    vat_rows = vat_result.all()
    vat_breakdown = [
        VatBreakdown(vat_rate=r.vat_rate, subtotal=r.subtotal or Decimal("0"), vat_amount=r.vat_amount or Decimal("0"), total=r.total or Decimal("0"))
        for r in vat_rows
    ]

    month_name = calendar.month_name[month]
    total_sub = sum(i["subtotal"] for i in invoice_list)
    total_vat = sum(i["vat_amount"] for i in invoice_list)
    total_amt = sum(i["total_amount"] for i in invoice_list)

    report = MonthlyReport(
        year=year,
        month=month,
        month_label=f"{month_name} {year}",
        invoices=[{**i, "subtotal": str(i["subtotal"]), "vat_amount": str(i["vat_amount"]), "total_amount": str(i["total_amount"]), "issue_date": str(i["issue_date"])} for i in invoice_list],
        vat_breakdown=vat_breakdown,
        total_subtotal=total_sub,
        total_vat=total_vat,
        total_amount=total_amt,
    )

    if format == "json":
        return report

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Invoice Number", "Client", "Date", "Subtotal", "VAT Rate", "VAT Amount", "Total"])
        for inv in invoice_list:
            writer.writerow([inv["invoice_number"], inv["client_name"], str(inv["issue_date"]), str(inv["subtotal"]), str(inv["vat_rate"]), str(inv["vat_amount"]), str(inv["total_amount"])])
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="rapport-{year}-{month:02d}.csv"'},
        )

    if format == "pdf":
        settings_result = await db.execute(select(BusinessSettings).where(BusinessSettings.id == 1))
        settings = settings_result.scalar_one_or_none()
        if not settings:
            raise HTTPException(status_code=400, detail="Business settings not configured")
        settings_data = {
            "company_name": settings.company_name, "email": settings.email,
            "kvk_number": settings.kvk_number, "vat_number": settings.vat_number,
        }
        report_data = report.model_dump()
        report_data["invoices"] = invoice_list
        pdf_bytes = generate_report_pdf(report_data, "monthly", settings_data)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="rapport-{year}-{month:02d}.pdf"'},
        )


@router.get("/reports/yearly")
async def yearly_report(
    year: int = Query(...),
    format: str = Query("json", pattern="^(json|csv|pdf)$"),
    include_unpaid: bool = Query(False),
    current_user=Depends(require_role(Role.ADMIN, Role.FINANCE)),
    db: AsyncSession = Depends(get_db),
):
    status_filter = [InvoiceStatus.PAID.value]
    if include_unpaid:
        status_filter.extend([InvoiceStatus.SENT.value, InvoiceStatus.OVERDUE.value])

    result = await db.execute(
        select(Invoice)
        .where(
            Invoice.status.in_(status_filter),
            extract("year", Invoice.issue_date) == year,
        )
        .order_by(Invoice.issue_date)
    )
    invoices = result.scalars().all()

    # Monthly breakdown
    monthly: dict[int, dict] = {}
    for inv in invoices:
        m = inv.issue_date.month
        if m not in monthly:
            monthly[m] = {"label": f"{calendar.month_name[m]} {year}", "subtotal": Decimal("0"), "vat": Decimal("0"), "total": Decimal("0"), "count": 0}
        monthly[m]["subtotal"] += inv.subtotal
        monthly[m]["vat"] += inv.vat_amount
        monthly[m]["total"] += inv.total_amount
        monthly[m]["count"] += 1

    monthly_breakdown = [
        {**monthly[m], "subtotal": str(monthly[m]["subtotal"]), "vat": str(monthly[m]["vat"]), "total": str(monthly[m]["total"])}
        for m in sorted(monthly.keys())
    ]

    # VAT breakdown
    vat_result = await db.execute(
        select(
            Invoice.vat_rate,
            func.sum(Invoice.subtotal).label("subtotal"),
            func.sum(Invoice.vat_amount).label("vat_amount"),
            func.sum(Invoice.total_amount).label("total"),
        )
        .where(Invoice.status.in_(status_filter), extract("year", Invoice.issue_date) == year)
        .group_by(Invoice.vat_rate)
    )
    vat_breakdown = [
        VatBreakdown(vat_rate=r.vat_rate, subtotal=r.subtotal or Decimal("0"), vat_amount=r.vat_amount or Decimal("0"), total=r.total or Decimal("0"))
        for r in vat_result.all()
    ]

    total_sub = sum(inv.subtotal for inv in invoices)
    total_vat = sum(inv.vat_amount for inv in invoices)
    total_amt = sum(inv.total_amount for inv in invoices)

    report = YearlyReport(
        year=year,
        monthly_breakdown=monthly_breakdown,
        vat_breakdown=vat_breakdown,
        total_subtotal=total_sub,
        total_vat=total_vat,
        total_amount=total_amt,
    )

    if format == "json":
        return report

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Month", "Subtotal", "VAT", "Total", "Count"])
        for m in monthly_breakdown:
            writer.writerow([m["label"], m["subtotal"], m["vat"], m["total"], m["count"]])
        output.seek(0)
        return StreamingResponse(
            io.BytesIO(output.getvalue().encode()),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="jaarrapport-{year}.csv"'},
        )

    if format == "pdf":
        settings_result = await db.execute(select(BusinessSettings).where(BusinessSettings.id == 1))
        settings = settings_result.scalar_one_or_none()
        if not settings:
            raise HTTPException(status_code=400, detail="Business settings not configured")
        settings_data = {
            "company_name": settings.company_name, "email": settings.email,
            "kvk_number": settings.kvk_number, "vat_number": settings.vat_number,
        }
        report_data = report.model_dump()
        pdf_bytes = generate_report_pdf(report_data, "yearly", settings_data)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f'attachment; filename="jaarrapport-{year}.pdf"'},
        )
