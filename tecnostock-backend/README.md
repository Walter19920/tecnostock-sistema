# TecnoStock Backend API

API REST desarrollada en **FastAPI** para el control centralizado de inventarios, gestión de productos, categorías, movimientos de entrada/salida e indicadores de dashboard para **TecnoStock S.A.C.**

El proyecto implementa una **arquitectura por capas** y delega toda la persistencia de datos a **Stored Procedures en SQL Server**, garantizando transaccionalidad e integridad referencial.

---

## Arquitectura del Proyecto (Capas)

La aplicación sigue una separación estricta de responsabilidades:


src/backend/
├── apis/          # Controladores API (Routers/Endpoints REST)
├── services/      # Lógica de negocio, validaciones y mapeos
├── repositories/  # Acceso a datos exclusivo mediante Stored Procedures
├── schemas/       # Modelos Pydantic de entrada/salida (DTOs)
└── core/          # Configuración de base de datos, CORS y seguridad

Requisitos Previos
Python 3.10+

uv (Administrador rápido de entornos y paquetes de Python)

Microsoft SQL Server (con ODBC Driver 17 o 18 for SQL Server)


Instalar dependencias con uv

  Ejecuta el siguiente comando para sincronizar el entorno virtual e instalar todas las librerías necesarias
  uv sync


Para iniciar la API en modo de desarrollo

uv run uvicorn main:app --app-dir src/backend


Credenciales de Prueba

Rol	           Username	  Contraseña
Administrador	admin	  admin123




Pruebas de Endpoints Principales

POST /auth/login - Autenticación de usuario.

GET /indicadores/dashboard - KPIs del Dashboard.

GET /indicadores/stock-bajo - Productos con stock crítico.

GET /movimientos/ - Historial paginado de movimientos.

POST /movimientos/entrada - Registro de entrada de inventario.

POST /movimientos/salida - Registro de salida de inventario.