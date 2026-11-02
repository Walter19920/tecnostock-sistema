"""
core/config.py
Carga las variables de entorno desde el archivo .env usando python-dotenv.
"""
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_SERVER: str
    DB_USER: str
    DB_PASSWORD: str
    DB_NOMBRE: str
    FRONTEND_ORIGINS: str  # Orígenes separados por coma, ej: "http://localhost:5173,http://localhost:3000"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Retorna la instancia única de Settings (cacheada)."""
    return Settings()
