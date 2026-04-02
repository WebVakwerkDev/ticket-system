from app.modules.registry import ModuleManifest

manifest = ModuleManifest(
    name="expenses",
    label="Uitgaven",
    depends_on=(),
    permissions={
        "expenses:read": {"ADMIN", "FINANCE"},
        "expenses:create": {"ADMIN", "FINANCE"},
        "expenses:update": {"ADMIN", "FINANCE"},
        "expenses:delete": {"ADMIN", "FINANCE"},
    },
)
