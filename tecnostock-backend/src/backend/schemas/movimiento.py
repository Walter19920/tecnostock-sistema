"""
schemas/movimiento.py
Modelos Pydantic para el registro y consulta de movimientos de inventario.
"""
from pydantic import BaseModel


class EntradaCreate(BaseModel):
    """Payload para registrar una entrada de mercadería."""
    id_producto: int
    cantidad: int
    precio_compra: float
    observacion: str | None = None


class SalidaCreate(BaseModel):
    """Payload para registrar una salida de mercadería."""
    id_producto: int
    cantidad: int
    precio_venta: float
    observacion: str | None = None


class MovimientoOut(BaseModel):
    """Datos de salida de un movimiento de inventario."""
    id_movimiento: int
    tipo: str          # "ENTRADA" | "SALIDA"
    producto: str
    cantidad: int
    stock_anterior: int
    stock_posterior: int
    fecha: str
    usuario: str
    observacion: str | None
