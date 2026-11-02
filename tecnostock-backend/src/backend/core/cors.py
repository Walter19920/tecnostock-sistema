"""
core/cors.py
Configura el middleware CORS de FastAPI con los orígenes definidos en .env.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


def configure_cors(app: FastAPI, origins: list[str]) -> None:
    """
    Aplica CORSMiddleware a la aplicación FastAPI.

    Args:
        app:     Instancia de FastAPI.
        origins: Lista de orígenes permitidos (provenientes de FRONTEND_ORIGINS).
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
