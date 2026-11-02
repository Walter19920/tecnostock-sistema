"""
core/security.py
Utilidades de seguridad: decodificación de JWT y dependencia get_current_user.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from core.config import get_settings
from schemas.auth import UsuarioOut

# Debe coincidir con el valor en auth_service.py
SECRET_KEY = "tecnostock-secret-key-change-in-production"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)) -> UsuarioOut:
    """
    Dependencia FastAPI que valida el JWT y retorna el usuario autenticado.

    Args:
        token: Token Bearer extraído del header Authorization.

    Returns:
        UsuarioOut con los datos del usuario autenticado.

    Raises:
        HTTPException 401: Si el token es inválido o expirado.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        id_usuario: str | None = payload.get("sub")
        rol: str | None = payload.get("rol")
        if id_usuario is None or rol is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    # Retornamos un UsuarioOut mínimo con los datos del token
    return UsuarioOut(
        id_usuario=int(id_usuario),
        username="",   # No almacenado en el token; recuperar de BD si es necesario
        nombre="",
        rol=rol,
    )
