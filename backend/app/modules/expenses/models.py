import uuid
from datetime import date as date_type
from decimal import Decimal
from sqlalchemy import String, Date, Numeric, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base, TimestampMixin


class Expense(TimestampMixin, Base):
    __tablename__ = "expenses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    description: Mapped[str] = mapped_column(String(500), nullable=False)
    invoice_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    amount_incl_vat: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    vat_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    amount_excl_vat: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    vat_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    date: Mapped[date_type] = mapped_column(Date, nullable=False, index=True)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True)
