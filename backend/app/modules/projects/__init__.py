from app.modules.registry import ModuleManifest

manifest = ModuleManifest(
    name="projects",
    label="Projecten",
    depends_on=("clients",),
    permissions={
        "projects:read": {"ADMIN", "EMPLOYEE"},
        "projects:create": {"ADMIN", "EMPLOYEE"},
        "projects:update": {"ADMIN", "EMPLOYEE"},
        "projects:delete": {"ADMIN"},
        "communications:read": {"ADMIN", "EMPLOYEE"},
        "communications:create": {"ADMIN", "EMPLOYEE"},
        "communications:delete": {"ADMIN", "EMPLOYEE"},
        "notes:read": {"ADMIN", "EMPLOYEE"},
        "notes:create": {"ADMIN", "EMPLOYEE"},
        "notes:delete": {"ADMIN", "EMPLOYEE"},
        "change_requests:read": {"ADMIN", "EMPLOYEE"},
        "change_requests:create": {"ADMIN", "EMPLOYEE"},
        "change_requests:update": {"ADMIN", "EMPLOYEE"},
        "repositories:read": {"ADMIN", "EMPLOYEE"},
        "repositories:create": {"ADMIN", "EMPLOYEE"},
        "repositories:delete": {"ADMIN", "EMPLOYEE"},
        "links:read": {"ADMIN", "EMPLOYEE"},
        "links:create": {"ADMIN", "EMPLOYEE"},
        "links:delete": {"ADMIN", "EMPLOYEE"},
    },
)
