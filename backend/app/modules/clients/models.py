import uuid
from sqlalchemy import String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base, TimestampMixin, SoftDeleteMixin


class Client(TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "clients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    contact_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    street: Mapped[str | None] = mapped_column(String(255), nullable=True)
    postal_code: Mapped[str | None] = mapped_column(String(10), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    invoice_details: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    projects = relationship("ProjectWorkspace", back_populates="client")
    invoices = relationship("Invoice", back_populates="client")
    proposals = relationship("ProposalDraft", back_populates="client")
