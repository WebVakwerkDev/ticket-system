from pydantic import BaseModel, EmailStr, field_validator
from decimal import Decimal
import re


class BusinessSettingsUpdate(BaseModel):
    company_name: str
    address: str | None = None
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
        if v and not re.match(r"^\d{8}$", v):
            raise ValueError("KVK number must be 8 digits")
        return v

    @field_validator("payment_term_days", "default_quote_valid_days")
    @classmethod
    def validate_days(cls, v: int) -> int:
        if v < 1 or v > 365:
            raise ValueError("Must be between 1 and 365")
        return v

    @field_validator("default_vat_rate")
    @classmethod
    def validate_vat(cls, v: Decimal) -> Decimal:
        if v < 0 or v > 100:
            raise ValueError("VAT rate must be between 0 and 100")
        return v


class BusinessSettingsResponse(BaseModel):
    id: int
    company_name: str
    address: str | None
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
