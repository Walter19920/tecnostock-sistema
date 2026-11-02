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
    nombre: str,
    descripcion: str | None,
    id_categoria: int,
    precio_unitario: float,
    stock_actual: int,
    stock_minimo: int,
) -> dict:
    """
    Registra un nuevo producto en el inventario.

    SP invocado: sp_RegistrarProducto

    Args:
        conn:            Conexión activa a SQL Server.
        nombre:          Nombre del producto.
        descripcion:     Descripción opcional.
        id_categoria:    ID de la categoría a la que pertenece.
        precio_unitario: Precio unitario del producto.
        stock_actual:    Cantidad inicial en stock.
        stock_minimo:    Stock mínimo permitido antes de alerta.

    Returns:
        dict con los datos del producto recién creado.
    """
    cursor = conn.cursor()
    cursor.execute(
        """EXEC sp_RegistrarProducto
            @Nombre = ?, @Descripcion = ?, @IdCategoria = ?,
            @PrecioUnitario = ?, @StockActual = ?, @StockMinimo = ?""",
        (nombre, descripcion, id_categoria, precio_unitario, stock_actual, stock_minimo),
    )
    row = cursor.fetchone()
    conn.commit()
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))


def listar_productos_paginado(
    conn: pyodbc.Connection,
    pagina: int,
    tamanio_pagina: int,
    busqueda: str | None = None,
) -> tuple[list[dict], int]:
    """
    Obtiene una página de productos con filtro de búsqueda opcional.

    SP invocado: sp_ListarProductosPaginado

    Args:
        conn:           Conexión activa a SQL Server.
        pagina:         Número de página (base 1).
        tamanio_pagina: Cantidad de registros por página.
        busqueda:       Texto de búsqueda por nombre (opcional).

    Returns:
        Tupla (lista de dicts de productos, total_registros).
    """
    cursor = conn.cursor()
    cursor.execute(
        "EXEC sp_ListarProductosPaginado @Pagina = ?, @TamanioPagina = ?, @Busqueda = ?",
        (pagina, tamanio_pagina, busqueda),
    )
    rows = cursor.fetchall()
    columns = [col[0] for col in cursor.description]
    items = [dict(zip(columns, row)) for row in rows]
    total_registros = items[0].get("total_registros", 0) if items else 0
    return items, total_registros


def obtener_producto_por_id(
    conn: pyodbc.Connection,
    id_producto: int,
) -> dict | None:
    """
    Obtiene un producto por su ID.

    SP invocado: sp_ObtenerProductoPorId

    Args:
        conn:        Conexión activa a SQL Server.
        id_producto: ID del producto a buscar.

    Returns:
        dict con los datos del producto, o None si no existe.
    """
    cursor = conn.cursor()
    cursor.execute(
        "EXEC sp_ObtenerProductoPorId @IdProducto = ?",
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
    nombre: str,
    descripcion: str | None,
    id_categoria: int,
    precio_unitario: float,
    stock_minimo: int,
) -> dict:
    """
    Actualiza los datos de un producto existente.

    SP invocado: sp_ActualizarProducto

    Args:
        conn:            Conexión activa a SQL Server.
        id_producto:     ID del producto a actualizar.
        nombre:          Nuevo nombre.
        descripcion:     Nueva descripción (opcional).
        id_categoria:    Nueva categoría.
        precio_unitario: Nuevo precio unitario.
        stock_minimo:    Nuevo stock mínimo.

    Returns:
        dict con los datos actualizados del producto.
    """
    cursor = conn.cursor()
    cursor.execute(
        """EXEC sp_ActualizarProducto
            @IdProducto = ?, @Nombre = ?, @Descripcion = ?,
            @IdCategoria = ?, @PrecioUnitario = ?, @StockMinimo = ?""",
        (id_producto, nombre, descripcion, id_categoria, precio_unitario, stock_minimo),
    )
    row = cursor.fetchone()
    conn.commit()
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))


def desactivar_producto(
    conn: pyodbc.Connection,
    id_producto: int,
) -> dict:
    """
    Desactiva (baja lógica) un producto del inventario.

    SP invocado: sp_DesactivarProducto

    Args:
        conn:        Conexión activa a SQL Server.
        id_producto: ID del producto a desactivar.

    Returns:
        dict con mensaje de confirmación retornado por el SP.
    """
    cursor = conn.cursor()
    cursor.execute(
        "EXEC sp_DesactivarProducto @IdProducto = ?",
        (id_producto,),
    )
    row = cursor.fetchone()
    conn.commit()
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))
