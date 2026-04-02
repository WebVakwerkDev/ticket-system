import uuid
import enum
from sqlalchemy import String, Text, Date, ForeignKey, Enum as SAEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
from app.database import Base, TimestampMixin, SoftDeleteMixin


class ProjectType(str, enum.Enum):
    NEW_WEBSITE = "NEW_WEBSITE"
    REDESIGN = "REDESIGN"
    MAINTENANCE = "MAINTENANCE"
    LANDING_PAGE = "LANDING_PAGE"
    PORTFOLIO = "PORTFOLIO"
    WEBSHOP = "WEBSHOP"
    OTHER = "OTHER"


class ProjectStatus(str, enum.Enum):
    LEAD = "LEAD"
    INTAKE = "INTAKE"
    IN_PROGRESS = "IN_PROGRESS"
    WAITING_FOR_CLIENT = "WAITING_FOR_CLIENT"
    REVIEW = "REVIEW"
    COMPLETED = "COMPLETED"
    MAINTENANCE = "MAINTENANCE"
    PAUSED = "PAUSED"


class Priority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"


class ProjectWorkspace(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "project_workspaces"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id: Mapped[str] = mapped_column(String(36), ForeignKey("clients.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    slug: Mapped[str] = mapped_column(String(300), unique=True, nullable=False, index=True)
    project_type: Mapped[str] = mapped_column(SAEnum(ProjectType, name="project_type", create_constraint=True, values_callable=lambda x: [e.value for e in x]), nullable=False)
    status: Mapped[str] = mapped_column(SAEnum(ProjectStatus, name="project_status", create_constraint=True, values_callable=lambda x: [e.value for e in x]), nullable=False, default=ProjectStatus.LEAD.value)
    priority: Mapped[str] = mapped_column(SAEnum(Priority, name="priority", create_constraint=True, values_callable=lambda x: [e.value for e in x]), nullable=False, default=Priority.MEDIUM.value)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    intake_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    scope: Mapped[str | None] = mapped_column(Text, nullable=True)
    tech_stack: Mapped[str | None] = mapped_column(Text, nullable=True)
    domain_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hosting_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    owner_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    tags: Mapped[list | None] = mapped_column(JSON, default=list)

    # Relationships
    client = relationship("Client", back_populates="projects")
    owner = relationship("User", back_populates="owned_projects", foreign_keys=[owner_user_id])
    communications = relationship("CommunicationEntry", back_populates="project", cascade="all, delete-orphan")
    change_requests = relationship("ChangeRequest", back_populates="project", cascade="all, delete-orphan")
    internal_notes = relationship("InternalNote", back_populates="project", cascade="all, delete-orphan")
    repositories = relationship("ProjectRepository", back_populates="project", cascade="all, delete-orphan")
    links = relationship("ProjectLink", back_populates="project", cascade="all, delete-orphan")
    agent_runs = relationship("AgentRun", back_populates="project", cascade="all, delete-orphan")
    invoices = relationship("Invoice", back_populates="project")
    proposals = relationship("ProposalDraft", back_populates="project")
