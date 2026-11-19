# Proposal

## Why

Para implementar los endpoints de autenticación y gestión de usuarios (registro y login), la API requiere una base sólida y desacoplada de persistencia para la tabla `usuarios` y utilidades criptográficas para el hashing seguro de credenciales y la emisión y validación de tokens JWT. 

Centralizar estas responsabilidades en `userModel.js` y `authHelper.js` previene la duplicación de lógica sensible, garantiza el factor de costo de hashing exigido por el SRS y asegura que las consultas a SQLite se realicen con sentencias preparadas para mitigar inyecciones SQL.

## What Changes

- **Helper de seguridad y tokens (`src/backend/utils/authHelper.js`)**:
  - `SALT_ROUNDS = 10` (factor de costo mínimo estipulado por el SRS).
  - `JWT_SECRET` leído desde variable de entorno con respaldo para desarrollo local, y `JWT_EXPIRES_IN = '24h'`.
  - `hashearContrasena(contrasenaPlana)`: Generación asíncrona de hash bcrypt.
  - `compararContrasena(contrasenaPlana, contrasenaHash)`: Validación asíncrona de coincidencia de contraseñas.
  - `generarToken(payload)`: Firma de JWT con `{ id, correo_electronico }` y expiración de 24 horas.
  - `verificarToken(token)`: Validación y decodificación de JWT, lanzando `AppError` con HTTP `401 Unauthorized` si el token es inválido o ha expirado.
- **Modelo de acceso a datos de usuarios (`src/backend/models/userModel.js`)**:
  - Implementación con `async/await`, `try/catch` y sentencias SQL preparadas (`?`) obligatorias.
  - `crearUsuario({ nombre, correo_electronico, contrasena_hash, edad, peso_kg, meta_diaria_ml })`: Inserción en `usuarios` retornando el usuario creado excluyendo `contrasena_hash`.
  - `obtenerUsuarioPorCorreo(correo_electronico)`: Consulta por correo retornando el registro completo (incluyendo `contrasena_hash` para autenticación en login) o `null`.
  - `obtenerUsuarioPorId(id)`: Consulta por clave primaria retornando únicamente las columnas públicas (`id`, `nombre`, `correo_electronico`, `edad`, `peso_kg`, `meta_diaria_ml`, `creado_en`) o `null`.
  - `actualizarMetaDiaria(usuarioId, nuevaMetaMl)`: Modificación de `meta_diaria_ml` retornando el número de filas modificadas.

### Out of Scope (Alcance Excluido)

- Exposición directa de endpoints HTTP REST (`POST /api/auth/registro`, `POST /api/auth/login`); estos se implementarán en la capa de controladores y routers correspondiente.
- Lógica de cálculo inicial de la meta diaria (RN-01); el valor se recibe calculado por el controlador antes de invocar a `crearUsuario`.
- Middleware de protección de rutas `authMiddleware.js` (se conectará en el router).

## Capabilities

### New Capabilities

*(No se introducen nuevas capacidades independientes; este cambio profundiza la capacidad existente).*

### Modified Capabilities

- `autenticacion`: Se especifican a nivel de persistencia y utilidades las operaciones de hashing bcrypt con factor 10, generación y verificación de JWT con error 401 tipificado, y las consultas preparadas del modelo de usuarios.

## Impact

- **Código afectado**:
  - `src/backend/utils/authHelper.js` (nuevo).
  - `src/backend/models/userModel.js` (nuevo, reemplaza `.gitkeep`).
- **Dependencias**:
  - `bcryptjs` (instalada).
  - `jsonwebtoken` (instalada).
  - `src/backend/config/database.js` (`run`, `get`).
  - `src/backend/utils/AppError.js`.
- **Requerimientos cubiertos**:
  - **RF-01.1 y RF-01.2**: Captura y almacenamiento seguro de credenciales con hashing bcrypt.
  - **RF-02.1**: Emisión y validación de tokens de sesión JWT.
  - **RNF-02.1**: Protección contra inyecciones SQL mediante sentencias preparadas.
