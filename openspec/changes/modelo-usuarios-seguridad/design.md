# Design

## Context

Véase `proposal.md` para la motivación general del cambio. El esquema de base de datos (`initDb.js`) ya define la tabla `usuarios` con restricciones de unicidad (`correo_electronico`), rangos de edad (`CHECK(edad BETWEEN 5 AND 120)`), peso (`CHECK(peso_kg BETWEEN 20.0 AND 300.0)`) y columna `contrasena_hash`.

Para que los controladores de registro, autenticación y perfil puedan operar de forma limpia y desacoplada, se requiere implementar `src/backend/utils/authHelper.js` y `src/backend/models/userModel.js`, asegurando que el manejo criptográfico y las consultas a SQLite cumplan estrictamente con las convenciones del proyecto: sentencias preparadas (`?`), uso de `async/await`, factor de costo bcrypt 10 y firma/verificación segura de JWT.

## Goals / Non-Goals

**Goals:**
- Implementar `authHelper.js` con funciones criptográficas puras/asíncronas para hashing con `bcryptjs` (`SALT_ROUNDS = 10`), comparación segura y firma/verificación de tokens JWT (`jsonwebtoken`) con expiración de 24 horas y emisión de `AppError` 401 en fallos.
- Implementar `userModel.js` encapsulando la interacción con SQLite3 (`src/backend/config/database.js`):
  - Inserción parametrizada con retorno del registro creado sin `contrasena_hash`.
  - Búsqueda por correo para autenticación (incluyendo `contrasena_hash`).
  - Búsqueda por ID para perfil público (excluyendo `contrasena_hash`).
  - Actualización de `meta_diaria_ml` con reporte de filas modificadas.
- Asegurar el cumplimiento de las convenciones de nomenclatura (`camelCase` en funciones y variables, `UPPER_SNAKE_CASE` en constantes, `snake_case` en columnas SQL).

**Non-Goals:**
- Crear rutas HTTP o middlewares de verificación de sesión (se gestionarán en el cambio de endpoints de autenticación).
- Modificar el DDL o esquema físico de la tabla `usuarios`.

## Decisions

### Decisión 1: Configuración de costo de hashing y clave secreta
- **Elección**: Definir `const SALT_ROUNDS = 10;`, `const JWT_EXPIRES_IN = '24h';` y `const JWT_SECRET = process.env.JWT_SECRET || 'agua_recordatorio_jwt_dev_secret_key_2026';`.
- **Razón**: `SALT_ROUNDS = 10` cumple el requerimiento explícito del SRS (RF-01.2) que exige un factor de costo mínimo de 10. Proveer un secreto de respaldo en desarrollo permite levantar pruebas locales sin obligar a la configuración manual de `.env`, mientras que en producción se debe inyectar la variable de entorno.

### Decisión 2: Lanzamiento de `AppError` (401) en `verificarToken`
- **Elección**: Al interceptar `JsonWebTokenError` o `TokenExpiredError`, `verificarToken` lanza `new AppError('Token de autenticación inválido o expirado.', 401)`.
- **Razón**: Se integra directamente con la capa transversal de errores implementada en `errorHandler.js`, asegurando que cualquier token defectuoso o vencido resulte automáticamente en una respuesta uniforme `{ status: 'error', codigo: 401, mensaje: ... }`.
- **Alternativa descartada**: Retornar `null` y delegar el lanzamiento del error a cada middleware; se descartó para evitar duplicidad de comprobaciones.

### Decisión 3: Separación estricta entre consultas públicas y de autenticación en `userModel`
- **Elección**:
  - `crearUsuario`: Ejecuta `run()` con sentencia preparada y luego consulta `obtenerUsuarioPorId(lastID)` para devolver el usuario recién creado sin `contrasena_hash`.
  - `obtenerUsuarioPorId`: Ejecuta `SELECT id, nombre, correo_electronico, edad, peso_kg, meta_diaria_ml, creado_en FROM usuarios WHERE id = ?`.
  - `obtenerUsuarioPorCorreo`: Ejecuta `SELECT id, nombre, correo_electronico, contrasena_hash, edad, peso_kg, meta_diaria_ml, creado_en FROM usuarios WHERE correo_electronico = ?`.
- **Razón**: Protege la integridad de las credenciales evitando que la columna `contrasena_hash` viaje a la capa de presentación o respuestas de perfil accidentalmente.

### Decisión 4: Uso exclusivo del módulo singleton `database.js`
- **Elección**: Consumir `run` y `get` exportados por `src/backend/config/database.js`.
- **Razón**: Reutiliza la conexión centralizada con `PRAGMA foreign_keys = ON` activo y soporte nativo para promesas con `async/await`.

## Endpoints, Tablas y Validaciones Afectadas

- **Tablas afectadas**:
  - `usuarios`: Consultas de lectura (`SELECT`) e inserción/actualización (`INSERT`, `UPDATE`).
- **Validaciones en modelo**:
  - Parámetros enlazados en orden posicional estricto: `[nombre, correo_electronico, contrasena_hash, edad, peso_kg, meta_diaria_ml]`.
- **Endpoints futuros habilitados**:
  - `POST /api/auth/registro`
  - `POST /api/auth/login`
  - `GET /api/usuarios/perfil`
  - `PATCH /api/usuarios/meta`

## Risks / Trade-offs

- **[Riesgo] Rendimiento de hashing bcrypt en hardware limitado** → *Mitigación*: `SALT_ROUNDS = 10` proporciona un equilibrio probado entre resistencia contra fuerza bruta y tiempo de procesamiento en Node.js (aprox. 80-100 ms).
- **[Riesgo] Tokens no revocables antes de expiración** → *Mitigación*: La expiración fijada a 24 horas (`JWT_EXPIRES_IN = '24h'`) acota la ventana de validez conforme al estándar del SRS.
