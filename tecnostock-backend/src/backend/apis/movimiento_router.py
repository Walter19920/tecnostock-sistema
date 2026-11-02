"""
apis/movimiento_router.py
Endpoints HTTP para el registro y consulta de movimientos de inventario.

Rutas:
  POST /movimientos/entrada  → Registra una entrada de mercadería.
  POST /movimientos/salida   → Registra una salida de mercadería.
  GET  /movimientos/         → Consulta movimientos paginados con filtros.
"""
from fastapi import APIRouter, Depends, Query

from schemas.movimiento import EntradaCreate, MovimientoOut, SalidaCreate
from schemas.pagination import PaginacionResponse
from services import movimiento_service
from core.security import get_current_user
from schemas.auth import UsuarioOut

router = APIRouter(prefix="/movimientos", tags=["Movimientos"])


@router.post(
    "/entrada",
    response_model=MovimientoOut,
    status_code=201,
    summary="Registrar entrada",
    description="Registra una entrada de mercadería e incrementa el stock del producto.",
)
def registrar_entrada(
    data: EntradaCreate,
    usuario: UsuarioOut = Depends(get_current_user),
) -> MovimientoOut:
    """
    Registra una entrada de mercadería.

    Args:
        data:    EntradaCreate con id_producto, cantidad, precio_compra y observacion.
        usuario: Usuario autenticado inyectado por el token JWT.

    Returns:
        MovimientoOut con los datos del movimiento creado.
    """
    return movimiento_service.registrar_entrada(data, usuario.id_usuario)


@router.post(
    "/salida",
    response_model=MovimientoOut,
    status_code=201,
    summary="Registrar salida",
    description="Registra una salida de mercadería y decrementa el stock del producto. "
                "Retorna HTTP 400 si el stock es insuficiente.",
)
def registrar_salida(
    data: SalidaCreate,
    usuario: UsuarioOut = Depends(get_current_user),
) -> MovimientoOut:
    """
    Registra una salida de mercadería.

    Args:
        data:    SalidaCreate con id_producto, cantidad, precio_venta y observacion.
        usuario: Usuario autenticado inyectado por el token JWT.

    Returns:
        MovimientoOut con los datos del movimiento creado.
    """
    return movimiento_service.registrar_salida(data, usuario.id_usuario)


@router.get(
    "/",
    response_model=PaginacionResponse[MovimientoOut],
    summary="Consultar movimientos",
    description="Retorna una página de movimientos con filtros opcionales por tipo y producto.",
)
def consultar_movimientos(
    pagina: int = Query(default=1, ge=1, description="Número de página (base 1)"),
    tamanio_pagina: int = Query(default=10, ge=1, le=100, description="Registros por página"),
    tipo: str | None = Query(default=None, description="Filtro: ENTRADA | SALIDA"),
    id_producto: int | None = Query(default=None, description="Filtro por ID de producto"),
) -> PaginacionResponse[MovimientoOut]:
    """Consulta movimientos paginados."""
    return movimiento_service.consultar_movimientos(pagina, tamanio_pagina, tipo, id_producto)
