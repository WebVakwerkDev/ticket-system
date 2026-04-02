import enum
from typing import Sequence
from fastapi import HTTPException, status


class Role(str, enum.Enum):
    ADMIN = "ADMIN"
    EMPLOYEE = "EMPLOYEE"
    FINANCE = "FINANCE"


# Permission map: which roles can access which resource actions
ROLE_PERMISSIONS: dict[str, set[Role]] = {
    # Users
    "users:read": {Role.ADMIN},
    "users:create": {Role.ADMIN},
    "users:update": {Role.ADMIN},
    "users:delete": {Role.ADMIN},
    # Clients
    "clients:read": {Role.ADMIN, Role.EMPLOYEE, Role.FINANCE},
    "clients:create": {Role.ADMIN, Role.EMPLOYEE},
    "clients:update": {Role.ADMIN, Role.EMPLOYEE},
    "clients:delete": {Role.ADMIN},
    # Projects
    "projects:read": {Role.ADMIN, Role.EMPLOYEE},
    "projects:create": {Role.ADMIN, Role.EMPLOYEE},
    "projects:update": {Role.ADMIN, Role.EMPLOYEE},
    "projects:delete": {Role.ADMIN},
    # Communication
    "communication:read": {Role.ADMIN, Role.EMPLOYEE},
    "communication:create": {Role.ADMIN, Role.EMPLOYEE},
    "communication:delete": {Role.ADMIN, Role.EMPLOYEE},
    # Change Requests
    "change_requests:read": {Role.ADMIN, Role.EMPLOYEE},
    "change_requests:create": {Role.ADMIN, Role.EMPLOYEE},
    "change_requests:update": {Role.ADMIN, Role.EMPLOYEE},
    # Notes
    "notes:read": {Role.ADMIN, Role.EMPLOYEE},
    "notes:create": {Role.ADMIN, Role.EMPLOYEE},
    "notes:delete": {Role.ADMIN, Role.EMPLOYEE},
    # Invoices
    "invoices:read": {Role.ADMIN, Role.FINANCE},
    "invoices:create": {Role.ADMIN, Role.FINANCE},
    "invoices:update": {Role.ADMIN, Role.FINANCE},
    "invoices:delete": {Role.ADMIN, Role.FINANCE},
    # Proposals
    "proposals:read": {Role.ADMIN, Role.EMPLOYEE},
    "proposals:create": {Role.ADMIN, Role.EMPLOYEE},
    "proposals:update": {Role.ADMIN, Role.EMPLOYEE},
    "proposals:delete": {Role.ADMIN, Role.EMPLOYEE},
    # Repositories
    "repositories:read": {Role.ADMIN, Role.EMPLOYEE},
    "repositories:create": {Role.ADMIN, Role.EMPLOYEE},
    "repositories:delete": {Role.ADMIN, Role.EMPLOYEE},
    # Links
    "links:read": {Role.ADMIN, Role.EMPLOYEE},
    "links:create": {Role.ADMIN, Role.EMPLOYEE},
    "links:delete": {Role.ADMIN, Role.EMPLOYEE},
    # Finance
    "finance:read": {Role.ADMIN, Role.FINANCE},
    # Dashboard
    "dashboard:read": {Role.ADMIN, Role.EMPLOYEE},
    # Settings
    "settings:read": {Role.ADMIN},
    "settings:update": {Role.ADMIN},
    # Export
    "export:database": {Role.ADMIN},
}


# Module permissions are merged into this dict at startup by the registry.
_module_permissions: dict[str, set[Role]] = {}


def register_module_permissions(permissions: dict[str, set[str]]) -> None:
    """Merge permissions from a loaded module into the RBAC map.

    Called by the module registry during startup. Module permissions extend
    (never override) the core permission map.
    """
    for key, role_names in permissions.items():
        _module_permissions[key] = {Role(r) for r in role_names}


def check_permission(user_role: str, permission: str) -> None:
    role = Role(user_role)
    # Check core permissions first, then module permissions
    allowed_roles = ROLE_PERMISSIONS.get(permission) or _module_permissions.get(permission, set())
    if role not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions",
        )


def require_roles(*roles: Role):
    """Returns a list of allowed role values for use in dependencies."""
    return [r.value for r in roles]
