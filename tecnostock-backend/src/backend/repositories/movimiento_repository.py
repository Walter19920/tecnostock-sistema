"""
repositories/movimiento_repository.py
Acceso a datos de movimientos exclusivamente mediante Stored Procedures.
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
    cursor = conn.cursor()
    cursor.execute(
        """EXEC sp_RegistrarEntrada
            @id_producto = ?, @cantidad = ?, @motivo = ?, @id_usuario = ?""",
        (id_producto, cantidad, observacion, id_usuario),
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
    cursor = conn.cursor()
    cursor.execute(
        """EXEC sp_RegistrarSalida
            @id_producto = ?, @cantidad = ?, @motivo = ?, @id_usuario = ?""",
        (id_producto, cantidad, observacion, id_usuario),
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
    cursor = conn.cursor()
    # Enviamos los 5 parámetros en el orden exacto que espera SQL Server:
    # @id_producto, @fecha_inicio, @fecha_fin, @pagina, @tamanio_pagina
    cursor.execute(
        """EXEC sp_ConsultarMovimientosPaginado
            @id_producto = ?, @fecha_inicio = ?, @fecha_fin = ?, @pagina = ?, @tamanio_pagina = ?""",
        (id_producto, None, None, pagina, tamanio_pagina),
    )
    rows = cursor.fetchall()
    columns = [col[0] for col in cursor.description] if cursor.description else []
    items = [dict(zip(columns, row)) for row in rows]
    
    total_registros = 0
    if items:
        # Busca si alguna columna devuelve el total
        for key, val in items[0].items():
            if "total" in key.lower():
                total_registros = int(val)
                break
        if total_registros == 0:
            total_registros = len(items)

    return items, total_registros