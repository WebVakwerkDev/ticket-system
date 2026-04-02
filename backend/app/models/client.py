# Re-export from module location for backwards compatibility.
# Will be removed once all imports are updated.
from app.modules.clients.models import Client

__all__ = ["Client"]
