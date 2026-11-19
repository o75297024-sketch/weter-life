# Tasks

## 1. Rutas y Validaciones de Entrada (Backend - Routes)

- [ ] 1.1 Agregar en `src/backend/routes/authRoutes.js` las validaciones declarativas para `POST /login` (`correo_electronico` válido/normalizado y `contrasena` no vacía) con comentarios JSDoc.
- [ ] 1.2 Vincular el middleware `validateRequest` y la invocación al controlador en la ruta `POST /login`, verificando que peticiones malformadas respondan HTTP 400.

## 2. Controlador de Inicio de Sesión (Backend - Controllers)

- [ ] 2.1 Implementar la función `iniciarSesion` en `src/backend/controllers/authController.js` con manejo estructurado de errores (`try/catch`, `next(error)`).
- [ ] 2.2 Integrar la búsqueda en persistencia con `userModel.obtenerUsuarioPorCorreo` y la validación con `authHelper.compararContrasena`, lanzando `AppError('Credenciales incorrectas.', 401)` si no existe el usuario o no coincide la contraseña.
- [ ] 2.3 Generar el token JWT de sesión con `authHelper.generarToken` y responder HTTP 200 OK estructurando `{ status: "success", mensaje, token, usuario }` sin incluir `contrasena_hash`.

## 3. Verificación y Validación de la Propuesta

- [ ] 3.1 Verificar mediante pruebas unitarias/integración contra SQLite los escenarios de inicio de sesión exitoso (200), credenciales incorrectas (401) y cuerpo inválido (400).
- [ ] 3.2 Ejecutar `npx openspec validate --all` para corroborar la validez de las especificaciones y del cambio propuesto.
