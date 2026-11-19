# Design

## Context

Véase `proposal.md` para la motivación general del cambio. La arquitectura del backend en `src/backend/app.js` opera sobre Express y SQLite3. Hasta el momento, el manejador de errores solo capturaba propiedades genéricas sin una jerarquía de clases de error, lo que dificulta diferenciar errores operacionales (como validaciones de cliente, errores de autenticación o conflictos de unicidad) de errores de programación internos. Además, las rutas no disponían de un middleware reutilizable para ejecutar validaciones con `express-validator` antes de que la petición ingrese al controlador.

## Goals / Non-Goals

**Goals:**
- Implementar la clase de error operacional `AppError` con soporte para código HTTP, condición operacional y estado `"error"`.
- Centralizar y robustecer el middleware global de 4 parámetros `errorHandler.js` para mapear:
  - `AppError` operacional.
  - `SyntaxError` de JSON malformado a HTTP `400 Bad Request`.
  - Violaciones de restricciones de SQLite (`SQLITE_CONSTRAINT_UNIQUE` a `409 Conflict`, `SQLITE_CONSTRAINT_CHECK` a `400 Bad Request`).
  - Fallos inesperados a `500 Internal Server Error`, protegiendo la información en producción.
- Proveer el middleware desacoplado `validateRequest.js` para interceptar infracciones de esquemas generados por `express-validator`.
- Configurar el middleware `cors` en `src/backend/app.js` para leer `process.env.CORS_ORIGIN` con valor de respaldo `'*'` para desarrollo.
- Registrar el middleware 404 mediante una instancia de `AppError` y ubicar `errorHandler` al final estricto de la cadena de Express.

**Non-Goals:**
- Implementar validadores concretos para endpoints específicos (como `/api/auth/register`); las reglas de validación específicas residen en cada módulo de rutas.
- Modificar la estructura de base de datos o modelos en `src/backend/models/`.

## Decisions

### Decisión 1: Jerarquía de errores operacionales mediante `AppError` que extiende `Error` nativo
- **Elección**: Crear `src/backend/utils/AppError.js` heredando de `Error.prototype`.
- **Razón**: Permite preservar la captura de traza nativa (`Error.captureStackTrace`) mientras se agregan metadatos obligatorios por el estándar (`this.codigo`, `this.status = 'error'`, `this.esOperacional = true`).
- **Alternativa descartada**: Usar objetos simples `{ codigo, mensaje }` en `next()`; se descartó porque rompe la compatibilidad con el ecosistema de Node.js y la captura de stack trace para depuración.

### Decisión 2: Mapeo de errores SQLite en el middleware central
- **Elección**: Inspeccionar las propiedades `err.code` (`SQLITE_CONSTRAINT_UNIQUE`, `SQLITE_CONSTRAINT_CHECK`, etc.) o `err.message` en `errorHandler.js`.
- **Razón**: Mantiene los controladores y modelos limpios sin necesidad de repetir bloques `try/catch` con lógica específica de SQLite en cada endpoint. Si ocurre una colisión de llave única en `usuarios.correo`, se traduce inmediatamente a un HTTP `409 Conflict` estándar.
- **Alternativa descartada**: Manejar los errores de SQLite dentro de cada controlador; esto genera duplicación de código y riesgo de inconsistencias de formato.

### Decisión 3: Intercepción reusable con `validateRequest`
- **Elección**: Un middleware que invoca `validationResult(req)` de `express-validator`. Si no está vacío, extrae el primer mensaje de error (o concatena) y responde inmediatamente con HTTP 400 y formato estándar:
  ```json
  {
    "status": "error",
    "codigo": 400,
    "mensaje": "<mensaje de error>"
  }
  ```
- **Razón**: Cumple con el estándar de respuesta del proyecto y RNF-02.2 sin acoplar la ejecución al controlador.
- **Alternativa descartada**: Ejecutar `validationResult` dentro de cada función controladora.

### Decisión 4: CORS condicional configurable
- **Elección**: `cors({ origin: process.env.CORS_ORIGIN || '*' })`.
- **Razón**: Permite desacoplar el entorno de producción (donde la PWA puede estar alojada en un dominio específico) del entorno de desarrollo local.

## Endpoints, Tablas y Validaciones Afectadas

- **Endpoints afectados**:
  - `GET /api/health-check`: Pasa a estar protegido con la nueva configuración de CORS.
  - Todas las rutas no registradas: Respondidas mediante 404 capturado por `AppError`.
  - Endpoints futuros (`/api/auth/*`, `/api/consumo/*`, etc.): Utilizarán `validateRequest` y `AppError`.
- **Tablas de base de datos**: No se modifica el esquema físico ni DDL; las tablas existentes (`usuarios`, `configuracion_horarios`, `consumos_agua`, `recordatorios_generados`) se benefician del mapeo automático de restricciones `UNIQUE` y `CHECK`.

## Risks / Trade-offs

- **[Riesgo] Mensajes de validación múltiples de `express-validator`** → *Mitigación*: El middleware `validateRequest` mapeará los mensajes combinándolos de forma clara o priorizando el primer error relevante en el campo `"mensaje"` para no romper el contrato `{ status, codigo, mensaje }`.
- **[Riesgo] Formato de errores de SQLite3 varía según el driver** → *Mitigación*: En `errorHandler`, verificar tanto `err.code` como coincidencias en `err.message` (ej. `UNIQUE constraint failed`).
