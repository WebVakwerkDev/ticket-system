import uuid
import enum
from sqlalchemy import String, Text, ForeignKey, Enum as SAEnum, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship
from decimal import Decimal
from app.database import Base, TimestampMixin


class ProposalStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    READY = "READY"
    SENT = "SENT"


class ProposalDraft(TimestampMixin, Base):
    __tablename__ = "proposal_drafts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id: Mapped[str] = mapped_column(String(36), ForeignKey("clients.id"), nullable=False, index=True)
    project_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("project_workspaces.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    recipient_name: Mapped[str] = mapped_column(String(255), nullable=False)
    recipient_email: Mapped[str] = mapped_column(String(255), nullable=False)
    recipient_company: Mapped[str | None] = mapped_column(String(255), nullable=True)
    recipient_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    scope: Mapped[str | None] = mapped_column(Text, nullable=True)
    price_label: Mapped[str] = mapped_column(String(100), nullable=False, default="Projectprijs")
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    delivery_time: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(SAEnum(ProposalStatus, name="proposal_status", create_constraint=True, values_callable=lambda x: [e.value for e in x]), nullable=False, default=ProposalStatus.DRAFT.value)

    # Relationships
    client = relationship("Client", back_populates="proposals")
    project = relationship("ProjectWorkspace", back_populates="proposals")
