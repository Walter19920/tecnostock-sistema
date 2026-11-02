"""
schemas/producto.py
Modelos Pydantic para la gestión de productos del inventario.
"""
from pydantic import BaseModel


class ProductoCreate(BaseModel):
    """Payload para registrar un nuevo producto."""
    nombre: str
    descripcion: str | None = None
    id_categoria: int
    precio_unitario: float
    stock_actual: int
    stock_minimo: int


class ProductoUpdate(BaseModel):
    """Payload para actualizar un producto existente."""
    id_producto: int
    nombre: str
    descripcion: str | None = None
    id_categoria: int
    precio_unitario: float
    stock_minimo: int


class ProductoOut(BaseModel):
    """Datos de salida de un producto."""
    id_producto: int
    nombre: str
    descripcion: str | None
    categoria: str
    precio_unitario: float
    stock_actual: int
    stock_minimo: int
    activo: bool
