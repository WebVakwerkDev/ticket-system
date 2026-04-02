import uuid
from decimal import Decimal
from sqlalchemy import String, Integer, Boolean, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base, TimestampMixin


class TaxYearSettings(TimestampMixin, Base):
    __tablename__ = "tax_year_settings"
    __table_args__ = (UniqueConstraint("year", name="uq_tax_year_settings_year"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    year: Mapped[int] = mapped_column(Integer, nullable=False, index=True)

    # KOR
    kor_enabled: Mapped[bool] = mapped_column(Boolean, default=False)

    # Aftrekposten
    zelfstandigenaftrek_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    zelfstandigenaftrek: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("1200.00"))
    startersaftrek_enabled: Mapped[bool] = mapped_column(Boolean, default=False)
    startersaftrek: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("2123.00"))
    mkb_vrijstelling_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("12.70"))

    # Zvw
    zvw_rate: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("5.32"))
    zvw_max_inkomen: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("71628.00"))

    # Inkomstenbelasting schijven
    ib_rate_1: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("35.75"))
    ib_rate_2: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("37.56"))
    ib_rate_3: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("49.50"))
    ib_bracket_1: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("38441.00"))
    ib_bracket_2: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("76817.00"))
