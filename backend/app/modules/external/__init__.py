from app.modules.registry import ModuleManifest

manifest = ModuleManifest(
    name="external",
    label="Extern",
    depends_on=("clients", "projects"),
    permissions={
        "external:create_ticket": {"ADMIN"},
        "external:view_ticket": {"ADMIN"},
    },
)
