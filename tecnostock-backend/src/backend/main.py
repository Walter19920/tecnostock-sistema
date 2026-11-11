"""
main.py
Punto de entrada de la aplicación TecnoStock API.

Responsabilidades:
  - Crear la instancia FastAPI.
  - Configurar CORS desde las variables de entorno (.env).
  - Registrar todos los routers de la capa apis/.
"""
from fastapi import FastAPI

from core.config import get_settings
from core.cors import configure_cors
from apis import (
    auth_router,
    categoria_router,
    indicador_router,
    movimiento_router,
    producto_router,
)

settings = get_settings()

app = FastAPI(
    title="TecnoStock API",
    description="Sistema de gestión de inventario para TecnoStock S.A.C.",
    version="1.0.0",
)

# Configurar CORS con los orígenes definidos en .env
configure_cors(app, origins=[o.strip() for o in settings.FRONTEND_ORIGINS.split(",")])

# Registrar routers
app.include_router(auth_router.router)
app.include_router(categoria_router.router)
app.include_router(producto_router.router)
app.include_router(movimiento_router.router)
app.include_router(indicador_router.router)


@app.get("/", tags=["Health"])
def health_check() -> dict:
    """Endpoint de comprobación de estado de la API."""
    return {"status": "ok", "app": "TecnoStock API", "version": "1.0.0"}


@app.get("/health", tags=["Health"], include_in_schema=False)
def health_check_alias() -> dict:
    """Alias de comprobación de estado para healthchecks externos (monitoring/pestañas)."""
    return health_check()
