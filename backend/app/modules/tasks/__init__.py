from app.modules.registry import ModuleManifest

manifest = ModuleManifest(
    name="tasks",
    label="Taken",
    depends_on=(),
    permissions={
        "tasks:read": {"ADMIN", "EMPLOYEE"},
        "tasks:create": {"ADMIN", "EMPLOYEE"},
        "tasks:update": {"ADMIN", "EMPLOYEE"},
        "tasks:delete": {"ADMIN", "EMPLOYEE"},
    },
)
