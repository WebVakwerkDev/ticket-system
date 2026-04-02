from pydantic import BaseModel
from decimal import Decimal


class VatBreakdown(BaseModel):
    vat_rate: Decimal
    subtotal: Decimal
    vat_amount: Decimal
    total: Decimal


class QuarterVatSummary(BaseModel):
    received_vat: Decimal
    paid_vat: Decimal
    vat_due: Decimal
    breakdown: list[VatBreakdown]


class FinanceOverview(BaseModel):
    total_revenue: Decimal
    open_amount: Decimal
    overdue_amount: Decimal
    total_expenses: Decimal
    profit: Decimal
    vat_by_quarter: dict[str, QuarterVatSummary]


class MonthlyReport(BaseModel):
    year: int
    month: int
    month_label: str
    invoices: list[dict]
    vat_breakdown: list[VatBreakdown]
    total_subtotal: Decimal
    total_vat: Decimal
    total_amount: Decimal


class YearlyReport(BaseModel):
    year: int
    monthly_breakdown: list[dict]
    vat_breakdown: list[VatBreakdown]
    total_subtotal: Decimal
    total_vat: Decimal
    total_amount: Decimal


# Tax year settings
class TaxYearSettingsResponse(BaseModel):
    year: int
    kor_enabled: bool
    zelfstandigenaftrek_enabled: bool
    zelfstandigenaftrek: Decimal
    startersaftrek_enabled: bool
    startersaftrek: Decimal
    mkb_vrijstelling_rate: Decimal
    zvw_rate: Decimal
    zvw_max_inkomen: Decimal
    ib_rate_1: Decimal
    ib_rate_2: Decimal
    ib_rate_3: Decimal
    ib_bracket_1: Decimal
    ib_bracket_2: Decimal

    model_config = {"from_attributes": True}


class TaxYearSettingsUpdate(BaseModel):
    kor_enabled: bool | None = None
    zelfstandigenaftrek_enabled: bool | None = None
    zelfstandigenaftrek: Decimal | None = None
    startersaftrek_enabled: bool | None = None
    startersaftrek: Decimal | None = None
    mkb_vrijstelling_rate: Decimal | None = None
    zvw_rate: Decimal | None = None
    zvw_max_inkomen: Decimal | None = None
    ib_rate_1: Decimal | None = None
    ib_rate_2: Decimal | None = None
    ib_rate_3: Decimal | None = None
    ib_bracket_1: Decimal | None = None
    ib_bracket_2: Decimal | None = None


class KostenCategorie(BaseModel):
    categorie: str
    bedrag: Decimal
    aantal: int


# IB calculation per schijf
class IBSchijf(BaseModel):
    label: str
    rate: Decimal
    inkomen_in_schijf: Decimal
    belasting: Decimal


# Tax summary response
class TaxSummary(BaseModel):
    year: int
    # KOR
    kor_enabled: bool
    # W&V
    omzet: Decimal
    kosten: Decimal
    brutowinst: Decimal
    zelfstandigenaftrek_enabled: bool
    zelfstandigenaftrek: Decimal
    startersaftrek_enabled: bool
    startersaftrek: Decimal
    winst_na_aftrek: Decimal
    mkb_vrijstelling_rate: Decimal
    mkb_vrijstelling: Decimal
    belastbare_winst: Decimal
    # IB
    ib_schijven: list[IBSchijf]
    ib_totaal: Decimal
    # Zvw
    zvw_rate: Decimal
    zvw_grondslag: Decimal
    zvw_premie: Decimal
    # Reservering
    totaal_te_reserveren: Decimal
    # Settings used
    settings: TaxYearSettingsResponse
    kosten_per_categorie: list[KostenCategorie] = []
