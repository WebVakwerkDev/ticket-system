from app.modules.registry import ModuleManifest

manifest = ModuleManifest(
    name="time_entries",
    label="Uren",
    depends_on=("projects",),
    permissions={
        "time_entries:read": {"ADMIN", "EMPLOYEE"},
        "time_entries:create": {"ADMIN", "EMPLOYEE"},
        "time_entries:update": {"ADMIN", "EMPLOYEE"},
        "time_entries:delete": {"ADMIN", "EMPLOYEE"},
    },
)
