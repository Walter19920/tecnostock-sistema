"""
repositories/auth_repository.py
Acceso a datos de autenticación y usuarios exclusivamente mediante Stored Procedures.

SPs mapeados:
  - sp_ObtenerUsuarioPorUsername
  - sp_RegistrarUsuario
  - sp_ListarUsuarios
"""
import pyodbc


def obtener_usuario_por_username(
    conn: pyodbc.Connection,
    username: str,
) -> dict | None:
    """
    Busca un usuario por su nombre de usuario.

    SP invocado: sp_ObtenerUsuarioPorUsername
    """
    cursor = conn.cursor()
    cursor.execute(
        "EXEC sp_ObtenerUsuarioPorUsername @username = ?",
        (username,),
    )
    row = cursor.fetchone()
    if row is None:
        return None
    columns = [col[0] for col in cursor.description]
    return dict(zip(columns, row))


def registrar_usuario(
    conn: pyodbc.Connection,
    username: str,
    password_hash: str,
    nombre_completo: str,
    rol: str = "ALMACENERO",
) -> int:
    """
    Registra un nuevo usuario en la base de datos.

    SP invocado: sp_RegistrarUsuario
    """
    cursor = conn.cursor()
    cursor.execute(
        "EXEC sp_RegistrarUsuario @username = ?, @password_hash = ?, @nombre_completo = ?, @rol = ?",
        (username, password_hash, nombre_completo, rol),
    )
    row = cursor.fetchone()
    conn.commit()
    return row[0] if row else 0


def listar_usuarios(
    conn: pyodbc.Connection,
) -> list[dict]:
    """
    Obtiene la lista de todos los usuarios registrados.

    SP invocado: sp_ListarUsuarios
    """
    cursor = conn.cursor()
    cursor.execute("EXEC sp_ListarUsuarios")
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]

def cambiar_estado_usuario(
    conn: pyodbc.Connection,
    id_usuario: int,
    activo: bool,
) -> bool:
    """
    Activa o desactiva un usuario (Soft Delete).

    SP invocado: sp_CambiarEstadoUsuario
    """
    cursor = conn.cursor()
    cursor.execute(
        "EXEC sp_CambiarEstadoUsuario @id_usuario = ?, @activo = ?",
        (id_usuario, 1 if activo else 0),
    )
    conn.commit()
    return True

def cambiar_password_usuario(
    conn: pyodbc.Connection,
    id_usuario: int,
    password_hash: str,
) -> bool:
    """
    Actualiza la contraseña de un usuario mediante su hash.

    SP invocado: sp_CambiarPasswordUsuario
    """
    cursor = conn.cursor()
    cursor.execute(
        "EXEC sp_CambiarPasswordUsuario @id_usuario = ?, @nuevo_password_hash = ?",
        (id_usuario, password_hash),
    )
    conn.commit()
    return True