from pydantic import BaseModel, field_validator, model_validator
from datetime import date, datetime
from decimal import Decimal
from typing import Self
from app.modules.invoices.models import InvoiceStatus


class InvoiceLineItem(BaseModel):
    description: str
    quantity: Decimal
    unit_price: Decimal
    total: Decimal


class InvoiceCreate(BaseModel):
    client_id: str
    project_id: str | None = None
    issue_date: date
    service_date: date | None = None
    due_date: date
    subtotal: Decimal = Decimal("0")
    vat_rate: Decimal = Decimal("21.00")
    description: str | None = None
    notes: str | None = None
    line_items: list[InvoiceLineItem] = []

    @field_validator("vat_rate")
    @classmethod
    def vat_range(cls, v: Decimal) -> Decimal:
        if v < 0 or v > 100:
            raise ValueError("VAT rate must be between 0 and 100")
        return v

    @model_validator(mode="after")
    def require_description_or_line_items(self) -> Self:
        has_description = bool(self.description and self.description.strip())
        has_line_items = len(self.line_items) > 0
        if not has_description and not has_line_items:
            raise ValueError("Geef een omschrijving of minimaal één regelitem op")
        return self


class InvoiceUpdate(BaseModel):
    issue_date: date | None = None
    service_date: date | None = None
    due_date: date | None = None
    vat_rate: Decimal | None = None
    description: str | None = None
    notes: str | None = None
    status: InvoiceStatus | None = None
    line_items: list[InvoiceLineItem] | None = None


class InvoiceResponse(BaseModel):
    id: str
    client_id: str
    project_id: str | None
    invoice_number: str
    issue_date: date
    service_date: date | None
    due_date: date
    status: str
    subtotal: Decimal
    vat_rate: Decimal
    vat_amount: Decimal
    total_amount: Decimal
    description: str | None
    notes: str | None
    line_items: list[InvoiceLineItem]
    paid_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InvoiceFilterParams(BaseModel):
    client_id: str | None = None
    project_id: str | None = None
    status: InvoiceStatus | None = None
