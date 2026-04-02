import uuid
import enum
from datetime import date as date_type
from sqlalchemy import String, Date, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base, TimestampMixin


class TaskStatus(str, enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    DONE = "DONE"


class Task(TimestampMixin, Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    project_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("project_workspaces.id"), nullable=True, index=True)
    assigned_to_user_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum(TaskStatus, name="task_status", create_constraint=True, values_callable=lambda x: [e.value for e in x]),
        nullable=False, default=TaskStatus.TODO.value,
    )
    deadline: Mapped[date_type | None] = mapped_column(Date, nullable=True, index=True)

    # Relationships
    project = relationship("ProjectWorkspace", backref="module_tasks")
    assigned_to = relationship("User", backref="module_tasks")
