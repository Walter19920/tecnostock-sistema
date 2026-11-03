"""
apis/auth_router.py
Endpoints HTTP para autenticación de usuarios.

Rutas:
    POST /auth/login  → Inicia sesión y retorna JWT.
"""
from typing import Annotated
from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm

from schemas.auth import LoginRequest, TokenResponse
from services import auth_service

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Iniciar sesión",
    description="Valida credenciales y retorna un token de acceso JWT junto con los datos del usuario.",
)
def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> TokenResponse:
    """
    Inicia sesión en TecnoStock procesando el formulario OAuth2 de Swagger UI / cliente.
    """
    login_data = LoginRequest(
        username=form_data.username,
        password=form_data.password
    )
    return auth_service.login(login_data)