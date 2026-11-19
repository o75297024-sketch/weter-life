# Tasks

## 1. Utilidades y Clases de Error (Backend)

- [x] 1.1 Crear la clase `AppError` en `src/backend/utils/AppError.js` que extienda de `Error`, inicializando `codigo`, `status = 'error'` y `esOperacional = true` con comentarios JSDoc en español.
- [x] 1.2 Añadir validaciones defensivas en el constructor de `AppError` para asignar código 500 por defecto cuando el parámetro no sea un código de estado válido.

## 2. Middleware Global de Manejo de Errores (Backend)

- [x] 2.1 Actualizar `src/backend/middlewares/errorHandler.js` para capturar instancias de `AppError`, errores de sintaxis JSON (`SyntaxError` de `express.json()`) y mapear restricciones SQLite (`SQLITE_CONSTRAINT_UNIQUE` a 409 y `SQLITE_CONSTRAINT_CHECK` a 400).
- [x] 2.2 Incorporar la política de seguridad para respuestas 500 ocultando detalles técnicos o trazas internas cuando `NODE_ENV === 'production'`.
- [x] 2.3 Asegurar que todas las ramas de error retornen estrictamente la estructura JSON `{ status: "error", codigo: <HTTP>, mensaje: "<texto>" }`.

## 3. Middleware de Validación de Esquemas (Backend)

- [x] 3.1 Implementar `src/backend/middlewares/validateRequest.js` consumiendo `validationResult` de la librería `express-validator`.
- [x] 3.2 Formatear los errores de validación interceptados para responder inmediatamente con código HTTP 400 y el primer mensaje relevante o concatenado en el formato estándar.
- [x] 3.3 Permitir el paso transparente mediante `next()` cuando no existan infracciones de validación.

## 4. Configuración de Seguridad y Servidor en app.js (Backend)

- [x] 4.1 Configurar el middleware `cors` en `src/backend/app.js` leyendo `process.env.CORS_ORIGIN` con valor de respaldo `'*'` para desarrollo local.
- [x] 4.2 Actualizar el middleware de captura de rutas no encontradas (404) para instanciar y propagar `AppError` hacia el `errorHandler`.
- [x] 4.3 Verificar el orden de middlewares en `src/backend/app.js`, garantizando que `errorHandler` sea el último middleware registrado.

## 5. Verificación y Validación de la Propuesta

- [x] 5.1 Verificar el correcto arranque del servidor y respuesta consistente de errores (404 y salud) mediante pruebas HTTP.
- [x] 5.2 Ejecutar `npx openspec validate --all` para validar la coherencia y conformidad de todos los cambios y especificaciones del proyecto.
