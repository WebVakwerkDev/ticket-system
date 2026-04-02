from pydantic import BaseModel
from datetime import date as DateType, datetime
from typing import Optional


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: Optional[str] = None
    deadline: Optional[DateType] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[str] = None
    status: Optional[str] = None
    deadline: Optional[DateType] = None


class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    project_id: Optional[str]
    assigned_to_user_id: Optional[str]
    status: str
    deadline: Optional[DateType]
    created_at: datetime
    updated_at: datetime
    project_name: Optional[str] = None

    model_config = {"from_attributes": True}
