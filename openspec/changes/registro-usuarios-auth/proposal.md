# Proposal

## Why

Para permitir que los usuarios comiencen a usar AguaRecordatorio, el sistema requiere exponer el endpoint público de registro de usuarios (`POST /api/auth/registro`), cumpliendo los requerimientos funcionales RF-01 (registro de usuarios), RF-01.1 (validación de campos y rangos), RF-01.2 (cifrado de contraseñas con bcrypt) y RF-03.1 (cálculo inicial automático de la meta hídrica según peso y factor de actividad o clima).

Este endpoint conecta de manera integral los componentes ya construidos: validación declarativa con `express-validator` y `validateRequest`, cálculo determinista con `hydrationService`, hashing seguro y generación de tokens con `authHelper`, persistencia en SQLite con `userModel`, y manejo centralizado de respuestas y errores operacionales con `AppError` y `errorHandler`.

## What Changes

- **Rutas de Autenticación (`src/backend/routes/authRoutes.js`)**:
  - Definición del router Express para el prefijo `/api/auth`.
  - Configuración de validaciones con `express-validator` para `POST /api/auth/registro`:
    - `nombre`: Cadena de texto no vacía, máximo 100 caracteres, normalizada con `.trim()`.
    - `correo_electronico`: Formato válido de correo electrónico, normalizado (`normalizeEmail`), obligatorio.
    - `contrasena`: Cadena de texto con longitud mínima de 8 caracteres.
    - `edad`: Número entero en el rango de 10 a 120 (RF-01.1).
    - `peso_kg`: Número decimal/flotante en el rango de 30.0 a 250.0 (RF-01.1).
    - `factor_extra`: Booleano opcional (`true`/`false`), por defecto `false` (soporte para RN-01 con actividad física o clima extremo).
  - Intercepción inmediata de inconsistencias mediante el middleware `validateRequest`.

- **Controlador de Autenticación (`src/backend/controllers/authController.js`)**:
  - Implementación de la función `registrarUsuario(req, res, next)` con `async/await` y delegación a `next(error)` en bloques `try/catch`.
  - Verificación de duplicidad: consulta `userModel.obtenerUsuarioPorCorreo()` y lanza `AppError('El correo electrónico ya está registrado.', 409)` si ya existe.
  - Cálculo de hidratación: invoca `hydrationService.calcularMetaDiaria(peso_kg, factor_extra)` para obtener `meta_diaria_ml`.
  - Criptografía: genera el hash de la contraseña plana usando `authHelper.hashearContrasena()`.
  - Persistencia: almacena el registro en SQLite a través de `userModel.crearUsuario()`.
  - Emisión de sesión: genera el token JWT con `authHelper.generarToken({ id, correo_electronico })`.
  - Respuesta HTTP `201 Created` con formato estandarizado `{ status: "success", mensaje, token, usuario }`.

- **Integración en la Aplicación (`src/backend/app.js`)**:
  - Montaje del enrutador `authRoutes` bajo la ruta base `/api/auth`.
  - Garantiza que el montaje se ubique antes del middleware 404 y del `errorHandler`.

### Out of Scope (Alcance Excluido)

- Endpoint de inicio de sesión (`POST /api/auth/login`).
- Middleware de autenticación y verificación de token para rutas protegidas (`authMiddleware.js`).
- Endpoints de consulta o edición del perfil de usuario (`GET /api/usuarios/perfil`, `PUT /api/usuarios/perfil`).
- Formularios visuales o vistas del frontend PWA (se abordarán en su respectivo cambio de interfaz).

## Capabilities

### New Capabilities

*(No se introducen nuevas capacidades raíz; el cambio implementa la funcionalidad del registro dentro de la capacidad existente `autenticacion`).*

### Modified Capabilities

- `autenticacion`: Se especifican los requerimientos y escenarios correspondientes a la ruta REST `POST /api/auth/registro`, detallando las validaciones de entrada (incluyendo `factor_extra`), el cálculo automático de `meta_diaria_ml` vía `hydrationService`, la respuesta HTTP 201 con JWT, y las respuestas de error HTTP 400 y 409.

## Impact

- **Código nuevo / modificado**:
  - `src/backend/controllers/authController.js` (nuevo)
  - `src/backend/routes/authRoutes.js` (nuevo)
  - `src/backend/app.js` (actualizado para registrar `/api/auth`)
- **Dependencias y módulos integrados**:
  - `express-validator`
  - `src/backend/middlewares/validateRequest.js`
  - `src/backend/services/hydrationService.js`
  - `src/backend/utils/authHelper.js`
  - `src/backend/utils/AppError.js`
  - `src/backend/models/userModel.js`
