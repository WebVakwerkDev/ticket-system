# Re-export from module location for backwards compatibility.
# Will be removed once all imports are updated.
from app.modules.invoices.models import Invoice, InvoiceStatus

__all__ = ["Invoice", "InvoiceStatus"]
