"""
apis/auth_router.py
Endpoints HTTP para autenticación y gestión de usuarios.

Rutas:
    POST /auth/login     → Inicia sesión y retorna JWT.
    POST /auth/usuarios  → Registra un nuevo usuario.
    GET  /auth/usuarios  → Lista todos los usuarios registrados.
"""
from typing import Annotated
from fastapi import APIRouter, Depends, status
from fastapi.security import OAuth2PasswordRequestForm

from schemas.auth import LoginRequest, TokenResponse, UsuarioCreate, UsuarioResponse,CambiarPasswordRequest
from services import auth_service

router = APIRouter(prefix="/auth", tags=["Autenticación y Usuarios"])


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


@router.post(
    "/usuarios",
    response_model=UsuarioResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrar usuario",
    description="Crea un nuevo usuario en la base de datos ejecutando sp_RegistrarUsuario.",
)
def registrar_usuario(
    usuario_data: UsuarioCreate
) -> UsuarioResponse:
    """
    Registra un nuevo usuario en la base de datos encriptando su contraseña.
    """
    return auth_service.crear_usuario(usuario_data)


@router.get(
    "/usuarios",
    response_model=list[UsuarioResponse],
    summary="Listar usuarios",
    description="Obtiene la lista completa de usuarios registrados mediante sp_ListarUsuarios.",
)
def listar_usuarios() -> list[UsuarioResponse]:
    """
    Retorna todos los usuarios registrados en el sistema.
    """
    return auth_service.listar_usuarios()

@router.patch(
    "/usuarios/{id_usuario}/estado",
    summary="Cambiar estado de usuario",
    description="Activa o desactiva un usuario (Soft Delete) ejecutando sp_CambiarEstadoUsuario.",
)
def cambiar_estado_usuario(id_usuario: int, activo: bool) -> dict:
    """
    Actualiza el estado de la cuenta (activo/inactivo) de un usuario.
    """
    return auth_service.cambiar_estado_usuario(id_usuario, activo)

@router.patch(
    "/usuarios/{id_usuario}/password",
    summary="Restablecer contraseña de usuario",
    description="Actualiza la contraseña de un usuario ejecutando sp_CambiarPasswordUsuario.",
)
def cambiar_password_usuario(id_usuario: int, body: CambiarPasswordRequest) -> dict:
    """
    Restablece la contraseña de un usuario desde la administración.
    """
    return auth_service.cambiar_password_usuario(id_usuario, body.nueva_password)