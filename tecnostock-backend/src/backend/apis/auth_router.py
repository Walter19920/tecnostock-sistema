"""
apis/auth_router.py
Endpoints HTTP para autenticación de usuarios.

Rutas:
  POST /auth/login  → Inicia sesión y retorna JWT.
"""
from fastapi import APIRouter

from schemas.auth import LoginRequest, TokenResponse
from services import auth_service

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Iniciar sesión",
    description="Valida credenciales y retorna un token de acceso JWT junto con los datos del usuario.",
)
def login(data: LoginRequest) -> TokenResponse:
    """
    Inicia sesión en TecnoStock.

    Args:
        data: LoginRequest con username y password.

    Returns:
        TokenResponse con access_token y datos del usuario autenticado.
    """
    return auth_service.login(data)
