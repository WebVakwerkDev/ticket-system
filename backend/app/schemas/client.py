# Re-export from module location for backwards compatibility.
# Will be removed once all imports are updated.
from app.modules.clients.schemas import ClientCreate, ClientUpdate, ClientResponse, ClientDetailResponse

__all__ = ["ClientCreate", "ClientUpdate", "ClientResponse", "ClientDetailResponse"]
