"""
core/db.py
Gestión de conexiones a SQL Server mediante pyodbc y ODBC Driver 18.
Sin ORM — las queries se ejecutan exclusivamente via Stored Procedures.
"""
import pyodbc
from core.config import get_settings


def get_connection() -> pyodbc.Connection:
    """
    Crea y retorna una conexión activa a SQL Server.

    La conexión se construye a partir de las variables de entorno cargadas
    en Settings. Usar dentro de un bloque 'with' para cierre automático.

    Returns:
        pyodbc.Connection: Conexión lista para ejecutar Stored Procedures.

    Raises:
        pyodbc.Error: Si no se puede establecer la conexión.
    """
    settings = get_settings()
    connection_string = (
        f"DRIVER={{{settings.DB_DRIVER}}};"
        f"SERVER={settings.DB_SERVER};"
        f"DATABASE={settings.DB_NOMBRE};"
        f"UID={settings.DB_USER};"
        f"PWD={settings.DB_PASSWORD};"
        f"TrustServerCertificate=yes;"
    )
    return pyodbc.connect(connection_string)
