"""
services/producto_service.py
Lógica de negocio para la gestión de productos del inventario.

Responsabilidades:
  - Orquestar llamadas a producto_repository.
  - Calcular total_paginas para respuestas paginadas.
  - Manejar excepciones de SQL Server y convertirlas en HTTPExceptions.
"""
import math

import pyodbc
from fastapi import HTTPException, status

from core.db import get_connection
from repositories import producto_repository
from schemas.pagination import PaginacionResponse
from schemas.producto import ProductoCreate, ProductoOut, ProductoUpdate


def _row_a_producto_out(row: dict) -> ProductoOut:
    """Convierte un dict del repositorio en ProductoOut."""
    return ProductoOut(
        id_producto=row["id_producto"],
        nombre=row["nombre"],
        descripcion=row.get("descripcion"),
        categoria=row["categoria"],
        precio_unitario=float(row["precio_unitario"]),
        stock_actual=int(row["stock_actual"]),
        stock_minimo=int(row["stock_minimo"]),
        activo=bool(row.get("activo", True)),
    )


def crear_producto(data: ProductoCreate) -> ProductoOut:
    """
    Registra un nuevo producto en el inventario.

    Args:
        data: ProductoCreate con todos los campos del producto.

    Returns:
        ProductoOut con los datos del producto creado.

    Raises:
        HTTPException 400: Error de negocio del SP (ej. categoría inválida).
        HTTPException 500: Error de conexión a SQL Server.
    """
    try:
        conn: pyodbc.Connection = get_connection()
        row = producto_repository.registrar_producto(
            conn,
            data.nombre,
            data.descripcion,
            data.id_categoria,
            data.precio_unitario,
            data.stock_actual,
            data.stock_minimo,
        )
        conn.close()
    except pyodbc.IntegrityError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}",
        )
    return _row_a_producto_out(row)


def listar_productos_paginado(
    pagina: int,
    tamanio_pagina: int,
    busqueda: str | None = None,
) -> PaginacionResponse[ProductoOut]:
    """
    Retorna una página de productos con filtro de búsqueda opcional.

    El cálculo de total_paginas se realiza en esta capa, nunca en el repositorio.

    Args:
        pagina:         Número de página (base 1).
        tamanio_pagina: Cantidad de registros por página.
        busqueda:       Texto de búsqueda por nombre (opcional).

    Returns:
        PaginacionResponse[ProductoOut] con items y metadatos de paginación.

    Raises:
        HTTPException 500: Error de conexión a SQL Server.
    """
    try:
        conn: pyodbc.Connection = get_connection()
        rows, total_registros = producto_repository.listar_productos_paginado(
            conn, pagina, tamanio_pagina, busqueda
        )
        conn.close()
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}",
        )

    total_paginas = math.ceil(total_registros / tamanio_pagina) if total_registros > 0 else 0
    items = [_row_a_producto_out(row) for row in rows]

    return PaginacionResponse(
        items=items,
        pagina=pagina,
        tamanio_pagina=tamanio_pagina,
        total_registros=total_registros,
        total_paginas=total_paginas,
    )


def obtener_producto(id_producto: int) -> ProductoOut:
    """
    Obtiene un producto por su ID.

    Args:
        id_producto: ID del producto.

    Returns:
        ProductoOut si existe.

    Raises:
        HTTPException 404: Si el producto no existe.
        HTTPException 500: Error de conexión a SQL Server.
    """
    try:
        conn: pyodbc.Connection = get_connection()
        row = producto_repository.obtener_producto_por_id(conn, id_producto)
        conn.close()
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}",
        )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con id {id_producto} no encontrado.",
        )
    return _row_a_producto_out(row)


def actualizar_producto(data: ProductoUpdate) -> ProductoOut:
    """
    Actualiza los datos de un producto existente.

    Args:
        data: ProductoUpdate con todos los campos a modificar.

    Returns:
        ProductoOut con los datos actualizados.

    Raises:
        HTTPException 400: Error de negocio del SP.
        HTTPException 500: Error de conexión a SQL Server.
    """
    try:
        conn: pyodbc.Connection = get_connection()
        row = producto_repository.actualizar_producto(
            conn,
            data.id_producto,
            data.nombre,
            data.descripcion,
            data.id_categoria,
            data.precio_unitario,
            data.stock_minimo,
        )
        conn.close()
    except pyodbc.IntegrityError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}",
        )
    return _row_a_producto_out(row)


def desactivar_producto(id_producto: int) -> dict:
    """
    Realiza la baja lógica de un producto.

    Args:
        id_producto: ID del producto a desactivar.

    Returns:
        dict con mensaje de confirmación del SP.

    Raises:
        HTTPException 400: Si el SP rechaza la operación.
        HTTPException 500: Error de conexión a SQL Server.
    """
    try:
        conn: pyodbc.Connection = get_connection()
        result = producto_repository.desactivar_producto(conn, id_producto)
        conn.close()
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}",
        )
    return result
