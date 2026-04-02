# Re-export from module location for backwards compatibility.
# Will be removed once all imports are updated.
from app.modules.tasks.schemas import TaskCreate, TaskUpdate, TaskResponse

__all__ = ["TaskCreate", "TaskUpdate", "TaskResponse"]
