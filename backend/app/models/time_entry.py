# Re-export from module location for backwards compatibility.
# Will be removed once all imports are updated.
from app.modules.time_entries.models import TimeEntry

__all__ = ["TimeEntry"]
