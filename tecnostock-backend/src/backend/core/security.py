"""
core/security.py
Utilidades de seguridad: decodificación de JWT y dependencia get_current_user.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

from schemas.auth import UsuarioOut

SECRET_KEY = "tecnostock-secret-key-change-in-production"
ALGORITHM = "HS256"

# Cambiamos a HTTPBearer para pegar el JWT token directamente en Swagger UI
security_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> UsuarioOut:
    """
    Dependencia FastAPI que valida el JWT y retorna el usuario autenticado.
    """
    token = credentials.credentials
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

    return UsuarioOut(
        id_usuario=int(id_usuario),
        username="",
        nombre="",
        rol=rol,
    )