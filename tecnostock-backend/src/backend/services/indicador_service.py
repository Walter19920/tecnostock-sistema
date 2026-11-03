"""
services/indicador_service.py
Lógica de negocio para la obtención de indicadores del dashboard.

Responsabilidades:
  - Orquestar llamadas a indicador_repository.
  - Manejar excepciones de SQL Server y convertirlas en HTTPExceptions.
"""
import pyodbc
from fastapi import HTTPException, status

from core.db import get_connection
from repositories import indicador_repository
from schemas.indicador import IndicadorDashboard, ProductoStockBajoOut


def obtener_dashboard() -> IndicadorDashboard:
    """
    Obtiene los KPIs principales del dashboard de TecnoStock.
    Mapea las columnas exactas devueltas por el SP sp_ObtenerIndicadoresDashboard:
      - total_productos_activos -> total_productos
      - total_stock_bajo -> productos_stock_bajo
      - valor_referencial_inventario -> valor_inventario
    """
    try:
        conn: pyodbc.Connection = get_connection()
        row = indicador_repository.obtener_indicadores_dashboard(conn)
        conn.close()
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}",
        )

    # Normalizar llaves a minúsculas para mayor seguridad
    r = {str(k).lower(): v for k, v in row.items()} if row else {}

    return IndicadorDashboard(
        total_productos=int(r.get("total_productos_activos") or r.get("total_productos") or 0),
        total_entradas_mes=int(r.get("total_entradas_mes") or 0),
        total_salidas_mes=int(r.get("total_salidas_mes") or 0),
        valor_inventario=float(r.get("valor_referencial_inventario") or r.get("valor_inventario") or 0.0),
        productos_stock_bajo=int(r.get("total_stock_bajo") or r.get("productos_stock_bajo") or 0),
    )


def listar_stock_bajo() -> list[ProductoStockBajoOut]:
    """
    Retorna los productos cuyo stock actual es menor al stock mínimo.
    Mapea categoria_nombre como categoria.
    """
    try:
        conn: pyodbc.Connection = get_connection()
        rows = indicador_repository.listar_productos_stock_bajo(conn)
        conn.close()
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}",
        )

    resultado = []
    for r in rows:
        row_lower = {str(k).lower(): v for k, v in r.items()}
        resultado.append(
            ProductoStockBajoOut(
                id_producto=int(row_lower.get("id_producto", 0)),
                nombre=str(row_lower.get("nombre", "")),
                stock_actual=int(row_lower.get("stock_actual", 0)),
                stock_minimo=int(row_lower.get("stock_minimo", 0)),
                categoria=str(row_lower.get("categoria_nombre") or row_lower.get("categoria") or ""),
            )
        )

    return resultado