"""
repositories/indicador_repository.py
Acceso a datos de indicadores/dashboard exclusivamente mediante Stored Procedures.

SPs mapeados:
  - sp_ObtenerIndicadoresDashboard
  - sp_ListarProductosStockBajo
"""
import pyodbc


def obtener_indicadores_dashboard(conn: pyodbc.Connection) -> dict:
    """
    Obtiene los KPIs principales para el dashboard.

    SP invocado: sp_ObtenerIndicadoresDashboard

    Args:
        conn: Conexión activa a SQL Server.

    Returns:
        dict con total_productos, total_entradas_mes, total_salidas_mes,
        valor_inventario y productos_stock_bajo.
    """
    cursor = conn.cursor()
    cursor.execute("EXEC sp_ObtenerIndicadoresDashboard")
    row = cursor.fetchone()
    if row is None:
        return {}
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))


def listar_productos_stock_bajo(conn: pyodbc.Connection) -> list[dict]:
    """
    Retorna los productos cuyo stock actual es menor al stock mínimo.

    SP invocado: sp_ListarProductosStockBajo

    Args:
        conn: Conexión activa a SQL Server.

    Returns:
        Lista de dicts con id_producto, nombre, stock_actual, stock_minimo y categoria.
    """
    cursor = conn.cursor()
    cursor.execute("EXEC sp_ListarProductosStockBajo")
    rows = cursor.fetchall()
    if not rows:
        return []
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in rows]
