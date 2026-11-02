"""
services/movimiento_service.py
Lógica de negocio para el registro y consulta de movimientos de inventario.

Responsabilidades:
  - Orquestar llamadas a movimiento_repository.
  - Calcular total_paginas para respuestas paginadas.
  - Capturar errores SQL Server (ej. stock insuficiente) y convertirlos en HTTP 400.
"""
import math

import pyodbc
from fastapi import HTTPException, status

from core.db import get_connection
from repositories import movimiento_repository
from schemas.movimiento import EntradaCreate, MovimientoOut, SalidaCreate
from schemas.pagination import PaginacionResponse


def _row_a_movimiento_out(row: dict) -> MovimientoOut:
    """Convierte un dict del repositorio en MovimientoOut."""
    return MovimientoOut(
        id_movimiento=row["id_movimiento"],
        tipo=row["tipo"],
        producto=row["producto"],
        cantidad=int(row["cantidad"]),
        precio_unitario=float(row["precio_unitario"]),
        total=float(row["total"]),
        fecha=str(row["fecha"]),
        usuario=row["usuario"],
        observacion=row.get("observacion"),
    )


def registrar_entrada(data: EntradaCreate, id_usuario: int) -> MovimientoOut:
    """
    Registra una entrada de mercadería al inventario.

    Args:
        data:       EntradaCreate con id_producto, cantidad, precio_compra y observacion.
        id_usuario: ID del usuario autenticado que realiza la operación.

    Returns:
        MovimientoOut con los datos del movimiento registrado.

    Raises:
        HTTPException 400: Si el SP rechaza la operación (validaciones de negocio).
        HTTPException 500: Error de conexión a SQL Server.
    """
    try:
        conn: pyodbc.Connection = get_connection()
        row = movimiento_repository.registrar_entrada(
            conn,
            data.id_producto,
            data.cantidad,
            data.precio_compra,
            id_usuario,
            data.observacion,
        )
        conn.close()
    except pyodbc.ProgrammingError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}",
        )
    return _row_a_movimiento_out(row)


def registrar_salida(data: SalidaCreate, id_usuario: int) -> MovimientoOut:
    """
    Registra una salida de mercadería del inventario.

    Args:
        data:       SalidaCreate con id_producto, cantidad, precio_venta y observacion.
        id_usuario: ID del usuario autenticado que realiza la operación.

    Returns:
        MovimientoOut con los datos del movimiento registrado.

    Raises:
        HTTPException 400: Si hay stock insuficiente u otro error de negocio del SP.
        HTTPException 500: Error de conexión a SQL Server.
    """
    try:
        conn: pyodbc.Connection = get_connection()
        row = movimiento_repository.registrar_salida(
            conn,
            data.id_producto,
            data.cantidad,
            data.precio_venta,
            id_usuario,
            data.observacion,
        )
        conn.close()
    except pyodbc.ProgrammingError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}",
        )
    return _row_a_movimiento_out(row)


def consultar_movimientos(
    pagina: int,
    tamanio_pagina: int,
    tipo: str | None = None,
    id_producto: int | None = None,
) -> PaginacionResponse[MovimientoOut]:
    """
    Consulta movimientos paginados con filtros opcionales.

    El cálculo de total_paginas se realiza aquí, nunca en el repositorio.

    Args:
        pagina:         Número de página (base 1).
        tamanio_pagina: Registros por página.
        tipo:           "ENTRADA", "SALIDA" o None para todos.
        id_producto:    Filtra por producto específico (opcional).

    Returns:
        PaginacionResponse[MovimientoOut] con items y metadatos de paginación.

    Raises:
        HTTPException 500: Error de conexión a SQL Server.
    """
    try:
        conn: pyodbc.Connection = get_connection()
        rows, total_registros = movimiento_repository.consultar_movimientos_paginado(
            conn, pagina, tamanio_pagina, tipo, id_producto
        )
        conn.close()
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}",
        )

    total_paginas = math.ceil(total_registros / tamanio_pagina) if total_registros > 0 else 0
    items = [_row_a_movimiento_out(row) for row in rows]

    return PaginacionResponse(
        items=items,
        pagina=pagina,
        tamanio_pagina=tamanio_pagina,
        total_registros=total_registros,
        total_paginas=total_paginas,
    )
