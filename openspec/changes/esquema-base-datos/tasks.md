# Tasks

## 1. Módulo de inicialización

- [x] 1.1 Crear `src/backend/config/initDb.js` con la función exportable `inicializarTablas()` y bloques `try/catch/rollback`; verificar con `node -e "console.log(typeof require('./src/backend/config/initDb').inicializarTablas)"` que imprime `function`.
- [x] 1.2 Declarar el arreglo ordenado de sentencias DDL (tablas antes que índices) como constante del módulo; verificar que la longitud y el orden del arreglo sean `usuarios`, `horarios`, `recordatorios`, `consumos`, `subscripciones_push`, índices.

## 2. Tablas

- [x] 2.1 Implementar el `CREATE TABLE IF NOT EXISTS usuarios` con `UNIQUE`, `NOT NULL`, `CHECK` de edad y peso, y `creado_en` por defecto; verificar con `PRAGMA table_info(usuarios)` que aparecen las 8 columnas con sus tipos y el valor por defecto de `creado_en`.
- [x] 2.2 Implementar `horarios` con llave foránea a `usuarios`, `ON DELETE CASCADE`, `CHECK` de intervalo y cantidad positivos y `activo IN (0,1)`; verificar con `PRAGMA foreign_key_list('horarios')` que la acción de borrado es `CASCADE`.
- [x] 2.3 Implementar `recordatorios` con llave foránea, `cantidad_ml` obligatoria y `estado` por defecto `'pendiente'` con `CHECK` de los tres valores; verificar insertando un estado inválido y comprobando el rechazo.
- [x] 2.4 Implementar `consumos` con llave foránea, `CHECK(cantidad_ml > 0)` y `registrado_en` por defecto; verificar que una cantidad en 0 es rechazada y que la marca de tiempo se autogenera.
- [x] 2.5 Implementar `subscripciones_push` con llave foránea y `endpoint`, `p256dh` y `auth` obligatorios; verificar que una inserción sin `endpoint` es rechazada.

## 3. Índices y ejecución segura

- [x] 3.1 Crear los índices `idx_recordatorios_usuario_fecha` e `idx_consumos_usuario_fecha`; verificar con `PRAGMA index_info` que las columnas son `usuario_id` y `fecha`, en ese orden.
- [x] 3.2 Reafirmar `PRAGMA foreign_keys = ON` antes de abrir la transacción, y envolver la creación en `BEGIN`/`COMMIT` con `ROLLBACK` en el `catch`; verificar que una sentencia inválida deja la base sin tablas nuevas.
- [x] 3.3 Ejecutar `inicializarTablas()` dos veces seguidas y verificar que no hay error y que `SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'` sigue devolviendo 5.
- [x] 3.4 Emitir el mensaje de confirmación al finalizar y propagar el error con contexto cuando falle; verificar en consola el mensaje de esquema listo en un arranque exitoso.

## 4. Integración con el arranque

- [x] 4.1 Importar `inicializarTablas` en `src/backend/app.js` y llamarla después de `await conectar()` y antes de `app.listen()`; verificar que el orden de los mensajes de consola muestra el esquema antes que el puerto.
- [x] 4.2 Mantener el manejo de fallo existente para que un error de esquema termine el proceso sin abrir el puerto; verificar con una sentencia forzada a fallar que `npm.cmd start` sale con código 1 y no escucha en `PORT`.

## 5. Verificación de integración

- [x] 5.1 Arrancar con `npm.cmd run dev` y consultar `SELECT name, type FROM sqlite_master WHERE type IN ('table','index')`; verificar las 5 tablas y los 2 índices.
- [x] 5.2 Comprobar que `GET /api/health-check` sigue respondiendo `200` después de crear el esquema y que la integridad referencial rechaza una fila con `usuario_id` inexistente.
- [x] 5.3 Ejecutar `npx.cmd openspec validate --all` y verificar que el cambio nuevo y las seis capacidades existentes pasan sin fallos.

## Workflow follow-up

- Archivar el cambio con `/opsx-archive` tras la revisión del equipo.
- Verificar que `openspec/specs/esquema-base-datos/spec.md` conserva propósito y requisitos tras el archivado.
