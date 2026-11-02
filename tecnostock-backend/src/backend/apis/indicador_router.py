"""
apis/indicador_router.py
Endpoints HTTP para los indicadores del dashboard y alertas de stock.

Rutas:
  GET /indicadores/dashboard   → KPIs del dashboard principal.
  GET /indicadores/stock-bajo  → Productos por debajo del stock mínimo.
"""
from fastapi import APIRouter

from schemas.indicador import IndicadorDashboard, ProductoStockBajoOut
from services import indicador_service

router = APIRouter(prefix="/indicadores", tags=["Indicadores"])


@router.get(
    "/dashboard",
    response_model=IndicadorDashboard,
    summary="Indicadores del dashboard",
    description="Retorna los KPIs principales: total de productos, entradas/salidas "
                "del mes, valor del inventario y cantidad de productos con stock bajo.",
)
def obtener_dashboard() -> IndicadorDashboard:
    """Obtiene los indicadores del dashboard."""
    return indicador_service.obtener_dashboard()


@router.get(
    "/stock-bajo",
    response_model=list[ProductoStockBajoOut],
    summary="Productos con stock bajo",
    description="Retorna los productos cuyo stock actual es menor al stock mínimo configurado.",
)
def listar_stock_bajo() -> list[ProductoStockBajoOut]:
    """Lista productos con stock por debajo del mínimo."""
    return indicador_service.listar_stock_bajo()
