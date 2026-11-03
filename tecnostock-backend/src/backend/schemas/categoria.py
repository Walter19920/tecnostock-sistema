"""
schemas/categoria.py
Modelos Pydantic para la gestión de categorías de productos.
"""
from pydantic import BaseModel


class CategoriaCreate(BaseModel):
    """Payload para registrar una nueva categoría."""
    nombre: str
    descripcion: str | None = None


class CategoriaUpdate(BaseModel):
    """Payload para actualizar una categoría existente."""
    id_categoria: int
    nombre: str
    descripcion: str | None = None
    activo: bool = True


class CategoriaOut(BaseModel):
    """Datos de salida de una categoría."""
    id_categoria: int
    nombre: str
    descripcion: str | None
    activo: bool
