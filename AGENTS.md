# AGENTS.md — TecnoStock S.A.C.

Tres piezas independientes, sin monorepo ni tooling compartido (cada una con su propio gestor de paquetes):

- `frontend/` — Angular 22 + npm. **Su reglamento propio es `frontend/AGENTS.md`: obligatorio para trabajar aquí** (scope exclusivo a `frontend/`, prohibido ejecutar `ng test`/`ng lint` automáticamente, evitar lecturas masivas del workspace).
- `tecnostock-backend/` — FastAPI + pyodbc + uv. **Sus reglas propias están en `tecnostock-backend/AGENTS.md`** (resumen abajo).
- `database/script_tecnostock.sql` — único archivo de esquema SQL Server: elimina/crea la BD, tablas, procedimientos `sp_*` y datos semilla. **Es destructivo (`DROP TABLE IF EXISTS`): re-ejecutarlo borra los datos.**

No hay CI, ni lint/typecheck en la raíz, ni `opencode.json`.

## Backend — lo esencial (detalle en `tecnostock-backend/AGENTS.md`)

- Capas: `main.py → apis → services → repositories` (+ `schemas/`, `core/`). Persistencia **solo** vía procedimientos almacenados `sp_*`; SQL directo y nombres de tablas prohibidos en todo el backend.
- Arranque (siempre desde `tecnostock-backend/`; `.env` se resuelve respecto al CWD):
  ```bash
  uv sync
  uv run uvicorn main:app --app-dir src/backend   # :8000 · docs en /docs · health en GET /
  ```
  - `--app-dir src/backend` es obligatorio: los imports son absolutos desde esa raíz (`from core...`, `from apis...`).
  - NO usar `uv run tecnostock-backend`: es el stub del scaffold uv (`src/tecnostock_backend/`), no la API.
  - Requiere ODBC Driver 18 for SQL Server instalado y la BD ya creada con el script de `database/` para que los endpoints de datos funcionen (el health responde sin BD).
- `.env` requerido en `tecnostock-backend/` (`DB_SERVER`, `DB_USER`, `DB_PASSWORD`, `DB_NOMBRE`, `FRONTEND_ORIGINS`); sin él la app falla al importar. **Discrepancia verificada: `tecnostock-backend/AGENTS.md` afirma que `.env` está en `.gitignore`, pero está trackeado en git y NO ignorado — nunca meter ahí secretos reales.**
- `POST /auth/login` espera **form-urlencoded** (OAuth2), no JSON. Contraseñas: SHA-256 hex con `hashlib` (bcrypt/passlib están declarados pero sin usar). `SECRET_KEY` está hardcodeada en `core/security.py` **y** en `services/auth_service.py`: cambiar una sin la otra rompe la validación JWT.
- Solo `/movimientos/*` exigen Bearer (`get_current_user`); el resto de endpoints está abierto.
- Sin tests ni pytest en el backend: la verificación es levantar el servidor y golpear los endpoints (Swagger en `/docs`).
- Dependencias: fuente de verdad = `uv.lock`/`pyproject.toml` (`uv sync`). `requirements.txt` es un snapshot pip desactualizado. `sqlalchemy` está declarado pero no se usa (sin ORM).

## Frontend — lo esencial (detalle en `frontend/AGENTS.md`)

- Seguir `frontend/AGENTS.md`: Standalone Components + `inject()` + Signals, Bootstrap 5 por CDN, API base `http://localhost:8000`, convención de nombres `*.interface.ts` / `*.service.ts` / `*.component.ts` (los archivos generados por el CLI aún no la usan — aplicarla a los archivos nuevos), y **no ejecutar `ng test`/`ng lint` automáticamente**.
- Comandos (desde `frontend/`):
  - `npm install`
  - `npm start` → dev server en :4200
  - `npm run build` → `dist/`; presupuestos de producción: JS inicial ≤1MB (error) y **CSS por componente ≤8kB (error)**
  - Tests solo si es imprescindible: `npx ng test --watch=false` (Vitest + jsdom; **en TTY el watch está activo por defecto y el comando no termina**). Un archivo: `npx ng test --watch=false --include src/app/app.spec.ts`; por nombre: `--filter <regex>`. Los specs usan globals de Vitest (`describe`/`it`/`expect` sin import).
- No hay script de lint ni ESLint. Prettier sí está configurado (`.prettierrc`: 100 columnas, comillas simples, parser `angular` para HTML) pero **no está enforceado**: no hay script `format` y `npx prettier --check "src/**"` falla hoy en 8 archivos → formatear solo los archivos que se toquen (`npx prettier --write <archivos>`).
- La capa HTTP aún no existe: `app.config.ts` no tiene `provideHttpClient()`, no hay environments y los services son stubs. La primera integración real debe añadir el provider y usar la base URL de arriba.

## Git

- Historial: ramas `feature/*` fusionadas a `main` mediante PR (`feature/database`, `feature/backend-fastapi`, `feature/frontend`).
