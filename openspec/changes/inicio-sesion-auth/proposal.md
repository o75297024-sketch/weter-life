# Proposal

## Why

Para cumplir con el requerimiento funcional RF-02 (Inicio de Sesión), la API de AguaRecordatorio requiere un mecanismo de autenticación seguro y estandarizado que permita a los usuarios registrados iniciar sesión mediante su correo electrónico y contraseña.

Este cambio implementa el endpoint `POST /api/auth/login` integrando la consulta de credenciales en `userModel.js`, la comparación criptográfica con factor de costo 10 en `authHelper.js` (`bcrypt.compare`), la emisión de tokens JWT de 24 horas y una respuesta de seguridad homogénea frente a credenciales inválidas (HTTP 401 Unauthorized) para mitigar vectores de ataque por enumeración de usuarios.

## What Changes

- **Validaciones en Rutas de Autenticación (`src/backend/routes/authRoutes.js`)**:
  - Definición del endpoint `POST /api/auth/login`.
  - Esquema de validación declarativa con `express-validator`:
    - `correo_electronico`: Obligatorio, formato de correo válido y normalizado (`normalizeEmail`).
    - `contrasena`: Obligatorio, cadena de texto no vacía.
  - Intercepción inmediata de peticiones malformadas mediante el middleware `validateRequest` respondiendo con HTTP `400 Bad Request`.

- **Controlador de Inicio de Sesión (`src/backend/controllers/authController.js`)**:
  - Implementación de la función `iniciarSesion(req, res, next)` con `async/await` y delegación a `next(error)` ante fallos inesperados.
  - Búsqueda del usuario por correo electrónico mediante `userModel.obtenerUsuarioPorCorreo(correo_electronico)`.
  - Verificación criptográfica con `authHelper.compararContrasena(contrasena, usuario.contrasena_hash)`.
  - Protección anti-enumeración: si el usuario no existe o la contraseña no coincide, se emite un error uniforme `AppError('Credenciales incorrectas.', 401)`.
  - Generación de token de sesión firmado mediante `authHelper.generarToken({ id: usuario.id, correo_electronico: usuario.correo_electronico })`.
  - Respuesta HTTP `200 OK` con formato JSON estándar:
    ```json
    {
      "status": "success",
      "mensaje": "Inicio de sesión exitoso.",
      "token": "<JWT_TOKEN>",
      "usuario": {
        "id": 1,
        "nombre": "...",
        "correo_electronico": "...",
        "edad": 25,
        "peso_kg": 70,
        "meta_diaria_ml": 2450
      }
    }
    ```
    garantizando la exclusión estricta de `contrasena_hash`.

### Out of Scope (Alcance Excluido)

- Middleware de verificación de tokens en rutas protegidas (`authMiddleware.js`).
- Mecanismos de refresco de tokens (refresh tokens) o lista negra de tokens revocados.
- Recuperación o restablecimiento de contraseñas olvidadas.
- Interfaz gráfica o formulario de inicio de sesión en el cliente PWA.

## Capabilities

### New Capabilities

*(No se introducen nuevas capacidades raíz; el cambio implementa la funcionalidad dentro de la capacidad existente `autenticacion`).*

### Modified Capabilities

- `autenticacion`: Se especifican los detalles de comportamiento para el requerimiento `Inicio de sesión con JWT` en `POST /api/auth/login`, incluyendo las validaciones de entrada, respuesta anti-enumeración de credenciales inválidas (401), y el formato de respuesta 200 OK con JWT y datos públicos de usuario.

## Impact

- **Código modificado / extendido**:
  - `src/backend/routes/authRoutes.js` (añade `POST /login` y sus validaciones).
  - `src/backend/controllers/authController.js` (añade `iniciarSesion`).
- **Dependencias y módulos integrados**:
  - `express-validator`
  - `src/backend/middlewares/validateRequest.js`
  - `src/backend/models/userModel.js` (`obtenerUsuarioPorCorreo`)
  - `src/backend/utils/authHelper.js` (`compararContrasena`, `generarToken`)
  - `src/backend/utils/AppError.js`
