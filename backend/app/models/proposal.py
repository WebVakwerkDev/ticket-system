# Re-export from module location for backwards compatibility.
# Will be removed once all imports are updated.
from app.modules.proposals.models import ProposalDraft, ProposalStatus

__all__ = ["ProposalDraft", "ProposalStatus"]
