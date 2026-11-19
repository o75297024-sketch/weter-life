# Tasks

## 1. Dependencias y estructura

- [x] 1.1 Agregar a `package.json` las dependencias `express`, `sqlite3`, `dotenv`, `cors`, `bcryptjs`, `jsonwebtoken`, `express-validator` y la devDependency `nodemon`, conservando los scripts de OpenSpec; verificar con `npm.cmd run` que la lista de scripts incluye `os:list`, `os:validate`, `os:view` y `os:update`.
- [x] 1.2 Definir los scripts `start` y `dev` apuntando a `src/backend/app.js`; verificar que `npm.cmd pkg get scripts.start scripts.dev` devuelve los dos comandos.
- [x] 1.3 Ejecutar `npm.cmd install`; verificar que termina sin errores y que `node -e "require('sqlite3')"` carga el módulo nativo.
- [x] 1.4 Crear `src/backend/config/`, `controllers/`, `middlewares/`, `models/`, `routes/` con marcadores `.gitkeep`; verificar que `Get-ChildItem -Recurse src/backend -Directory` muestra las cinco carpetas.
- [x] 1.5 Crear `.env.example` con `PORT=3000` y documentar en el README la variable; verificar que el archivo existe y que `dotenv` puede cargarlo.

## 2. Capa de base de datos

- [x] 2.1 Implementar `src/backend/config/database.js` con la conexión singleton y la resolución de la ruta a `src/backend/agua_recordatorio.db`; verificar con `node -e "require('./src/backend/config/database').conectar().then(() => console.log('ok'))"` que imprime `ok`.
- [x] 2.2 Aplicar y verificar `PRAGMA foreign_keys = ON` al abrir la conexión, rechazando el arranque si la lectura devuelve un valor distinto de 1; verificar con `node -e` que `PRAGMA foreign_keys` responde `1`.
- [x] 2.3 Implementar los helpers `get`, `all` y `run` basados en Promesas con parámetros enlazados; verificar que `all('SELECT 1 AS valor')` resuelve un arreglo y que una sentencia inválida rechaza la Promesa.
- [x] 2.4 Implementar el cierre ordenado de la conexión (`cerrar`) y su manejo de errores; verificar que tras `conectar()` y `cerrar()` un nuevo `conectar()` vuelve a abrir el archivo.

## 3. Manejo de errores

- [x] 3.1 Implementar `src/backend/middlewares/errorHandler.js` con el formato `{ status, codigo, mensaje }` y soporte para `codigo`/`status`/`statusCode` del error; verificar con un script que una llamada simulada devuelve el JSON esperado.
- [x] 3.2 Ocultar los detalles internos en errores 500 fuera de desarrollo; verificar que el cuerpo no contiene `stack` ni rutas absolutas con `NODE_ENV=production`.
- [x] 3.3 Registrar en `app.js` un middleware final de ruta desconocida que produzca un 404 con el formato estándar; verificar con `curl` a una ruta inexistente.

## 4. Servidor

- [x] 4.1 Implementar `src/backend/app.js` con `express.json()`, `express.urlencoded()`, `cors()` y la carga de `.env`; verificar que una petición con cuerpo JSON y otra con `urlencoded` llegan al manejador con el objeto parseado.
- [x] 4.2 Conectar la base de datos antes de `listen` y leer `PORT` del entorno con 3000 por defecto; verificar que el log de arranque indica el puerto y la base de datos conectada.
- [x] 4.3 Implementar `GET /api/health-check` con la respuesta `{ status: "ok", message: "API AguaRecordatorio en funcionamiento" }`; verificar con `curl` que responde `200` y el cuerpo exacto.
- [x] 4.4 Integrar `errorHandler` y el middleware 404 al final de la cadena; verificar que un error lanzado en una ruta de prueba devuelve `500` con el formato estándar.

## 5. Verificación de integración

- [x] 5.1 Arrancar con `npm.cmd run dev` y comprobar en un segundo proceso que `GET /api/health-check` responde `200`; verificar también que el reinicio automático de `nodemon` ocurre al guardar un archivo.
- [x] 5.2 Revisar manualmente `GET /api/health-check`, una ruta inexistente y una ruta con error forzado; verificar los tres cuerpos de respuesta contra `specs/plataforma-api/spec.md`.
- [x] 5.3 Ejecutar `npx.cmd openspec validate --all` y verificar que el cambio y las seis capacidades existentes pasan sin fallos.

## Workflow follow-up

- Archivar el cambio con `/opsx-archive` una vez revisado por el equipo; los requisitos de `plataforma-api` pasarán a `openspec/specs/`.
- Verificar que `openspec/specs/plataforma-api/spec.md` contiene el propósito y los requisitos tras el archivado.
