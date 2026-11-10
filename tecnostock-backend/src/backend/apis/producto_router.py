"""
apis/producto_router.py
Endpoints HTTP para la gestión de productos del inventario.

Rutas:
  GET   /productos/                         → Lista paginada con búsqueda opcional.
  GET   /productos/{id_producto}            → Obtiene un producto por ID.
  POST  /productos/                         → Registra un nuevo producto.
  PUT   /productos/                         → Actualiza un producto existente.
  PATCH /productos/{id_producto}/desactivar → Baja lógica del producto.
"""
from fastapi import APIRouter, Query

from schemas.pagination import PaginacionResponse
from schemas.producto import ProductoCreate, ProductoOut, ProductoUpdate
from services import producto_service

router = APIRouter(prefix="/productos", tags=["Productos"])


@router.get(
    "/",
    response_model=PaginacionResponse[ProductoOut],
    summary="Listar productos paginado",
    description="Retorna una página de productos con filtro opcional por nombre y estado.",
)
def listar_productos(
    pagina: int = Query(default=1, ge=1, description="Número de página (base 1)"),
    tamanio_pagina: int = Query(default=10, ge=1, le=100, description="Registros por página"),
    busqueda: str | None = Query(default=None, description="Filtro por nombre del producto"),
    solo_activos: bool | None = Query(default=False, description="Filtrar solo activos (False para traer todos)"),
) -> PaginacionResponse[ProductoOut]:
    """Lista productos con paginación."""
    return producto_service.listar_productos_paginado(pagina, tamanio_pagina, busqueda, solo_activos)


@router.get(
    "/{id_producto}",
    response_model=ProductoOut,
    summary="Obtener producto por ID",
    description="Retorna los datos de un producto específico.",
)
def obtener_producto(id_producto: int) -> ProductoOut:
    """Obtiene un producto por su ID."""
    return producto_service.obtener_producto(id_producto)


@router.post(
    "/",
    response_model=ProductoOut,
    status_code=201,
    summary="Registrar producto",
    description="Registra un nuevo producto en el inventario.",
)
def crear_producto(data: ProductoCreate) -> ProductoOut:
    """Registra un nuevo producto."""
    return producto_service.crear_producto(data)


@router.put(
    "/",
    response_model=ProductoOut,
    summary="Actualizar producto",
    description="Actualiza los datos de un producto existente. No modifica el stock.",
)
def actualizar_producto(data: ProductoUpdate) -> ProductoOut:
    """Actualiza un producto existente."""
    return producto_service.actualizar_producto(data)


@router.patch(
    "/{id_producto}/desactivar",
    response_model=dict,
    summary="Desactivar producto",
    description="Realiza la baja lógica de un producto. No elimina el registro.",
)
def desactivar_producto(id_producto: int) -> dict:
    """Desactiva (baja lógica) un producto del inventario."""
    return producto_service.desactivar_producto(id_producto)
