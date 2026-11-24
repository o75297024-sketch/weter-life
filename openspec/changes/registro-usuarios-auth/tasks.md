# Tasks

## 1. Rutas y Esquemas de Validación (Backend - Routes)

- [x] 1.1 Crear `src/backend/routes/authRoutes.js` con el router de Express y las reglas de `express-validator` para `nombre`, `correo_electronico`, `contrasena`, `edad`, `peso_kg` y el campo opcional `factor_extra`, documentadas con JSDoc.
- [x] 1.2 Integrar el middleware `validateRequest` en la definición de la ruta `POST /registro` para interceptar datos no conformes con HTTP 400.

## 2. Controlador de Registro (Backend - Controllers)

- [x] 2.1 Crear `src/backend/controllers/authController.js` con la función `registrarUsuario` envuelta en `async/await`, `try/catch` y delegación a `next(error)`.
- [x] 2.2 Implementar en `registrarUsuario` la verificación de unicidad de correo vía `userModel.obtenerUsuarioPorCorreo` lanzando `AppError('El correo electrónico ya está registrado.', 409)`.
- [x] 2.3 Implementar el cálculo automático de `meta_diaria_ml` invocando `hydrationService.calcularMetaDiaria(peso_kg, factor_extra)` (RN-01).
- [x] 2.4 Implementar el hashing de la contraseña con `authHelper.hashearContrasena` (RF-01.2), la persistencia mediante `userModel.crearUsuario`, la generación de JWT con `authHelper.generarToken`, y la respuesta HTTP 201 Created con el payload estandarizado.

## 3. Integración en `app.js` y Verificación

- [x] 3.1 Actualizar `src/backend/app.js` montando `authRoutes` en `/api/auth` antes del manejador 404 y `errorHandler`.
- [x] 3.2 Verificar el flujo integral (registro exitoso 201, duplicidad 409 y validaciones 400) mediante script de pruebas automatizadas contra SQLite.
- [x] 3.3 Ejecutar `npx openspec validate --all` para asegurar la validez de las especificaciones y del cambio propuesto.
