# Design

## Context

Para la motivación del cambio y el contexto del problema, véase [proposal.md](proposal.md).
El proyecto cuenta con la base de datos SQLite inicializada (`agua_recordatorio.db`), el modelo de usuarios (`userModel.js`), el helper criptográfico (`authHelper.js`), el servicio de cálculo de hidratación (`hydrationService.js`), y la capa de middlewares de manejo de errores (`AppError.js`, `errorHandler.js`) y validación (`validateRequest.js`).

Este diseño define la arquitectura y el flujo de ejecución para exponer el endpoint `POST /api/auth/registro`, integrando estas capas sin duplicar lógica ni saltarse las restricciones de seguridad y negocio.

## Goals / Non-Goals

**Goals:**
- Exponer el endpoint público `POST /api/auth/registro` bajo el prefijo `/api/auth`.
- Aplicar validación declarativa con `express-validator` para `nombre`, `correo_electronico`, `contrasena`, `edad`, `peso_kg` y el campo opcional `factor_extra`.
- Interceptar peticiones con datos inválidos con HTTP `400 Bad Request` antes de invocar la lógica del controlador.
- Comprobar la unicidad del correo electrónico emitiendo un `AppError` con HTTP `409 Conflict` cuando ya esté registrado.
- Calcular automáticamente `meta_diaria_ml` invocando `hydrationService.calcularMetaDiaria` (RN-01).
- Generar el hash seguro de la contraseña mediante `authHelper.hashearContrasena` (RF-01.2).
- Guardar el usuario mediante `userModel.crearUsuario` y generar inmediatamente un token JWT con `authHelper.generarToken`.
- Retornar una respuesta exitosa con código HTTP `201 Created` y el formato estandarizado `{ status: "success", mensaje, token, usuario }` sin filtrar hashes de contraseña.
- Conectar `authRoutes` en `app.js` de forma modular y antes del manejador global de rutas 404.

**Non-Goals:**
- Implementar el endpoint `POST /api/auth/login` o renovación de tokens (se planificarán en un cambio específico de login/sesión).
- Implementar el middleware de protección de rutas `authMiddleware.js` (no aplica para rutas públicas de registro).
- Modificar esquemas de tablas DDL o crear migraciones nuevas.

## Decisions

### Decisión 1: Validación declarativa en `authRoutes.js` con `express-validator` y `validateRequest`
- **Elección**: Agrupar las reglas de validación en un arreglo de validadores (`validacionesRegistro`) seguido inmediatamente por el middleware `validateRequest`.
- **Razón**: Separa la verificación sintáctica y de formato del controlador `authController.js`. Si un campo falla (ej. `edad` < 10 o `peso_kg` fuera de rango), `validateRequest` detiene la cadena y emite `{ status: "error", codigo: 400, mensaje }`.
- **Alternativa considerada**: Validar manualmente con sentencias `if` dentro del controlador; descartada por ser propensa a omisiones y acoplar el controlador a detalles del payload HTTP.

### Decisión 2: Verificación de correo en el controlador y salvaguarda en BD
- **Elección**: En `registrarUsuario`, invocar `userModel.obtenerUsuarioPorCorreo(correo_electronico)` y, si existe, lanzar `new AppError('El correo electrónico ya está registrado.', 409)`.
- **Razón**: Permite responder con un mensaje amigable y semánticamente preciso (`409 Conflict`) antes de intentar el `INSERT`. Si llegara a ocurrir una condición de carrera, el `UNIQUE` de SQLite (`SQLITE_CONSTRAINT_UNIQUE`) es capturado por `errorHandler.js` y mapeado igualmente a 409.
- **Alternativa considerada**: Depender únicamente del error de SQLite; descartada para evitar sobrecargar el motor de persistencia y contar con trazabilidad de validación a nivel de dominio.

### Decisión 3: Conversión de tipos y soporte para `factor_extra`
- **Elección**: Asegurar que `edad` se convierta a número entero (`parseInt` o `toInt()`), `peso_kg` a número flotante (`parseFloat` o `toFloat()`) y `factor_extra` a booleano explícito (`Boolean(factor_extra)` con valor por defecto `false`).
- **Razón**: Garantiza que `hydrationService.calcularMetaDiaria` opere con tipos numéricos primitivos y determine con precisión la suma de 500 ml en caso de actividad física o clima extremo.

## Risks / Trade-offs

- **[Riesgo] Exposición accidental de contraseñas**:
  - *Mitigación*: `userModel.crearUsuario` retorna únicamente campos públicos (`id`, `nombre`, `correo_electronico`, `edad`, `peso_kg`, `meta_diaria_ml`, `creado_en`), excluyendo explícitamente `contrasena_hash`. Adicionalmente, el controlador solo transfiere dicho objeto en la clave `usuario`.
- **[Riesgo] Inconsistencias en formato de correo electrónico**:
  - *Mitigación*: Usar `.isEmail()` y `.normalizeEmail()` de `express-validator` para almacenar correos limpios y en minúsculas en SQLite.
- **[Riesgo] Error en orden de middlewares en `app.js`**:
  - *Mitigación*: Registrar `app.use('/api/auth', authRoutes)` inmediatamente después de los middlewares globales de parsing (`express.json()`, `cors`) y estrictamente antes del middleware 404 y `errorHandler`.
