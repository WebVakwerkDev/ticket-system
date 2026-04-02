from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from decimal import Decimal
from app.modules.proposals.models import ProposalStatus


class ProposalCreate(BaseModel):
    client_id: str
    project_id: str | None = None
    title: str
    recipient_name: str
    recipient_email: EmailStr
    recipient_company: str | None = None
    recipient_address: str | None = None
    summary: str | None = None
    scope: str | None = None
    price_label: str = "Projectprijs"
    amount: Decimal
    delivery_time: str | None = None
    notes: str | None = None

    @field_validator("title")
    @classmethod
    def title_min(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Title must be at least 2 characters")
        return v.strip()

    @field_validator("amount")
    @classmethod
    def amount_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v


class ProposalUpdate(BaseModel):
    title: str | None = None
    recipient_name: str | None = None
    recipient_email: EmailStr | None = None
    recipient_company: str | None = None
    recipient_address: str | None = None
    summary: str | None = None
    scope: str | None = None
    price_label: str | None = None
    amount: Decimal | None = None
    delivery_time: str | None = None
    notes: str | None = None
    status: ProposalStatus | None = None


class ProposalResponse(BaseModel):
    id: str
    client_id: str
    project_id: str | None
    title: str
    recipient_name: str
    recipient_email: str
    recipient_company: str | None
    recipient_address: str | None
    summary: str | None
    scope: str | None
    price_label: str
    amount: Decimal
    delivery_time: str | None
    notes: str | None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
