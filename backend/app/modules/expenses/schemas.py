from pydantic import BaseModel, field_validator
from decimal import Decimal
from datetime import date as DateType, datetime
from typing import Optional, Literal

EXPENSE_CATEGORIES: list[str] = [
    "Software", "Hardware", "Telefoon", "Reizen", "Marketing",
    "Kantoor", "Abonnementen", "Overig"
]

ExpenseCategory = Literal[
    "Software", "Hardware", "Telefoon", "Reizen", "Marketing",
    "Kantoor", "Abonnementen", "Overig"
]


class ExpenseCreate(BaseModel):
    description: str
    invoice_number: Optional[str] = None
    amount_incl_vat: Decimal
    vat_rate: Decimal = Decimal("21")
    date: DateType
    category: Optional[ExpenseCategory] = "Overig"

    @field_validator("amount_incl_vat")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v

    @field_validator("vat_rate")
    @classmethod
    def validate_vat_rate(cls, v: Decimal) -> Decimal:
        if v not in (Decimal("0"), Decimal("9"), Decimal("21")):
            raise ValueError("VAT rate must be 0, 9, or 21")
        return v


class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    invoice_number: Optional[str] = None
    amount_incl_vat: Optional[Decimal] = None
    vat_rate: Optional[Decimal] = None
    date: Optional[DateType] = None
    category: Optional[ExpenseCategory] = None

    @field_validator("amount_incl_vat")
    @classmethod
    def validate_amount(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v <= 0:
            raise ValueError("Amount must be positive")
        return v

    @field_validator("vat_rate")
    @classmethod
    def validate_vat_rate(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and v not in (Decimal("0"), Decimal("9"), Decimal("21")):
            raise ValueError("VAT rate must be 0, 9, or 21")
        return v


class ExpenseResponse(BaseModel):
    id: str
    description: str
    invoice_number: Optional[str]
    amount_incl_vat: Decimal
    vat_rate: Decimal
    amount_excl_vat: Decimal
    vat_amount: Decimal
    date: DateType
    category: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
