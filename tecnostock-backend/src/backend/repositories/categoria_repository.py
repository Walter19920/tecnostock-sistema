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
    """
    cursor = conn.cursor()
    cursor.execute(
        "EXEC sp_RegistrarCategoria @nombre = ?, @descripcion = ?",
        (nombre, descripcion),
    )
    row = cursor.fetchone()
    conn.commit()
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))


def listar_categorias(conn: pyodbc.Connection) -> list[dict]:
    """
    Retorna todas las categorías activas.
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
    activo: bool = True,
) -> dict:
    """
    Actualiza los datos de una categoría existente.
    """
    cursor = conn.cursor()
    cursor.execute(
        "EXEC sp_ActualizarCategoria @id_categoria = ?, @nombre = ?, @descripcion = ?, @activo = ?",
        (id_categoria, nombre, descripcion, 1 if activo else 0),
    )
    conn.commit()
    return {
        "id_categoria": id_categoria,
        "nombre": nombre,
        "descripcion": descripcion,
        "activo": activo,
    }