"""
repositories/auth_repository.py
Acceso a datos de autenticación exclusivamente mediante Stored Procedures.

SP mapeado:
  - sp_ObtenerUsuarioPorUsername
"""
import pyodbc


def obtener_usuario_por_username(
    conn: pyodbc.Connection,
    username: str,
) -> dict | None:
    """
    Busca un usuario por su nombre de usuario.

    SP invocado: sp_ObtenerUsuarioPorUsername

    Args:
        conn:     Conexión activa a SQL Server.
        username: Nombre de usuario a buscar.

    Returns:
        dict con los datos del usuario si existe, None si no se encontró.
    """
    cursor = conn.cursor()
    cursor.execute(
        "EXEC sp_ObtenerUsuarioPorUsername @Username = ?",
        (username,),
    )
    row = cursor.fetchone()
    if row is None:
        return None
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))
