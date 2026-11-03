"""
schemas/producto.py
Modelos Pydantic para la gestión de productos del inventario.
"""
from pydantic import BaseModel


class ProductoCreate(BaseModel):
    """Payload para registrar un nuevo producto."""
    codigo: str
    nombre: str
    descripcion: str | None = None
    id_categoria: int
    precio_compra: float
    precio_venta: float
    stock_inicial: int = 0
    stock_minimo: int


class ProductoUpdate(BaseModel):
    """Payload para actualizar un producto existente."""
    id_producto: int
    codigo: str
    nombre: str
    descripcion: str | None = None
    id_categoria: int
    precio_compra: float
    precio_venta: float
    stock_minimo: int


class ProductoOut(BaseModel):
    """Datos de salida de un producto."""
    id_producto: int
    codigo: str
    nombre: str
    descripcion: str | None = None
    id_categoria: int
    categoria: str
    precio_compra: float
    precio_venta: float
    stock_actual: int
    stock_minimo: int
    activo: bool