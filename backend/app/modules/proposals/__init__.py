from app.modules.registry import ModuleManifest

manifest = ModuleManifest(
    name="proposals",
    label="Offertes",
    depends_on=("clients",),
    permissions={
        "proposals:read": {"ADMIN", "EMPLOYEE"},
        "proposals:create": {"ADMIN", "EMPLOYEE"},
        "proposals:update": {"ADMIN", "EMPLOYEE"},
        "proposals:delete": {"ADMIN", "EMPLOYEE"},
    },
)
