from pydantic import BaseModel, EmailStr, field_validator
from decimal import Decimal
import re


def _iban_mod97(iban: str) -> bool:
    """ISO 7064 Mod 97-10 check for IBAN."""
    rearranged = iban[4:] + iban[:4]
    numeric = "".join(str(ord(c) - 55) if c.isalpha() else c for c in rearranged)
    return int(numeric) % 97 == 1


class BusinessSettingsUpdate(BaseModel):
    company_name: str
    street: str | None = None
    postal_code: str | None = None
    city: str | None = None
    kvk_number: str | None = None
    vat_number: str | None = None
    iban: str | None = None
    account_holder_name: str | None = None
    email: EmailStr
    phone: str | None = None
    logo_url: str | None = None
    website_url: str | None = None
    default_vat_rate: Decimal = Decimal("21.00")
    payment_term_days: int = 30
    default_quote_valid_days: int = 30
    default_price_label: str = "Projectprijs"
    quote_footer_text: str | None = None
    invoice_footer_text: str | None = None
    default_terms_text: str | None = None

    @field_validator("kvk_number")
    @classmethod
    def validate_kvk(cls, v: str | None) -> str | None:
        if v and not re.fullmatch(r"\d{8}", v):
            raise ValueError("KVK-nummer moet exact 8 cijfers zijn")
        return v

    @field_validator("vat_number")
    @classmethod
    def validate_vat_number(cls, v: str | None) -> str | None:
        if v:
            normalised = v.replace(".", "").replace(" ", "").upper()
            if not re.fullmatch(r"NL\d{9}B\d{2}", normalised):
                raise ValueError("BTW-nummer moet de opmaak NL999999999B99 hebben")
            return normalised
        return v

    @field_validator("iban")
    @classmethod
    def validate_iban(cls, v: str | None) -> str | None:
        if v:
            normalised = v.replace(" ", "").upper()
            if not re.fullmatch(r"[A-Z]{2}\d{2}[A-Z0-9]{4,30}", normalised):
                raise ValueError("Ongeldig IBAN-formaat")
            if not _iban_mod97(normalised):
                raise ValueError("IBAN-controlegetal klopt niet")
            return normalised
        return v

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v:
            stripped = re.sub(r"[\s\-()]", "", v)
            if not re.fullmatch(r"(\+31[1-9]\d{6,9}|0[1-9]\d{8,9})", stripped):
                raise ValueError("Voer een geldig Nederlands telefoonnummer in (bijv. 0612345678 of +31612345678)")
        return v

    @field_validator("payment_term_days", "default_quote_valid_days")
    @classmethod
    def validate_days(cls, v: int) -> int:
        if v < 1 or v > 365:
            raise ValueError("Moet tussen 1 en 365 liggen")
        return v

    @field_validator("default_vat_rate")
    @classmethod
    def validate_vat(cls, v: Decimal) -> Decimal:
        if v < 0 or v > 100:
            raise ValueError("BTW-tarief moet tussen 0 en 100 liggen")
        return v


class BusinessSettingsResponse(BaseModel):
    id: int
    company_name: str
    street: str | None
    postal_code: str | None
    city: str | None
    kvk_number: str | None
    vat_number: str | None
    iban: str | None
    account_holder_name: str | None
    email: str
    phone: str | None
    logo_url: str | None
    website_url: str | None
    default_vat_rate: Decimal
    payment_term_days: int
    default_quote_valid_days: int
    default_price_label: str
    quote_footer_text: str | None
    invoice_footer_text: str | None
    default_terms_text: str | None

    model_config = {"from_attributes": True}
