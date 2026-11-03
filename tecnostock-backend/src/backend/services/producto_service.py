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
        codigo=row["codigo"],
        nombre=row["nombre"],
        descripcion=row.get("descripcion"),
        id_categoria=row["id_categoria"],
        categoria=row.get("categoria_nombre") or row.get("categoria", ""),
        precio_compra=float(row["precio_compra"]),
        precio_venta=float(row["precio_venta"]),
        stock_actual=int(row["stock_actual"]),
        stock_minimo=int(row["stock_minimo"]),
        activo=bool(row.get("activo", True)),
    )


def crear_producto(data: ProductoCreate, id_usuario: int | None = None) -> ProductoOut:
    """Registra un nuevo producto en el inventario."""
    try:
        conn: pyodbc.Connection = get_connection()
        row = producto_repository.registrar_producto(
            conn=conn,
            codigo=data.codigo,
            nombre=data.nombre,
            descripcion=data.descripcion,
            id_categoria=data.id_categoria,
            precio_compra=data.precio_compra,
            precio_venta=data.precio_venta,
            stock_minimo=data.stock_minimo,
            stock_inicial=data.stock_inicial if hasattr(data, "stock_inicial") else 0,
            id_usuario=id_usuario,
        )
        # Obtener datos completos con el nombre de categoría
        producto_creado = producto_repository.obtener_producto_por_id(
            conn, row["id_producto"]
        )
        conn.close()
    except pyodbc.IntegrityError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}",
        )
    return _row_a_producto_out(producto_creado)


def listar_productos_paginado(
    pagina: int = 1,
    tamanio_pagina: int = 10,
    busqueda: str | None = None,
    id_categoria: int | None = None,
    activo: bool | None = True,
) -> PaginacionResponse[ProductoOut]:
    """Retorna una página de productos con filtros opcionales."""
    try:
        conn: pyodbc.Connection = get_connection()
        rows, total_registros = producto_repository.listar_productos_paginado(
            conn=conn,
            pagina=pagina,
            tamanio_pagina=tamanio_pagina,
            busqueda=busqueda,
            id_categoria=id_categoria,
            activo=activo,
        )
        conn.close()
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}",
        )

    total_paginas = (
        math.ceil(total_registros / tamanio_pagina) if total_registros > 0 else 0
    )
    items = [_row_a_producto_out(row) for row in rows]

    return PaginacionResponse(
        items=items,
        pagina=pagina,
        tamanio_pagina=tamanio_pagina,
        total_registros=total_registros,
        total_paginas=total_paginas,
    )


def obtener_producto(id_producto: int) -> ProductoOut:
    """Obtiene un producto por su ID."""
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
    """Actualiza los datos de un producto existente."""
    try:
        conn: pyodbc.Connection = get_connection()
        producto_repository.actualizar_producto(
            conn=conn,
            id_producto=data.id_producto,
            codigo=data.codigo,
            nombre=data.nombre,
            descripcion=data.descripcion,
            id_categoria=data.id_categoria,
            precio_compra=data.precio_compra,
            precio_venta=data.precio_venta,
            stock_minimo=data.stock_minimo,
        )
        row = producto_repository.obtener_producto_por_id(conn, data.id_producto)
        conn.close()
    except pyodbc.IntegrityError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}",
        )

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con id {data.id_producto} no encontrado.",
        )
    return _row_a_producto_out(row)


def desactivar_producto(id_producto: int) -> dict:
    """Realiza la baja lógica de un producto."""
    try:
        conn: pyodbc.Connection = get_connection()
        producto_repository.desactivar_producto(conn, id_producto)
        conn.close()
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}",
        )
    return {"mensaje": f"Producto con ID {id_producto} desactivado exitosamente."}