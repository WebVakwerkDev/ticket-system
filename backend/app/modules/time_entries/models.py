import uuid
from datetime import date as date_type
from decimal import Decimal
from sqlalchemy import String, Date, Numeric, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base, TimestampMixin


class TimeEntry(TimestampMixin, Base):
    __tablename__ = "time_entries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    project_id: Mapped[str] = mapped_column(String(36), ForeignKey("project_workspaces.id"), nullable=False, index=True)
    date: Mapped[date_type] = mapped_column(Date, nullable=False, index=True)
    hours: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    user = relationship("User", backref="time_entries")
    project = relationship("ProjectWorkspace", backref="time_entries")
