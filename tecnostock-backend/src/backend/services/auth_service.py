"""
services/auth_service.py
Lógica de negocio para autenticación de usuarios.

Responsabilidades:
  - Verificar credenciales contra la BD vía auth_repository.
  - Generar token JWT de acceso.
  - Lanzar HTTPException 401 ante credenciales inválidas.
"""
import hashlib
from datetime import datetime, timedelta, timezone

import pyodbc
from fastapi import HTTPException, status
from jose import jwt

from core.config import get_settings
from core.db import get_connection
from repositories import auth_repository
from schemas.auth import LoginRequest, TokenResponse, UsuarioOut

# Configuración JWT (en producción mover a .env)
SECRET_KEY = "tecnostock-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 horas


def _hash_password(password: str) -> str:
    """Retorna el hash SHA-256 de la contraseña."""
    return hashlib.sha256(password.encode()).hexdigest()


def _crear_token(data: dict) -> str:
    """Genera un JWT con expiración."""
    payload = data.copy()
    expira = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload.update({"exp": expira})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def login(data: LoginRequest) -> TokenResponse:
    """
    Valida credenciales y retorna un token de acceso JWT.

    Args:
        data: Payload con username y password.

    Returns:
        TokenResponse con access_token y datos del usuario.

    Raises:
        HTTPException 401: Si el usuario no existe o la contraseña es incorrecta.
        HTTPException 500: Si ocurre un error de conexión a SQL Server.
    """
    try:
        conn: pyodbc.Connection = get_connection()
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

    # Comparar contraseñas (asume que el SP retorna el hash almacenado)
    if usuario.get("password_hash") != _hash_password(data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
        )

    usuario_out = UsuarioOut(
        id_usuario=usuario["id_usuario"],
        username=usuario["username"],
        nombre=usuario["nombre"],
        rol=usuario["rol"],
    )

    token = _crear_token(
        {"sub": str(usuario_out.id_usuario), "rol": usuario_out.rol}
    )

    return TokenResponse(access_token=token, usuario=usuario_out)
