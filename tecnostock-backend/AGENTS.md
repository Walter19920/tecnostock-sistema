# AGENTS.md — Guía de Arquitectura Backend TecnoStock S.A.C.

## Flujo de capas
main.py → apis → services → repositories

Carpetas de soporte: schemas/, core/

## Base de datos
- Motor       : SQL Server
- Driver      : ODBC Driver 18 for SQL Server
- Librería    : pyodbc (sin ORM)

## Reglas de persistencia (OBLIGATORIAS)
- Toda operación de base de datos se realiza EXCLUSIVAMENTE a través de
  Procedimientos Almacenados (prefijo sp_...).
- PROHIBIDO escribir SQL directo contra tablas (SELECT, INSERT, UPDATE, DELETE).
- PROHIBIDO exponer nombres de tablas en ninguna capa del backend.

## Variables de entorno
Cargadas desde archivo .env mediante python-dotenv.
El archivo .env NO se sube al repositorio (incluido en .gitignore).

Variables requeridas:
  DB_SERVER          Nombre o IP del servidor SQL Server
  DB_USER            Usuario de base de datos
  DB_PASSWORD        Contraseña de base de datos
  DB_NOMBRE          Nombre de la base de datos
  FRONTEND_ORIGINS   Orígenes permitidos por CORS (separados por coma)

## Convenciones de código
- Python 3.12 + FastAPI
- Schemas de entrada/salida: Pydantic v2
- Paginación estándar: { items, pagina, tamanio_pagina, total_registros, total_paginas }
- total_paginas se calcula en la capa de services, nunca en el repositorio
- Manejo de errores SQL Server centralizado en services
