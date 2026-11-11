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

def _row_a_movimiento_out(
    row: dict,
    tipo_default: str = "ENTRADA",
    data_input: EntradaCreate | SalidaCreate | None = None,
    id_usuario: int | None = None,
) -> MovimientoOut:
    """
    Convierte un dict del repositorio en MovimientoOut mapeando los aliases
    exactos devueltos por sp_ConsultarMovimientosPaginado.
    """
    r = {str(k).lower(): v for k, v in row.items()} if row else {}

    # 1. ID Movimiento
    id_mov = int(r.get("id_movimiento") or 1)

    # 2. Tipo de movimiento
    tipo_mov = str(r.get("tipo_movimiento") or r.get("tipo") or tipo_default)

    # 3. Nombre del producto
    prod_id = data_input.id_producto if data_input else r.get("id_producto", "")
    prod_nombre = str(
        r.get("producto_nombre")
        or r.get("producto")
        or (f"Producto #{prod_id}" if prod_id else "Producto N/A")
    )

    # 4. Cantidad
    cant = int(r.get("cantidad") or (data_input.cantidad if data_input else 0))

    # 5. Stock Anterior (Obtenido desde la BD)
    stock_ant = int(r.get("stock_anterior") or 0)

    # 6. Stock Posterior (Obtenido desde la BD)
    stock_post = int(r.get("stock_posterior") or 0)

    # 7. Fecha
    fecha_val = r.get("fecha") or r.get("fecha_movimiento") or ""
    fecha_str = str(fecha_val)

    # 8. Usuario
    usr_val = id_usuario if id_usuario is not None else r.get("id_usuario", "")
    usr_nombre = (
        r.get("usuario_registrador")
        or r.get("usuario")
        or (f"Usuario #{usr_val}" if usr_val else "Sistema")
    )
    usr_str = str(usr_nombre)

    # 9. Observación / Motivo
    obs = r.get("motivo") or r.get("observacion") or (data_input.observacion if data_input else None)

    return MovimientoOut(
        id_movimiento=id_mov,
        tipo=tipo_mov,
        producto=prod_nombre,
        cantidad=cant,
        stock_anterior=stock_ant,
        stock_posterior=stock_post,
        fecha=fecha_str,
        usuario=usr_str,
        observacion=obs,
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
    return _row_a_movimiento_out(row, tipo_default="ENTRADA", data_input=data, id_usuario=id_usuario)


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
    return _row_a_movimiento_out(row, tipo_default="SALIDA", data_input=data, id_usuario=id_usuario)


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