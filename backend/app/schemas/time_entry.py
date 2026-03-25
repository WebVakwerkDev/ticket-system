from pydantic import BaseModel, field_validator
from decimal import Decimal
from datetime import date as DateType, datetime
from typing import Optional


class TimeEntryCreate(BaseModel):
    project_id: str
    date: DateType
    hours: Decimal
    description: Optional[str] = None

    @field_validator("hours")
    @classmethod
    def validate_hours(cls, v: Decimal) -> Decimal:
        if v <= 0 or v > 24:
            raise ValueError("Hours must be between 0 and 24")
        return v


class TimeEntryUpdate(BaseModel):
    project_id: Optional[str] = None
    date: Optional[DateType] = None
    hours: Optional[Decimal] = None
    description: Optional[str] = None

    @field_validator("hours")
    @classmethod
    def validate_hours(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is not None and (v <= 0 or v > 24):
            raise ValueError("Hours must be between 0 and 24")
        return v


class TimeEntryResponse(BaseModel):
    id: str
    user_id: str
    project_id: str
    date: DateType
    hours: Decimal
    description: Optional[str]
    created_at: datetime
    updated_at: datetime
    project_name: Optional[str] = None

    model_config = {"from_attributes": True}


class TimeEntrySummary(BaseModel):
    year: int
    total_hours: Decimal
    monthly: list[dict]
    by_project: list[dict]
