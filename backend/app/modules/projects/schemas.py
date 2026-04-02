from pydantic import BaseModel, field_validator
from datetime import date, datetime
from app.modules.projects.models import ProjectType, ProjectStatus, Priority


class ProjectCreate(BaseModel):
    client_id: str
    name: str
    project_type: ProjectType
    status: ProjectStatus = ProjectStatus.LEAD
    priority: Priority = Priority.MEDIUM
    description: str | None = None
    intake_summary: str | None = None
    scope: str | None = None
    tech_stack: str | None = None
    domain_name: str | None = None
    hosting_info: str | None = None
    start_date: date | None = None
    owner_user_id: str | None = None
    tags: list[str] = []

    @field_validator("name")
    @classmethod
    def name_min_length(cls, v: str) -> str:
        if len(v.strip()) < 2:
            raise ValueError("Name must be at least 2 characters")
        return v.strip()


class ProjectUpdate(BaseModel):
    name: str | None = None
    project_type: ProjectType | None = None
    status: ProjectStatus | None = None
    priority: Priority | None = None
    description: str | None = None
    intake_summary: str | None = None
    scope: str | None = None
    tech_stack: str | None = None
    domain_name: str | None = None
    hosting_info: str | None = None
    start_date: date | None = None
    owner_user_id: str | None = None
    tags: list[str] | None = None


class ProjectResponse(BaseModel):
    id: str
    client_id: str
    name: str
    slug: str
    project_type: str
    status: str
    priority: str
    description: str | None
    intake_summary: str | None
    scope: str | None
    tech_stack: str | None
    domain_name: str | None
    hosting_info: str | None
    start_date: date | None
    owner_user_id: str | None
    tags: list[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProjectDetailResponse(ProjectResponse):
    client: dict | None = None
    owner: dict | None = None
    communications: list = []
    change_requests: list = []
    repositories: list = []
    links: list = []


class ProjectFilterParams(BaseModel):
    status: ProjectStatus | None = None
    client_id: str | None = None
    priority: Priority | None = None
