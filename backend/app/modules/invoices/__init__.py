from app.modules.registry import ModuleManifest

manifest = ModuleManifest(
    name="invoices",
    label="Facturen",
    depends_on=("clients",),
    permissions={
        "invoices:read": {"ADMIN", "FINANCE"},
        "invoices:create": {"ADMIN", "FINANCE"},
        "invoices:update": {"ADMIN", "FINANCE"},
        "invoices:delete": {"ADMIN", "FINANCE"},
    },
)
