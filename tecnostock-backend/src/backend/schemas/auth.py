"""
schemas/auth.py
Modelos Pydantic para autenticación y gestión de usuarios.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


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


class UsuarioCreate(BaseModel):
    """Payload para la creación de un nuevo usuario."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)
    nombre_completo: str = Field(..., min_length=3, max_length=100)
    rol: str = Field(default="ALMACENERO", pattern="^(ADMIN|ALMACENERO)$")


class UsuarioResponse(BaseModel):
    """Respuesta detallada de un usuario registrado."""
    id_usuario: int
    username: str
    nombre_completo: str
    rol: str
    activo: bool
    fecha_creacion: Optional[datetime] = None

class CambiarPasswordRequest(BaseModel):
    """Payload para restablecer la contraseña de un usuario."""
    nueva_password: str = Field(..., min_length=6, max_length=100)