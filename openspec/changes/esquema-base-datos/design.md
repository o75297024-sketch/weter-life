# Design

## Context

- `src/backend/config/database.js` ya expone una conexión singleton con `run`, `get` y `all` basados en Promesas, y aplica `PRAGMA foreign_keys = ON` al abrir con verificación posterior.
- `src/backend/app.js` conecta la base de datos dentro de `iniciar()` y recién después llama a `app.listen()`.
- `src/backend/agua_recordatorio.db` existe, pero sin tablas.
- El DDL aprobado está en `documentos/arquitectura_del_sistema (1).md`, sección 2.2.
- Ver `proposal.md` para la motivación y `specs/esquema-base-datos/spec.md` para los requisitos.

## Goals / Non-Goals

**Goals:**

- Aplicar el DDL aprobado de forma idempotente y atómica al arrancar.
- Mantener el esquema en un módulo aislado, reutilizable por pruebas y scripts.
- Garantizar que el puerto no se abra con un esquema incompleto.

**Non-Goals:**

- Versionado de esquema, migraciones incrementales y `ALTER TABLE`.
- Seeds o datos iniciales.
- Validaciones de formato de fecha/hora dentro de SQLite.

## Decisions

### Archivo separado `config/initDb.js`

Se crea un módulo propio con `inicializarTablas()` en lugar de ampliar `database.js`. Así el módulo de conexión sigue teniendo una sola responsabilidad y las pruebas pueden abrir una conexión sin crear tablas.

- Alternativa descartada: integrar la función en `database.js`, que mezclaría ciclo de vida de la conexión con el esquema y obligaría a crear tablas en cualquier importación.

### Sentencias en orden, en un solo lugar

El DDL se declara como un arreglo ordenado: primero `usuarios`, luego las cuatro tablas dependientes, y al final los índices. Aunque SQLite admite referencias a tablas creadas después, el orden explícito hace legible la dependencia y facilita leer los errores.

```text
usuarios -> horarios -> recordatorios -> consumos -> subscripciones_push -> índices
```

### Transacción explícita

La inicialización ejecuta `BEGIN`, recorre las sentencias y termina con `COMMIT`; cualquier error dispara `ROLLBACK` y se propaga. SQLite trata el DDL como transaccional, así que un fallo a mitad de camino no deja tablas parciales.

- Alternativa descartada: ejecutar sentencia por sentencia sin transacción. Dejaría un esquema a medias y obligaría a limpiar manualmente el archivo.

### `PRAGMA foreign_keys` fuera de la transacción

`PRAGMA foreign_keys` no tiene efecto dentro de una transacción, por eso `inicializarTablas()` lo vuelve a aplicar **antes** del `BEGIN` y verifica su valor. La conexión ya lo activa, pero repetirlo protege el caso de un módulo que abra conexiones propias en el futuro.

### Idempotencia con `IF NOT EXISTS`

Se usan `CREATE TABLE IF NOT EXISTS` y `CREATE INDEX IF NOT EXISTS`, tal como exige el DDL. No se introduce `PRAGMA user_version` en este cambio: sin migraciones reales sería un marcador sin uso. Cuando exista una modificación de columnas, ese será el momento de agregar versionado.

### Ubicación de la invocación

`app.js` ejecuta, en este orden y dentro del `try/catch` existente:

1. `await conectar()`
2. `await inicializarTablas()`
3. `app.listen(...)`

Si cualquiera falla, el `catch` registra el mensaje y ejecuta `process.exit(1)`, por lo que el puerto nunca queda a la escucha. El mensaje de confirmación de esquema se emite dentro de `inicializarTablas()`; el de escucha sigue en el callback de `listen`.

### Mensaje en consola

`inicializarTablas()` imprime `Esquema de base de datos verificado: 5 tablas y 2 índices listos.` Sin detalles de cada `CREATE`, que serían ruido en cada arranque.

## Risks / Trade-offs

- **Conflicto de rangos de edad:** el DDL permite `edad` entre 5 y 120, mientras que `autenticacion` exige 10 a 120 en la API. El `CHECK` es más permisivo, así que no se viola ningún requisito; la validación estricta queda en el endpoint. Se documenta para no "corregir" el DDL por error.
- **`recordatorios.cantidad_ml` sin `CHECK`:** el DDL aprobado no restringe el valor. Se respeta literalmente; agregar `CHECK(cantidad_ml > 0)` requiere un cambio de esquema posterior.
- **Sin migraciones:** un cambio futuro de columnas necesitará `ALTER TABLE` o recreación de tablas. Mitigación: registrar la deuda en el próximo cambio y, mientras el proyecto no tenga datos reales, borrar el archivo `.db`.
- **Bloqueo del archivo:** si otro proceso mantiene la base bloqueada, `BEGIN` puede esperar hasta 5 s (`busyTimeout`) y fallar. Mitigación: el arranque aborta con mensaje claro en lugar de servir una API sin esquema.
- **Mensaje en cada arranque:** imprime confirmación incluso cuando no creó nada. Es intencional: informa que el esquema está verificado.
- **`subscripciones_push.endpoint` sin unicidad:** el mismo dispositivo puede registrarse dos veces. Se mantiene el DDL aprobado y se anota como deuda del módulo de notificaciones.

## Migration Plan

1. Implementar `initDb.js` y actualizar `app.js`.
2. Arrancar con `npm.cmd run dev`: el esquema se aplica sobre el archivo existente y vacío.
3. Verificar con `SELECT name, type FROM sqlite_master WHERE type IN ('table','index')` que aparecen las cinco tablas y los dos índices.
4. Revertir: eliminar `initDb.js`, quitar la llamada de `app.js` y borrar `agua_recordatorio.db` si se desea partir de cero.

## Open Questions

Ninguna que afecte el alcance: el versionado de esquema y las restricciones adicionales quedan explícitamente fuera y se decidirán cuando existan datos que migrar.
