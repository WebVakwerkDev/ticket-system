# Re-export from module location for backwards compatibility.
# Will be removed once all imports are updated.
from app.modules.expenses.models import Expense

__all__ = ["Expense"]
