# Proposal

## Why

La base de datos existe solo como archivo vacío: no hay tablas, restricciones ni índices, por lo que ningún módulo del SRS puede persistir datos. El esquema DDL ya está definido en `documentos/arquitectura_del_sistema (1).md`, pero nada lo aplica al arrancar la API.

## What Changes

- Crear `src/backend/config/initDb.js` con la función exportable `inicializarTablas()`.
- Crear de forma idempotente las tablas `usuarios`, `horarios`, `recordatorios`, `consumos` y `subscripciones_push` con sus tipos, `CHECK` y llaves foráneas `ON DELETE CASCADE`.
- Crear los índices `idx_recordatorios_usuario_fecha` e `idx_consumos_usuario_fecha`.
- Ejecutar la creación dentro de una transacción, en orden (usuarios antes que las tablas dependientes), y abortar con un error claro si alguna sentencia falla.
- Invocar `inicializarTablas()` desde `src/backend/app.js` después de conectar y antes de `app.listen()`.
- Registrar en consola un mensaje que confirme que el esquema está listo.

## Capabilities

### New Capabilities

- `esquema-base-datos`: creación idempotente del esquema SQLite, restricciones de integridad, índices de consulta y garantía de que el servidor no acepta peticiones hasta que el esquema esté aplicado.

### Modified Capabilities

Ninguna. Los requisitos funcionales existentes no cambian: `autenticacion`, `hidratacion`, `recordatorios`, `consumo`, `notificaciones` e `interfaz-pwa` describen comportamiento de la API y este cambio solo habilita su persistencia. La capacidad `plataforma-api` mantiene su contrato de arranque; la espera por el esquema se especifica dentro de la capacidad nueva.

## Impact

- **Código nuevo:** `src/backend/config/initDb.js`.
- **Código modificado:** `src/backend/app.js` (llamada a la inicialización antes de `listen`).
- **Base de datos:** se crean cinco tablas y dos índices en `src/backend/agua_recordatorio.db`. El archivo ya está ignorado por Git.
- **API:** sin endpoints nuevos ni cambios en las respuestas existentes; solo cambia el momento en que el puerto empieza a aceptar peticiones.
- **Datos:** el esquema nace vacío, sin seeds ni usuarios de prueba.
- **Riesgo:** un `CREATE TABLE` inválido impediría arrancar la API; se mitiga abortando el proceso con un mensaje explícito en lugar de servir una base incompleta.

## Out of Scope

- Migraciones incrementales (`ALTER TABLE`), versionado de esquema y rollback de cambios de estructura.
- Seeds, datos de demostración y usuarios iniciales.
- Modelos, controladores y endpoints que consumen estas tablas.
- Restricciones adicionales no incluidas en el DDL aprobado (por ejemplo, unicidad de `subscripciones_push.endpoint` o formato de hora validado en la base).
