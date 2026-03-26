import uuid
import enum
from sqlalchemy import String, Text, Date, DateTime, ForeignKey, Enum as SAEnum, Numeric, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date, datetime
from decimal import Decimal
from app.database import Base, TimestampMixin


class InvoiceStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SENT = "SENT"
    PAID = "PAID"
    OVERDUE = "OVERDUE"


class Invoice(TimestampMixin, Base):
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    client_id: Mapped[str] = mapped_column(String(36), ForeignKey("clients.id"), nullable=False, index=True)
    project_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("project_workspaces.id"), nullable=True, index=True)
    invoice_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    service_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(SAEnum(InvoiceStatus, name="invoice_status", create_constraint=True, values_callable=lambda x: [e.value for e in x]), nullable=False, default=InvoiceStatus.DRAFT.value)
    subtotal: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    vat_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=Decimal("21.00"))
    vat_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    line_items: Mapped[list | None] = mapped_column(JSON, default=list)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    client = relationship("Client", back_populates="invoices")
    project = relationship("ProjectWorkspace", back_populates="invoices")
