from app.modules.registry import ModuleManifest

manifest = ModuleManifest(
    name="export",
    label="Export",
    depends_on=(),
    permissions={
        "export:database": {"ADMIN"},
    },
)
