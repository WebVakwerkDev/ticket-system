from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from decimal import Decimal
from datetime import date

from app.database import get_db
from app.core.dependencies import get_current_user
from app.modules.expenses.models import Expense
from app.modules.expenses.schemas import ExpenseCreate, ExpenseUpdate, ExpenseResponse

router = APIRouter(prefix="/api/v1/expenses", tags=["expenses"])


def _calculate_vat(amount_incl: Decimal, vat_rate: Decimal) -> tuple[Decimal, Decimal]:
    """Calculate excl VAT amount and VAT amount from incl price."""
    if vat_rate == 0:
        return amount_incl, Decimal("0.00")
    amount_excl = (amount_incl / (1 + vat_rate / Decimal("100"))).quantize(Decimal("0.01"))
    vat_amount = (amount_incl - amount_excl).quantize(Decimal("0.01"))
    return amount_excl, vat_amount


@router.get("", response_model=list[ExpenseResponse])
async def list_expenses(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    year: int | None = Query(None),
    quarter: int | None = Query(None),
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Expense).order_by(Expense.date.desc())

    if year and quarter:
        from sqlalchemy import extract
        start_month = (quarter - 1) * 3 + 1
        end_month = start_month + 2
        query = query.where(
            extract("year", Expense.date) == year,
            extract("month", Expense.date) >= start_month,
            extract("month", Expense.date) <= end_month,
        )
    elif start_date:
        query = query.where(Expense.date >= start_date)
        if end_date:
            query = query.where(Expense.date <= end_date)

    result = await db.execute(query)
    return [ExpenseResponse.model_validate(e) for e in result.scalars().all()]


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    data: ExpenseCreate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    amount_excl, vat_amount = _calculate_vat(data.amount_incl_vat, data.vat_rate)

    expense = Expense(
        description=data.description,
        invoice_number=data.invoice_number,
        amount_incl_vat=data.amount_incl_vat,
        vat_rate=data.vat_rate,
        amount_excl_vat=amount_excl,
        vat_amount=vat_amount,
        date=data.date,
        category=data.category,
    )
    db.add(expense)
    await db.flush()
    await db.refresh(expense)
    return ExpenseResponse.model_validate(expense)


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    expense_id: str,
    data: ExpenseUpdate,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(expense, key, value)

    # Recalculate VAT if amount or rate changed
    if "amount_incl_vat" in update_data or "vat_rate" in update_data:
        amount_excl, vat_amount = _calculate_vat(expense.amount_incl_vat, expense.vat_rate)
        expense.amount_excl_vat = amount_excl
        expense.vat_amount = vat_amount

    await db.flush()
    await db.refresh(expense)
    return ExpenseResponse.model_validate(expense)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    expense_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Expense).where(Expense.id == expense_id))
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    await db.delete(expense)
