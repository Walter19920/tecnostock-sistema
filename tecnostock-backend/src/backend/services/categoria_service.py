"""
services/categoria_service.py
Lógica de negocio para la gestión de categorías.

Responsabilidades:
  - Orquestar llamadas a categoria_repository.
  - Manejar excepciones de SQL Server y convertirlas en HTTPExceptions.
"""
import pyodbc
from fastapi import HTTPException, status

from core.db import get_connection
from repositories import categoria_repository
from schemas.categoria import CategoriaCreate, CategoriaOut, CategoriaUpdate


def _row_a_categoria_out(row: dict) -> CategoriaOut:
    """Convierte un dict del repositorio en CategoriaOut."""
    return CategoriaOut(
        id_categoria=row["id_categoria"],
        nombre=row["nombre"],
        descripcion=row.get("descripcion"),
        activo=bool(row.get("activo", True)),
    )


def crear_categoria(data: CategoriaCreate) -> CategoriaOut:
    """
    Registra una nueva categoría.

    Args:
        data: CategoriaCreate con nombre y descripción.

    Returns:
        CategoriaOut con los datos de la categoría creada.

    Raises:
        HTTPException 400: Si el SP lanza un error de negocio (ej. nombre duplicado).
        HTTPException 500: Si ocurre un error de conexión.
    """
    try:
        conn: pyodbc.Connection = get_connection()
        row = categoria_repository.registrar_categoria(conn, data.nombre, data.descripcion)
        conn.close()
    except pyodbc.IntegrityError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}",
        )
    return _row_a_categoria_out(row)


def listar_categorias() -> list[CategoriaOut]:
    """
    Retorna todas las categorías activas.

    Returns:
        Lista de CategoriaOut.

    Raises:
        HTTPException 500: Si ocurre un error de conexión.
    """
    try:
        conn: pyodbc.Connection = get_connection()
        rows = categoria_repository.listar_categorias(conn)
        conn.close()
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}",
        )
    return [_row_a_categoria_out(row) for row in rows]


def actualizar_categoria(data: CategoriaUpdate) -> CategoriaOut:
    """
    Actualiza una categoría existente.

    Args:
        data: CategoriaUpdate con id_categoria, nombre y descripción.

    Returns:
        CategoriaOut con los datos actualizados.

    Raises:
        HTTPException 400: Si el SP lanza un error de negocio.
        HTTPException 500: Si ocurre un error de conexión.
    """
    try:
        conn: pyodbc.Connection = get_connection()
        row = categoria_repository.actualizar_categoria(
            conn, data.id_categoria, data.nombre, data.descripcion
        )
        conn.close()
    except pyodbc.IntegrityError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de base de datos: {str(e)}",
        )
    return _row_a_categoria_out(row)
