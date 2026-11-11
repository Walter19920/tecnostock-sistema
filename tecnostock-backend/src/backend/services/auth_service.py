"""
services/auth_service.py
Lógica de negocio para autenticación y gestión de usuarios.

Responsabilidades:
  - Verificar credenciales contra la BD vía auth_repository.
  - Generar token JWT de acceso.
  - Registrar nuevos usuarios (hasheando contraseña).
  - Listar usuarios registrados.
  - Lanzar HTTPException ante credenciales o datos inválidos.
"""
from datetime import datetime, timedelta, timezone

import bcrypt
import pyodbc
from fastapi import HTTPException, status
from jose import jwt

from core.config import get_settings
from core.db import get_connection
from repositories import auth_repository
from schemas.auth import (
    LoginRequest,
    TokenResponse,
    UsuarioCreate,
    UsuarioOut,
    UsuarioResponse,
)

# Configuración JWT
SECRET_KEY = "tecnostock-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 horas


def _hash_password(password: str) -> str:
    """Genera un hash seguro utilizando bcrypt nativo."""
    pwd_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def _verificar_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode("utf-8")
        # El .strip() aquí es vital para limpiar espacios que SQL Server suele añadir
        hash_bytes = hashed_password.strip().encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception as e:
        print(f"Error interno al validar bcrypt: {e}") # <- Esto te dirá qué falla
        return False


def _crear_token(data: dict) -> str:
    """Genera un JWT con expiración."""
    payload = data.copy()
    expira = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expira})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def login(data: LoginRequest) -> TokenResponse:
    """
    Valida credenciales, verifica que el usuario esté activo y retorna un token JWT.
    """
    try:
        conn: pyodbc.Connection = get_connection()
        # CORRECCIÓN: Pasar 'conn' y luego 'data.username'
        usuario = auth_repository.obtener_usuario_por_username(conn, data.username)
        conn.close()
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de conexión a la base de datos: {str(e)}",
        )

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    if not usuario.get("activo", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario se encuentra inactivo. Contacte al administrador.",
        )

    # Comparar contraseña ingresada contra el hash bcrypt guardado
    if not _verificar_password(data.password, usuario.get("password_hash")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    usuario_out = UsuarioOut(
        id_usuario=usuario["id_usuario"],
        username=usuario["username"],
        nombre=usuario.get("nombre") or usuario.get("nombre_completo", ""),
        rol=usuario["rol"],
    )

    token = _crear_token(
        {"sub": str(usuario_out.id_usuario), "rol": usuario_out.rol}
    )

    return TokenResponse(access_token=token, usuario=usuario_out)


def crear_usuario(data: UsuarioCreate) -> UsuarioResponse:
    """
    Registra un nuevo usuario en la base de datos encriptando su contraseña.
    """
    try:
        conn: pyodbc.Connection = get_connection()
        pwd_hash = _hash_password(data.password)
        new_id = auth_repository.registrar_usuario(
            conn,
            username=data.username,
            password_hash=pwd_hash,
            nombre_completo=data.nombre_completo,
            rol=data.rol,
        )
        conn.close()
    except pyodbc.Error as e:
        msg = str(e)
        if "50011" in msg or "ya existe" in msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de usuario ya se encuentra registrado.",
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al registrar el usuario: {msg}",
        )

    return UsuarioResponse(
        id_usuario=new_id,
        username=data.username,
        nombre_completo=data.nombre_completo,
        rol=data.rol,
        activo=True,
        fecha_creacion=datetime.now()
    )


def listar_usuarios() -> list[UsuarioResponse]:
    """
    Obtiene la lista de todos los usuarios registrados.
    """
    try:
        conn: pyodbc.Connection = get_connection()
        usuarios = auth_repository.listar_usuarios(conn)
        conn.close()
        return [UsuarioResponse(**u) for u in usuarios]
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al listar los usuarios: {str(e)}",
        )


def cambiar_estado_usuario(id_usuario: int, activo: bool) -> dict:
    """
    Cambia el estado de un usuario (Activo/Inactivo) llamando al auth_repository.
    """
    try:
        conn: pyodbc.Connection = get_connection()
        auth_repository.cambiar_estado_usuario(conn, id_usuario, activo)
        conn.close()
        return {"mensaje": "Estado de usuario actualizado correctamente"}
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al cambiar el estado del usuario: {str(e)}",
        )


def cambiar_password_usuario(id_usuario: int, nueva_password: str) -> dict:
    """
    Genera el hash SHA-256 de la nueva contraseña y ejecuta sp_CambiarPasswordUsuario.
    """
    try:
        conn: pyodbc.Connection = get_connection()
        pwd_hash = _hash_password(nueva_password)
        auth_repository.cambiar_password_usuario(conn, id_usuario, pwd_hash)
        conn.close()
        return {"mensaje": "Contraseña actualizada exitosamente"}
    except pyodbc.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar la contraseña: {str(e)}",
        )