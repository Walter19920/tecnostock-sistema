"""
repositories/categoria_repository.py
Acceso a datos de categorías exclusivamente mediante Stored Procedures.

SPs mapeados:
  - sp_RegistrarCategoria
  - sp_ListarCategorias
  - sp_ActualizarCategoria
"""
import pyodbc


def registrar_categoria(
    conn: pyodbc.Connection,
    nombre: str,
    descripcion: str | None,
) -> dict:
    """
    Registra una nueva categoría.

    SP invocado: sp_RegistrarCategoria

    Args:
        conn:        Conexión activa a SQL Server.
        nombre:      Nombre de la categoría.
        descripcion: Descripción opcional.

    Returns:
        dict con los datos de la categoría recién creada.
    """
    cursor = conn.cursor()
    cursor.execute(
        "EXEC sp_RegistrarCategoria @Nombre = ?, @Descripcion = ?",
        (nombre, descripcion),
    )
    row = cursor.fetchone()
    conn.commit()
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))


def listar_categorias(conn: pyodbc.Connection) -> list[dict]:
    """
    Retorna todas las categorías activas.

    SP invocado: sp_ListarCategorias

    Args:
        conn: Conexión activa a SQL Server.

    Returns:
        Lista de dicts con los datos de cada categoría.
    """
    cursor = conn.cursor()
    cursor.execute("EXEC sp_ListarCategorias")
    rows = cursor.fetchall()
    if not rows:
        return []
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in rows]


def actualizar_categoria(
    conn: pyodbc.Connection,
    id_categoria: int,
    nombre: str,
    descripcion: str | None,
) -> dict:
    """
    Actualiza los datos de una categoría existente.

    SP invocado: sp_ActualizarCategoria

    Args:
        conn:         Conexión activa a SQL Server.
        id_categoria: ID de la categoría a actualizar.
        nombre:       Nuevo nombre.
        descripcion:  Nueva descripción (opcional).

    Returns:
        dict con los datos actualizados de la categoría.
    """
    cursor = conn.cursor()
    cursor.execute(
        "EXEC sp_ActualizarCategoria @IdCategoria = ?, @Nombre = ?, @Descripcion = ?",
        (id_categoria, nombre, descripcion),
    )
    row = cursor.fetchone()
    conn.commit()
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))
