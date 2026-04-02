from app.modules.registry import ModuleManifest

manifest = ModuleManifest(
    name="clients",
    label="Klanten",
    depends_on=(),
    permissions={
        "clients:read": {"ADMIN", "EMPLOYEE", "FINANCE"},
        "clients:create": {"ADMIN", "EMPLOYEE"},
        "clients:update": {"ADMIN", "EMPLOYEE"},
        "clients:delete": {"ADMIN"},
    },
)
