"""
schemas/auth.py
Modelos Pydantic para autenticación de usuarios.
"""
from pydantic import BaseModel


class LoginRequest(BaseModel):
    """Payload de inicio de sesión."""
    username: str
    password: str


class UsuarioOut(BaseModel):
    """Datos públicos del usuario autenticado."""
    id_usuario: int
    username: str
    nombre: str
    rol: str


class TokenResponse(BaseModel):
    """Respuesta del endpoint de login."""
    access_token: str
    token_type: str = "bearer"
    usuario: UsuarioOut
