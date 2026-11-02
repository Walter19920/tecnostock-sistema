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

    Returns:
        IndicadorDashboard con total_productos, total_entradas_mes,
        total_salidas_mes, valor_inventario y productos_stock_bajo.

    Raises:
        HTTPException 500: Error de conexión a SQL Server.
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

    return IndicadorDashboard(
        total_productos=int(row.get("total_productos", 0)),
        total_entradas_mes=int(row.get("total_entradas_mes", 0)),
        total_salidas_mes=int(row.get("total_salidas_mes", 0)),
        valor_inventario=float(row.get("valor_inventario", 0.0)),
        productos_stock_bajo=int(row.get("productos_stock_bajo", 0)),
    )


def listar_stock_bajo() -> list[ProductoStockBajoOut]:
    """
    Retorna los productos cuyo stock actual es menor al stock mínimo.

    Returns:
        Lista de ProductoStockBajoOut con id_producto, nombre,
        stock_actual, stock_minimo y categoria.

    Raises:
        HTTPException 500: Error de conexión a SQL Server.
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

    return [
        ProductoStockBajoOut(
            id_producto=row["id_producto"],
            nombre=row["nombre"],
            stock_actual=int(row["stock_actual"]),
            stock_minimo=int(row["stock_minimo"]),
            categoria=row["categoria"],
        )
        for row in rows
    ]
