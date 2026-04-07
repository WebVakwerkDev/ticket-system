from decimal import Decimal
from app.schemas.finance import TaxYearSettingsResponse, TaxSummary, IBSchijf, KostenCategorie


def _nl_currency(v: Decimal) -> str:
    """Format a Decimal as a Dutch integer currency string, e.g. 38.441."""
    return f"{int(v):,}".replace(",", ".")


class TaxCalculator:
    """Calculates Dutch freelancer tax (IB + ZVW) from revenue, costs, and year settings."""

    def __init__(self, settings: TaxYearSettingsResponse):
        self.s = settings

    def calculate(
        self,
        omzet: Decimal,
        kosten: Decimal,
        kosten_per_categorie: list[KostenCategorie],
    ) -> TaxSummary:
        s = self.s
        brutowinst = omzet - kosten

        # Aftrekposten
        zelfstandigenaftrek = s.zelfstandigenaftrek
        startersaftrek = s.startersaftrek if s.startersaftrek_enabled else Decimal("0")
        winst_na_aftrek = max(brutowinst - zelfstandigenaftrek - startersaftrek, Decimal("0"))

        # MKB-winstvrijstelling
        mkb_vrijstelling = (winst_na_aftrek * s.mkb_vrijstelling_rate / Decimal("100")).quantize(Decimal("0.01"))
        belastbare_winst = max(winst_na_aftrek - mkb_vrijstelling, Decimal("0"))

        # Inkomstenbelasting per schijf
        ib_schijven, ib_totaal = self._calculate_ib(belastbare_winst)

        # Zvw-premie
        zvw_grondslag = min(belastbare_winst, s.zvw_max_inkomen)
        zvw_premie = (zvw_grondslag * s.zvw_rate / Decimal("100")).quantize(Decimal("0.01"))

        totaal_te_reserveren = ib_totaal + zvw_premie

        return TaxSummary(
            year=s.year,
            omzet=omzet,
            kosten=kosten,
            brutowinst=brutowinst,
            zelfstandigenaftrek=zelfstandigenaftrek,
            startersaftrek_enabled=s.startersaftrek_enabled,
            startersaftrek=startersaftrek,
            winst_na_aftrek=winst_na_aftrek,
            mkb_vrijstelling_rate=s.mkb_vrijstelling_rate,
            mkb_vrijstelling=mkb_vrijstelling,
            belastbare_winst=belastbare_winst,
            ib_schijven=ib_schijven,
            ib_totaal=ib_totaal,
            zvw_rate=s.zvw_rate,
            zvw_grondslag=zvw_grondslag,
            zvw_premie=zvw_premie,
            totaal_te_reserveren=totaal_te_reserveren,
            settings=s,
            kosten_per_categorie=kosten_per_categorie,
        )

    def _calculate_ib(self, belastbare_winst: Decimal) -> tuple[list[IBSchijf], Decimal]:
        s = self.s
        schijven: list[IBSchijf] = []
        resterend = belastbare_winst

        # Schijf 1
        in_schijf_1 = min(resterend, s.ib_bracket_1)
        ib_1 = (in_schijf_1 * s.ib_rate_1 / Decimal("100")).quantize(Decimal("0.01"))
        schijven.append(IBSchijf(
            label=f"Schijf 1 (t/m \u20ac{_nl_currency(s.ib_bracket_1)})",
            rate=s.ib_rate_1, inkomen_in_schijf=in_schijf_1, belasting=ib_1,
        ))
        resterend = max(resterend - s.ib_bracket_1, Decimal("0"))

        # Schijf 2
        in_schijf_2 = min(resterend, s.ib_bracket_2 - s.ib_bracket_1)
        ib_2 = (in_schijf_2 * s.ib_rate_2 / Decimal("100")).quantize(Decimal("0.01"))
        schijven.append(IBSchijf(
            label=f"Schijf 2 (\u20ac{_nl_currency(s.ib_bracket_1)} \u2013 \u20ac{_nl_currency(s.ib_bracket_2)})",
            rate=s.ib_rate_2, inkomen_in_schijf=in_schijf_2, belasting=ib_2,
        ))
        resterend = max(resterend - (s.ib_bracket_2 - s.ib_bracket_1), Decimal("0"))

        # Schijf 3
        in_schijf_3 = resterend
        ib_3 = (in_schijf_3 * s.ib_rate_3 / Decimal("100")).quantize(Decimal("0.01"))
        schijven.append(IBSchijf(
            label=f"Schijf 3 (boven \u20ac{_nl_currency(s.ib_bracket_2)})",
            rate=s.ib_rate_3, inkomen_in_schijf=in_schijf_3, belasting=ib_3,
        ))

        ib_totaal = ib_1 + ib_2 + ib_3
        return schijven, ib_totaal
