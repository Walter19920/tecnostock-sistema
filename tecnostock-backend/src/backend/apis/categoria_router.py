"""
apis/categoria_router.py
Endpoints HTTP para la gestión de categorías de productos.

Rutas:
  GET  /categorias/        → Lista todas las categorías activas.
  POST /categorias/        → Registra una nueva categoría.
  PUT  /categorias/        → Actualiza una categoría existente.
"""
from fastapi import APIRouter

from schemas.categoria import CategoriaCreate, CategoriaOut, CategoriaUpdate
from services import categoria_service

router = APIRouter(prefix="/categorias", tags=["Categorías"])


@router.get(
    "/",
    response_model=list[CategoriaOut],
    summary="Listar categorías",
    description="Retorna todas las categorías activas registradas en el sistema.",
)
def listar_categorias() -> list[CategoriaOut]:
    """Lista todas las categorías activas."""
    return categoria_service.listar_categorias()


@router.post(
    "/",
    response_model=CategoriaOut,
    status_code=201,
    summary="Registrar categoría",
    description="Registra una nueva categoría de productos.",
)
def crear_categoria(data: CategoriaCreate) -> CategoriaOut:
    """
    Registra una nueva categoría.

    Args:
        data: CategoriaCreate con nombre y descripción.

    Returns:
        CategoriaOut con los datos de la categoría creada.
    """
    return categoria_service.crear_categoria(data)


@router.put(
    "/",
    response_model=CategoriaOut,
    summary="Actualizar categoría",
    description="Actualiza el nombre y/o descripción de una categoría existente.",
)
def actualizar_categoria(data: CategoriaUpdate) -> CategoriaOut:
    """
    Actualiza una categoría existente.

    Args:
        data: CategoriaUpdate con id_categoria, nombre y descripción.

    Returns:
        CategoriaOut con los datos actualizados.
    """
    return categoria_service.actualizar_categoria(data)
