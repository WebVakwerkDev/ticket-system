from sqlalchemy import String, Text, Integer, Numeric
from sqlalchemy.orm import Mapped, mapped_column
from decimal import Decimal
from app.database import Base, TimestampMixin


class BusinessSettings(TimestampMixin, Base):
    __tablename__ = "business_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    kvk_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    vat_number: Mapped[str | None] = mapped_column(String(20), nullable=True)
    iban: Mapped[str | None] = mapped_column(String(34), nullable=True)
    account_holder_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    website_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    default_vat_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=Decimal("21.00"))
    payment_term_days: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    default_quote_valid_days: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    default_price_label: Mapped[str] = mapped_column(String(100), nullable=False, default="Projectprijs")
    quote_footer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    invoice_footer_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    default_terms_text: Mapped[str | None] = mapped_column(Text, nullable=True)
