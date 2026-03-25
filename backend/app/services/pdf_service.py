import io
from datetime import datetime
from decimal import Decimal
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML
from pathlib import Path
import structlog

logger = structlog.get_logger()

TEMPLATE_DIR = Path(__file__).parent.parent / "templates"

_env = Environment(
    loader=FileSystemLoader(str(TEMPLATE_DIR)),
    autoescape=select_autoescape(["html"]),
)


def _format_currency(value: Decimal | float) -> str:
    return f"\u20ac {float(value):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def _format_date(value) -> str:
    if isinstance(value, str):
        return value
    if hasattr(value, "strftime"):
        return value.strftime("%d-%m-%Y")
    return str(value)


def _format_currency_plain(value: Decimal | float) -> str:
    """Format as '1.500,00' (no € sign, Dutch notation)."""
    return f"{float(value):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


_env.filters["currency"] = _format_currency
_env.filters["currency_plain"] = _format_currency_plain
_env.filters["date_nl"] = _format_date


def generate_invoice_pdf(
    invoice: dict,
    client: dict,
    settings: dict,
) -> bytes:
    template = _env.get_template("invoice.html")
    html_content = template.render(
        invoice=invoice,
        client=client,
        settings=settings,
        generated_at=datetime.now().strftime("%d-%m-%Y %H:%M"),
    )
    pdf_bytes = HTML(string=html_content).write_pdf()
    logger.info("invoice_pdf_generated", invoice_number=invoice.get("invoice_number"))
    return pdf_bytes


def generate_proposal_pdf(
    proposal: dict,
    client: dict,
    settings: dict,
) -> bytes:
    template = _env.get_template("proposal.html")
    html_content = template.render(
        proposal=proposal,
        client=client,
        settings=settings,
        generated_at=datetime.now().strftime("%d-%m-%Y %H:%M"),
    )
    pdf_bytes = HTML(string=html_content).write_pdf()
    logger.info("proposal_pdf_generated", proposal_id=proposal.get("id"))
    return pdf_bytes


def generate_report_pdf(
    report_data: dict,
    report_type: str,
    settings: dict,
) -> bytes:
    template = _env.get_template("report.html")
    html_content = template.render(
        report=report_data,
        report_type=report_type,
        settings=settings,
        generated_at=datetime.now().strftime("%d-%m-%Y %H:%M"),
    )
    pdf_bytes = HTML(string=html_content).write_pdf()
    logger.info("report_pdf_generated", report_type=report_type)
    return pdf_bytes
