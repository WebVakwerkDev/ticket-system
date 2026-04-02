"""
Module registry — discovers, validates, and registers feature modules.

Each module is a subdirectory of ``app/modules/`` that exposes:
- ``manifest``: a :class:`ModuleManifest` instance (required)
- ``router``: a FastAPI ``APIRouter`` (optional — modules without endpoints are allowed)

The registry guarantees:
1. Modules are loaded in dependency order (topological sort).
2. A missing dependency produces a clear, actionable error at startup.
3. Each module's permissions are merged into the central RBAC map.
"""

from __future__ import annotations

import importlib
import pkgutil
from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING

import structlog

if TYPE_CHECKING:
    from fastapi import APIRouter, FastAPI

logger = structlog.get_logger()

# ---------------------------------------------------------------------------
# Manifest
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ModuleManifest:
    """Declarative metadata for a single feature module."""

    name: str
    label: str
    depends_on: tuple[str, ...] = ()
    permissions: dict[str, set[str]] = field(default_factory=dict)


# ---------------------------------------------------------------------------
# Loaded module container
# ---------------------------------------------------------------------------

@dataclass
class LoadedModule:
    """A module that has been imported and validated."""

    manifest: ModuleManifest
    router: APIRouter | None = None


# ---------------------------------------------------------------------------
# Registry
# ---------------------------------------------------------------------------

class ModuleRegistry:
    """Discovers modules in ``app/modules/``, resolves dependencies, and
    registers their routers and permissions with the FastAPI application."""

    def __init__(self) -> None:
        self._modules: dict[str, LoadedModule] = {}

    @property
    def loaded_modules(self) -> dict[str, LoadedModule]:
        return dict(self._modules)

    @property
    def all_permissions(self) -> dict[str, set[str]]:
        """Merged permission map across every loaded module."""
        merged: dict[str, set[str]] = {}
        for mod in self._modules.values():
            for key, roles in mod.manifest.permissions.items():
                merged[key] = roles
        return merged

    # ------------------------------------------------------------------
    # Discovery
    # ------------------------------------------------------------------

    def discover(self) -> list[LoadedModule]:
        """Scan ``app/modules/`` for packages that expose a ``manifest``."""
        modules_dir = Path(__file__).parent
        discovered: list[LoadedModule] = []

        for module_info in pkgutil.iter_modules([str(modules_dir)]):
            if not module_info.ispkg:
                continue

            package_name = f"app.modules.{module_info.name}"

            try:
                pkg = importlib.import_module(package_name)
            except Exception as exc:
                logger.error(
                    "module_import_failed",
                    module=module_info.name,
                    error=str(exc),
                )
                raise ModuleLoadError(
                    f"Module '{module_info.name}' kon niet worden geladen: {exc}"
                ) from exc

            manifest = getattr(pkg, "manifest", None)
            if manifest is None:
                # Directory without manifest — skip silently (could be __pycache__ etc.)
                continue

            if not isinstance(manifest, ModuleManifest):
                raise ModuleLoadError(
                    f"Module '{module_info.name}' heeft een 'manifest' attribuut, "
                    f"maar het is geen ModuleManifest. Controleer __init__.py."
                )

            router = _try_import_router(package_name, module_info.name)

            discovered.append(LoadedModule(manifest=manifest, router=router))
            logger.debug("module_discovered", module=manifest.name, label=manifest.label)

        return discovered

    # ------------------------------------------------------------------
    # Dependency resolution
    # ------------------------------------------------------------------

    def resolve_order(self, modules: list[LoadedModule]) -> list[LoadedModule]:
        """Return *modules* sorted so that dependencies come first.

        Raises :class:`ModuleLoadError` with an actionable message when a
        dependency is missing or a circular dependency is detected.
        """
        by_name = {m.manifest.name: m for m in modules}
        available = set(by_name.keys())

        # Check for missing dependencies
        for mod in modules:
            missing = set(mod.manifest.depends_on) - available
            if missing:
                raise ModuleLoadError(
                    f"Module '{mod.manifest.name}' heeft deze modules nodig "
                    f"die niet gevonden zijn: {', '.join(sorted(missing))}. "
                    f"Zorg dat deze modules bestaan in app/modules/."
                )

        # Kahn's algorithm for topological sort
        in_degree: dict[str, int] = {name: 0 for name in by_name}
        dependents: dict[str, list[str]] = {name: [] for name in by_name}

        for mod in modules:
            for dep in mod.manifest.depends_on:
                in_degree[mod.manifest.name] += 1
                dependents[dep].append(mod.manifest.name)

        queue = [name for name, degree in in_degree.items() if degree == 0]
        ordered: list[str] = []

        while queue:
            # Sort for deterministic ordering
            queue.sort()
            current = queue.pop(0)
            ordered.append(current)
            for dependent in dependents[current]:
                in_degree[dependent] -= 1
                if in_degree[dependent] == 0:
                    queue.append(dependent)

        if len(ordered) != len(by_name):
            loaded = set(ordered)
            cycle_members = [name for name in by_name if name not in loaded]
            raise ModuleLoadError(
                f"Circulaire afhankelijkheid gevonden tussen modules: "
                f"{', '.join(sorted(cycle_members))}. "
                f"Controleer de 'depends_on' velden in deze modules."
            )

        return [by_name[name] for name in ordered]

    # ------------------------------------------------------------------
    # Registration
    # ------------------------------------------------------------------

    def register_all(self, app: FastAPI) -> None:
        """Discover modules, resolve order, and register with *app*."""
        discovered = self.discover()

        if not discovered:
            logger.info("module_registry_empty", hint="Geen modules gevonden in app/modules/")
            return

        ordered = self.resolve_order(discovered)

        for mod in ordered:
            self._modules[mod.manifest.name] = mod

            if mod.router is not None:
                app.include_router(mod.router)
                logger.info(
                    "module_registered",
                    module=mod.manifest.name,
                    label=mod.manifest.label,
                    endpoints=len(mod.router.routes),
                )
            else:
                logger.info(
                    "module_registered",
                    module=mod.manifest.name,
                    label=mod.manifest.label,
                    endpoints=0,
                )

        names = [m.manifest.name for m in ordered]
        logger.info("modules_loaded", count=len(names), modules=names)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _try_import_router(package_name: str, module_name: str) -> APIRouter | None:
    """Try to import ``router`` from the module's ``router`` submodule."""
    try:
        router_mod = importlib.import_module(f"{package_name}.router")
        router = getattr(router_mod, "router", None)
        return router
    except ModuleNotFoundError:
        # No router submodule — that's fine
        return None
    except Exception as exc:
        raise ModuleLoadError(
            f"Module '{module_name}' heeft een router.py, "
            f"maar die kon niet worden geladen: {exc}"
        ) from exc


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------

class ModuleLoadError(Exception):
    """Raised when a module cannot be loaded.

    Messages are written in Dutch to match the project's UI language.
    """
