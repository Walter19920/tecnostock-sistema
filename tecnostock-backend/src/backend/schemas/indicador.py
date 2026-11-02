"""
schemas/indicador.py
Modelos Pydantic para los indicadores del dashboard y alertas de stock.
"""
from pydantic import BaseModel


class IndicadorDashboard(BaseModel):
    """KPIs principales del dashboard de TecnoStock."""
    total_productos: int
    total_entradas_mes: int
    total_salidas_mes: int
    valor_inventario: float
    productos_stock_bajo: int


class ProductoStockBajoOut(BaseModel):
    """Producto que está por debajo de su stock mínimo."""
    id_producto: int
    nombre: str
    stock_actual: int
    stock_minimo: int
    categoria: str
