# 📦 TecnoStock S.A.C. - Sistema de Gestión de Inventario

Sistema web centralizado para la gestión de inventarios, control de existencias, historial de movimientos  y alertas de stock bajo para la empresa **TecnoStock S.A.C.** 

El proyecto cumple al 100% con los requerimientos académicos: arquitectura por capas en FastAPI, interfaz reactiva en Angular 22 con Signal Forms, base de datos SQL Server gestionada mediante Stored Procedures y Transacciones ACID, y control de versiones profesional con Git.

---

## 🏗️ Estructura Completa del Repositorio y Mapeo con la Rúbrica


Examen Unidad 3-Desarrollo De aplicaciones web/
│
├── 📁 database/                       # Capa de Persistencia Relacional
│   └── script_master.sql              # Script SQL unificado (Tablas, SPs, Transacciones y Seed Data)
│
├── 📁 tecnostock-backend/             # Backend: FastAPI con Arquitectura por Capas
│   ├── 📁 src/backend/
│   │   ├── 📁 apis/                   # Controladores REST / Endpoints (FastAPI Routers)
│   │   ├── 📁 core/                   # Seguridad (bcrypt/JWT), conexión DB y configuración
│   │   ├── 📁 repositories/           # Persistencia pura (Invocación exclusiva a SPs)
│   │   ├── 📁 schemas/                # Validación Pydantic (RN08)
│   │   ├── 📁 services/               # Lógica de Negocio y Reglas del Sistema
│   │   └── main.py                    # Punto de entrada de la API
│   ├── .env                           # Variables de entorno (Credenciales seguras)
│   ├── pyproject.toml                 # Configuración de dependencias con uv
│   ├── requirements.txt               # Lista de librerías Python
│   └── uv.lock                        # Bloqueo de versiones del entorno
│
└── 📁 frontend/                       # Frontend: Angular 22 + Signal Forms
    └── 📁 src/
        ├── 📁 app/
        │   ├── 📁 components/         # Vistas UI (Dashboard, Productos, Categorías, Movimientos, Login)
        │   ├── 📁 guards/             # Protección de rutas por roles (ADMIN/ALMACENERO)
        │   ├── 📁 interceptors/       # Interceptor HTTP para inyección de Token JWT
        │   ├── 📁 interfaces/         # Contratos y tipos TypeScript
        │   ├── 📁 models/             # Modelos de datos del cliente
        │   ├── 📁 services/           # Consumo de API REST vía HttpClient
        │   ├── 📁 utils/              # Helper functions y formateadores visuales
        │   ├── app.config.ts          # Configuración global de providers (HttpClient, Routes)
        │   ├── app.routes.ts          # Enrutamiento de la aplicación SPA
        │   └── app.ts                 # Componente raíz
        ├── 📁 environments/           # Variables de entorno del Frontend
        ├── main.ts                    # Bootstrap de Angular
        └── styles.css                 # Estilos globales / Tailwind
```

---

## 📑 Explicación de Módulos y Relación con la Rúbrica de Evaluación

### 1. Base de Datos (database/)
* **Relación con la Rúbrica:** Criterios de SQL Server, Stored Procedures e Integridad Referencial.
* **Descripción:** Contiene la estructura completa de la BD (`TecnoStockDB`). Las operaciones se ejecutan exclusivamente vía Stored Procedures (`sp_RegistrarProducto`, `sp_RegistrarEntrada`, `sp_RegistrarSalida`, `sp_ObtenerIndicadoresDashboard`, etc.). Las entradas y salidas implementan `BEGIN TRANSACTION` con `UPDLOCK` para garantizar la consistencia ACID del stock (RN05, RN06).

### 2. Backend FastAPI (tecnostock-backend/)
* **Relación con la Rúbrica:** Backend FastAPI, Arquitectura por Capas y Reglas de Negocio.
* **`apis/`**: Define endpoints sin SQL ni lógica directa.
* **`services/`**: Procesa la lógica de negocio antes de invocar el acceso a datos.
* **`repositories/`**: Invoca únicamente Stored Procedures mediante `pyodbc`.
* **`schemas/`**: Pydantic para validaciones estrictas de entradas y tipos (RN01, RN02, RN03, RN08).
* **`core/`**: Manejo de hashes `bcrypt` para contraseñas, tokens JWT y variables de entorno (`.env`).

### 3. Frontend Angular 22 (frontend/)
* **Relación con la Rúbrica:** Frontend Angular, Signal Forms e Interfaz Responsive.
* **`components/`**: Vistas reactivas para Dashboard (RF06), Productos (RF01), Categorías (RF02), Entradas/Salidas (RF03, RF04) y Kardex (RF05).
* **`guards/` & `interceptors/`**: Control de acceso y adjunto automático de headers `Authorization: Bearer <token>`.
* **Signal Forms:** Formularios reactivos con validaciones en tiempo real y mensajes de error.

---

## 🚀 Instrucciones de Instalación y Ejecución

### 1. Base de Datos (SQL Server)
1. Abre **SQL Server Management Studio (SSMS)**.
2. Abre y ejecuta el archivo `database/script_master.sql`.
3. Se creará la base de datos `TecnoStockDB`, sus tablas, procedimientos almacenados y datos de prueba.

---

### 2. Backend (FastAPI)
```
1. Abre la terminal en la carpeta del backend:
   
   cd tecnostock-backend
   ```

2. Configura tu archivo `.env`:
   ```env
   DB_SERVER=localhost
   DB_DATABASE=Nombre de la base de datos
   DB_USER=Nombre de usuario
   DB_PASSWORD=tu_contraseña
   
   ```

3. Sincroniza las dependencias con `uv`:
   ```
   uv sync
   ```

4. **Iniciar el servidor de desarrollo:**

   * **Opción estándar para iniciar la API en modo de desarrollo:**
     ```
     uv run uvicorn main:app --app-dir src/backend
     ```

   * **Opción alternativa para iniciar con python debido a control de aplicaciones de windows:**
     ```
     python -m uvicorn main:app --app-dir src/backend
     ```

   > **Swagger UI disponible en:** `http://127.0.0.1:8000/docs`

---

### 3. Frontend (Angular 22)

1. Abre la terminal en la carpeta del frontend:
   ```
   cd frontend
   ```

2. Instala las dependencias:
   ```
   npm install
   ```

3. **Iniciar el servidor web:**
   ```
   ng serve
   ```

   > **Aplicación disponible en:** `http://localhost:4200`

---

## 🔑 Credenciales de Acceso (Seed Data)

- **Usuario:** `admin`
- **Contraseña:** `admin123`
- **Rol:** `ADMIN`