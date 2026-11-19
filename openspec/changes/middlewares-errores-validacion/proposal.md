# Proposal

## Why

Actualmente el servidor HTTP cuenta con un esqueleto básico en `src/backend/app.js` y un manejador genérico en `src/backend/middlewares/errorHandler.js`, pero carece de una clase formal de error operacional (`AppError`), mapeo específico de excepciones de base de datos (SQLite3) o errores de sintaxis JSON, validación declarativa de peticiones con `express-validator` y restricción configurable de CORS. 

Esta capa transversal es indispensable para garantizar que cualquier controlador o ruta responda con contratos de error predecibles y seguros según el estándar de desarrollo del proyecto antes de implementar los endpoints de negocio (autenticación, consumo, recordatorios).

## What Changes

- **Creación de `AppError` (`src/backend/utils/AppError.js`)**: Clase personalizada que extiende de `Error` para distinguir errores operacionales controlados de fallos de programación no previstos, incorporando `codigo`, `status = 'error'` y `esOperacional = true`.
- **Evolución de `errorHandler` (`src/backend/middlewares/errorHandler.js`)**: Middleware global de 4 parámetros enriquecido para capturar:
  - Errores operacionales basados en `AppError`.
  - Errores de sintaxis en JSON malformado (`SyntaxError` con código 400).
  - Violaciones de restricciones de SQLite (`SQLITE_CONSTRAINT_UNIQUE` mapeado a `409 Conflict` y `SQLITE_CONSTRAINT_CHECK` mapeado a `400 Bad Request`).
  - Errores no controlados mapeados a `500 Internal Server Error`, ocultando detalles técnicos en producción.
  - Respuestas formateadas bajo el contrato estricto `{ status: "error", codigo: <HTTP>, mensaje: "<texto>" }`.
- **Middleware de validación `validateRequest` (`src/backend/middlewares/validateRequest.js`)**: Utilidad reutilizable basada en `validationResult` de `express-validator` que intercepta fallos de validación en `req` y responde inmediatamente con HTTP `400 Bad Request` en el formato estándar.
- **Configuración de CORS y 404 en `src/backend/app.js`**:
  - Configuración de CORS permitiendo orígenes declarados en la variable de entorno `CORS_ORIGIN` (por defecto `*` en entornos de desarrollo).
  - Manejo de rutas no encontradas (404 Not Found) propagando un `AppError` hacia el `errorHandler`.
  - Aseguramiento de que `errorHandler` sea el último middleware registrado en la cadena de Express.

### Out of Scope (Alcance Excluido)

- Implementación de reglas o esquemas de validación de endpoints específicos (como login o registro); este cambio provee exclusivamente el middleware interceptor reusable.
- Definición de nuevas rutas o controladores de negocio (estos se implementarán en cambios dedicados de autenticación y consumo).
- Almacenamiento o persistencia en base de datos.

## Capabilities

### New Capabilities
- `manejo-errores-validacion`: Proveer el estándar transversal de control de errores operacionales, intercepción de fallos de validación de esquemas y protección perimetral CORS en la API REST.

### Modified Capabilities

*(Ninguna capacidad existente en `openspec/specs/` sufre modificaciones en sus requerimientos vigentes).*

## Impact

- **Código afectado**:
  - `src/backend/utils/AppError.js` (nuevo).
  - `src/backend/middlewares/validateRequest.js` (nuevo).
  - `src/backend/middlewares/errorHandler.js` (actualizado).
  - `src/backend/app.js` (actualizado).
- **Dependencias**:
  - `express-validator` (ya instalada en `package.json`).
  - `cors` (ya instalada en `package.json`).
- **Requerimientos cubiertos**:
  - **RNF-02.2 (Validación de Entradas)**: Sanitización y validación interceptora en Express.
  - **RNF-02.3 (Políticas CORS)**: Delimitación configurable de orígenes que consumen la API.
  - **RF-01.3 (Validaciones y Conflictos)**: Mapeo de códigos 400 Bad Request y 409 Conflict.
  - **Estándar de Desarrollo (Sección 6)**: Estructura uniforme de respuestas de error.
