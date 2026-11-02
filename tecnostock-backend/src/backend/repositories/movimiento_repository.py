"""
repositories/movimiento_repository.py
Acceso a datos de movimientos exclusivamente mediante Stored Procedures.

SPs mapeados:
  - sp_RegistrarEntrada
  - sp_RegistrarSalida
  - sp_ConsultarMovimientosPaginado
"""
import pyodbc


def registrar_entrada(
    conn: pyodbc.Connection,
    id_producto: int,
    cantidad: int,
    precio_compra: float,
    id_usuario: int,
    observacion: str | None,
) -> dict:
    """
    Registra una entrada de mercadería al inventario.

    SP invocado: sp_RegistrarEntrada

    Args:
        conn:          Conexión activa a SQL Server.
        id_producto:   ID del producto que ingresa.
        cantidad:      Unidades que ingresan.
        precio_compra: Precio de compra unitario.
        id_usuario:    ID del usuario que registra la operación.
        observacion:   Nota adicional opcional.

    Returns:
        dict con los datos del movimiento creado.
    """
    cursor = conn.cursor()
    cursor.execute(
        """EXEC sp_RegistrarEntrada
            @IdProducto = ?, @Cantidad = ?, @PrecioCompra = ?,
            @IdUsuario = ?, @Observacion = ?""",
        (id_producto, cantidad, precio_compra, id_usuario, observacion),
    )
    row = cursor.fetchone()
    conn.commit()
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))


def registrar_salida(
    conn: pyodbc.Connection,
    id_producto: int,
    cantidad: int,
    precio_venta: float,
    id_usuario: int,
    observacion: str | None,
) -> dict:
    """
    Registra una salida de mercadería del inventario.

    SP invocado: sp_RegistrarSalida

    Args:
        conn:         Conexión activa a SQL Server.
        id_producto:  ID del producto que egresa.
        cantidad:     Unidades que salen.
        precio_venta: Precio de venta unitario.
        id_usuario:   ID del usuario que registra la operación.
        observacion:  Nota adicional opcional.

    Returns:
        dict con los datos del movimiento creado.

    Raises:
        pyodbc.Error: Si el SP lanza un error por stock insuficiente.
    """
    cursor = conn.cursor()
    cursor.execute(
        """EXEC sp_RegistrarSalida
            @IdProducto = ?, @Cantidad = ?, @PrecioVenta = ?,
            @IdUsuario = ?, @Observacion = ?""",
        (id_producto, cantidad, precio_venta, id_usuario, observacion),
    )
    row = cursor.fetchone()
    conn.commit()
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))


def consultar_movimientos_paginado(
    conn: pyodbc.Connection,
    pagina: int,
    tamanio_pagina: int,
    tipo: str | None = None,
    id_producto: int | None = None,
) -> tuple[list[dict], int]:
    """
    Consulta movimientos de inventario con paginación y filtros opcionales.

    SP invocado: sp_ConsultarMovimientosPaginado

    Args:
        conn:           Conexión activa a SQL Server.
        pagina:         Número de página (base 1).
        tamanio_pagina: Cantidad de registros por página.
        tipo:           Filtro por tipo: "ENTRADA", "SALIDA" o None para ambos.
        id_producto:    Filtro por producto específico (opcional).

    Returns:
        Tupla (lista de dicts de movimientos, total_registros).
    """
    cursor = conn.cursor()
    cursor.execute(
        """EXEC sp_ConsultarMovimientosPaginado
            @Pagina = ?, @TamanioPagina = ?, @Tipo = ?, @IdProducto = ?""",
        (pagina, tamanio_pagina, tipo, id_producto),
    )
    rows = cursor.fetchall()
    columns = [col[0] for col in cursor.description]
    items = [dict(zip(columns, row)) for row in rows]
    total_registros = items[0].get("total_registros", 0) if items else 0
    return items, total_registros
