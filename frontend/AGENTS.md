# AGENTS.md - Frontend TecnoStock S.A.C.

## 1. Contexto y Tecnologías
- **Framework:** Angular 22 (Standalone Components, Signals, RxJS).
- **Estilos:** Bootstrap 5 y Bootstrap Icons vía CDN (`src/index.html`).
- **Base URL API:** `http://localhost:8000`
- **Ámbito:** Edición y modificación **EXCLUSIVA** dentro de la carpeta `frontend/`. Se autoriza la **LECTURA** de la carpeta `backend/` únicamente para verificar las rutas de FastAPI, controladores y nombres de campos DTO. Queda **ESTRICTAMENTE PROHIBIDO** crear, editar o borrar archivos fuera de `frontend/`.

## 2. Estructura de Proyecto Obligatoria (`src/app/`)
- `interfaces/`: Mapeo DTOs y tipos de datos TypeScript (`*.interface.ts`).
- `services/`: Servicios HTTP mediante `HttpClient` (`*.service.ts`).
- `components/`: Componentes Standalone (`*.component.ts`).
- `interceptors/`: Interceptores HTTP (`*.interceptor.ts`).

## 3. Reglas de Desarrollo
- Utilizar **Standalone Components** (`standalone: true`). No usar `NgModules`.
- Inyección de dependencias mediante `inject()` en lugar de constructores.
- Estado reactivo gestionado con **Signals** (`signal()`).
- Formularios interactivos con validación visual usando clases de Bootstrap (`is-invalid`, `invalid-feedback`).
- Componentes 100% responsivos usando clases utilitarias de Bootstrap 5 (`card`, `table-responsive`, `badge`, `modal`).
- Autenticación: Adjuntar el token JWT almacenado en `localStorage` mediante un interceptor HTTP (`Authorization: Bearer <token>`).

## 4. Restricciones para el Agente
- **Cero escritura en Backend:** Queda estrictamente prohibido modificar, crear o eliminar cualquier archivo dentro del directorio `backend/` o fuera de `frontend/`.
- **Sin ejecuciones automáticas:** No ejecutar comandos de prueba o linters como `ng test` o `ng lint`.