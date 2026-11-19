# Design

## Context

- El repositorio solo tiene documentación (`documentos/`) y el andamiaje de OpenSpec; `src/` no existe.
- `package.json` ya existe porque la CLI de OpenSpec se instaló como `devDependency`; este cambio lo amplía, no lo reemplaza.
- Node 24.22.1 está disponible localmente. `npm.ps1` está bloqueado por la política de ejecución de PowerShell, así que se usan `npm.cmd` / `npx.cmd`.
- Ver `proposal.md` para la motivación y `specs/plataforma-api/spec.md` para los requisitos.

## Goals / Non-Goals

**Goals:**

- Dejar un backend Express ejecutable con `npm run dev` que arranque la base de datos y exponga `GET /api/health-check`.
- Centralizar el acceso a SQLite en un único módulo con API asíncrona y `PRAGMA foreign_keys = ON`.
- Normalizar todas las respuestas de error con `{ status, codigo, mensaje }`.
- Preparar `controllers/`, `models/` y `routes/` para los cambios posteriores sin adelantar su contenido.

**Non-Goals:**

- Crear tablas, seeds o migraciones.
- Endpoints de negocio, JWT, validaciones con express-validator y planificador push.
- Pruebas automatizadas, contenedores y despliegue.

## Decisions

### CommonJS en el backend

Se usa `require`/`module.exports` en lugar de ESM. El estándar de desarrollo solo exige ES6+ en el lenguaje (variables, `async/await`), no módulos ESM, y el SRS fija `node src/backend/app.js` como punto de entrada. CommonJS evita `"type": "module"` y mantiene compatibilidad directa con `sqlite3` y `nodemon`.

- Alternativa descartada: ESM con `import`, que obligaría a extensiones `.js` en cada import relativo y a un `"type": "module"` global sin beneficio para este tamaño de proyecto.

### `sqlite3` con envoltorio de Promesas

El SRS y el pedido fijan `sqlite3` como driver. Como su API es de callbacks, `config/database.js` expone `get`, `all` y `run` que devuelven Promesas para cumplir la regla de `async/await` exclusivo.

- Alternativas descartadas: `better-sqlite3` (API sincrónica, choca con la convención de asincronía) y `node:sqlite` (experimental en Node 24, aún no estable).

### Singleton perezoso con verificación del PRAGMA

`PRAGMA foreign_keys` es una propiedad **por conexión**, no del archivo. Por eso el módulo:

1. Guarda una única promesa de conexión (`promesaConexion`) para que llamadas concurrentes no abran dos handles.
2. Ejecuta `PRAGMA foreign_keys = ON` inmediatamente después de abrir.
3. Lee `PRAGMA foreign_keys` y rechaza el arranque si no devuelve `1`, en lugar de asumir que se aplicó.
4. Configura `busyTimeout` en 5000 ms para tolerar bloqueos de escritura.

`conectar()` se invoca en `app.js` antes de `listen`, de modo que un fallo de base de datos impide arrancar un servidor inútil.

### Rutas de datos

| Elemento | Valor |
| :--- | :--- |
| Archivo | `src/backend/agua_recordatorio.db` (resuelto con `path.resolve(__dirname, '..')`) |
| Variable de entorno | `PORT` (por defecto `3000`) |
| Tablas afectadas | Ninguna en este cambio; solo se abre el archivo |

`agua_recordatorio.db` ya está en `.gitignore`.

### Middleware de errores

`errorHandler.js` exporta `(error, req, res, next)` — Express lo reconoce como manejador de errores por su aridad de 4 argumentos. Toma el código de `error.codigo`, `error.status` o `error.statusCode`; si no existe, usa `500`. El mensaje es `error.mensaje`/`error.message` para errores controlados y un texto genérico para 500.

Para que un 404 desconocido también use el formato estándar, `app.js` registra un middleware final que crea un error con `codigo: 404`.

- Alternativa descartada: un helper `ApiError` en `utils/`. La estructura pedida no incluye `utils/`, así que los errores se construyen con `Object.assign(new Error(mensaje), { codigo })` donde se necesiten.

### CORS

Se aplica `cors()` sobre la app completa. En esta etapa el origen queda abierto (`*`), lo que RNF-02.3 exigirá restringir antes de producción; se anota como deuda para el cambio de endurecimiento.

### Cargas útiles

`express.json()` y `express.urlencoded({ extended: true })` con los límites por defecto, suficientes para los cuerpos del SRS.

## Risks / Trade-offs

- **`sqlite3` requiere binario nativo** → si no hay precompilado para Node 24, la instalación compila con `node-gyp` y necesita Visual Studio Build Tools + Python. Mitigación: intentar la instalación y, si falla, usar Node 22 LTS (binarios publicados) sin cambiar código.
- **`PRAGMA` por conexión** → si más adelante se introduce un pool, cada conexión nueva debe reaplicar el PRAGMA. Mitigación: el helper es el único punto de apertura y ya lo aplica; un pool deberá pasar por el mismo helper.
- **CORS abierto** → cualquier origen puede llamar la API. Mitigación: deuda registrada para el cambio de seguridad; el health-check es de solo lectura.
- **Detalles internos en errores** → se filtran si el manejador devuelve `error.message` de una 500. Mitigación: `errorHandler` solo propaga el mensaje cuando el código es menor a 500 o `NODE_ENV !== 'production'`.
- **Base de datos creada en tiempo de ejecución** → un archivo vacío puede aparecer en el árbol de trabajo. Mitigación: ya está ignorado por Git.

## Migration Plan

1. `npm.cmd install` para resolver las dependencias nuevas.
2. Crear las carpetas y archivos del backend.
3. `npm.cmd run dev` y comprobar `GET /api/health-check`.
4. Revertir: eliminar `src/backend/` y las dependencias añadidas a `package.json`; el archivo `.db` se puede borrar sin pérdida.

## Open Questions

Ninguna que bloquee la implementación. La restricción de orígenes CORS y la creación del esquema se resolverán en cambios posteriores.
