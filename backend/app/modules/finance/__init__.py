from app.modules.registry import ModuleManifest

manifest = ModuleManifest(
    name="finance",
    label="Financiën",
    depends_on=("invoices", "expenses"),
    permissions={
        "finance:read": {"ADMIN", "FINANCE"},
        "finance:tax_settings": {"ADMIN", "FINANCE"},
        "finance:reports": {"ADMIN", "FINANCE"},
    },
)
