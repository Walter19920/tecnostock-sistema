"""
repositories/producto_repository.py
Acceso a datos de productos exclusivamente mediante Stored Procedures.

SPs mapeados:
  - sp_RegistrarProducto
  - sp_ListarProductosPaginado
  - sp_ObtenerProductoPorId
  - sp_ActualizarProducto
  - sp_DesactivarProducto
"""
import pyodbc


def registrar_producto(
    conn: pyodbc.Connection,
    codigo: str,
    nombre: str,
    descripcion: str | None,
    id_categoria: int,
    precio_compra: float,
    precio_venta: float,
    stock_minimo: int,
    stock_inicial: int = 0,
    id_usuario: int | None = None,
) -> dict:
    """
    Registra un nuevo producto en el inventario.
    SP invocado: sp_RegistrarProducto
    """
    cursor = conn.cursor()
    cursor.execute(
        """EXEC sp_RegistrarProducto
            @codigo = ?, @nombre = ?, @descripcion = ?, @id_categoria = ?,
            @precio_compra = ?, @precio_venta = ?, @stock_minimo = ?,
            @stock_inicial = ?, @id_usuario = ?""",
        (
            codigo,
            nombre,
            descripcion,
            id_categoria,
            precio_compra,
            precio_venta,
            stock_minimo,
            stock_inicial,
            id_usuario,
        ),
    )
    row = cursor.fetchone()
    conn.commit()
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))


def listar_productos_paginado(
    conn: pyodbc.Connection,
    pagina: int = 1,
    tamanio_pagina: int = 10,
    busqueda: str | None = None,
    id_categoria: int | None = None,
    activo: bool | None = True,
) -> tuple[list[dict], int]:
    """
    Obtiene una página de productos con filtros opcionales.
    SP invocado: sp_ListarProductosPaginado
    """
    cursor = conn.cursor()
    cursor.execute(
        """EXEC sp_ListarProductosPaginado 
            @busqueda = ?, @id_categoria = ?, @activo = ?, @pagina = ?, @tamanio_pagina = ?""",
        (
            busqueda,
            id_categoria,
            1 if activo is True else (0 if activo is False else None),
            pagina,
            tamanio_pagina,
        ),
    )
    rows = cursor.fetchall()
    if not rows:
        return [], 0

    columns = [col[0] for col in cursor.description]
    items = [dict(zip(columns, row)) for row in rows]
    total_registros = items[0].get("total_registros", len(items))
    return items, total_registros


def obtener_producto_por_id(
    conn: pyodbc.Connection,
    id_producto: int,
) -> dict | None:
    """
    Obtiene un producto por su ID.
    SP invocado: sp_ObtenerProductoPorId
    """
    cursor = conn.cursor()
    cursor.execute(
        "EXEC sp_ObtenerProductoPorId @id_producto = ?",
        (id_producto,),
    )
    row = cursor.fetchone()
    if row is None:
        return None
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))


def actualizar_producto(
    conn: pyodbc.Connection,
    id_producto: int,
    codigo: str,
    nombre: str,
    descripcion: str | None,
    id_categoria: int,
    precio_compra: float,
    precio_venta: float,
    stock_minimo: int,
) -> None:
    """
    Actualiza los datos de un producto existente.
    SP invocado: sp_ActualizarProducto
    """
    cursor = conn.cursor()
    cursor.execute(
        """EXEC sp_ActualizarProducto
            @id_producto = ?, @codigo = ?, @nombre = ?, @descripcion = ?,
            @id_categoria = ?, @precio_compra = ?, @precio_venta = ?, @stock_minimo = ?""",
        (
            id_producto,
            codigo,
            nombre,
            descripcion,
            id_categoria,
            precio_compra,
            precio_venta,
            stock_minimo,
        ),
    )
    conn.commit()


def desactivar_producto(
    conn: pyodbc.Connection,
    id_producto: int,
) -> None:
    """
    Desactiva (baja lógica) un producto del inventario.
    SP invocado: sp_DesactivarProducto
    """
    cursor = conn.cursor()
    cursor.execute(
        "EXEC sp_DesactivarProducto @id_producto = ?",
        (id_producto,),
    )
    conn.commit()