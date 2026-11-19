# Design

## Context

Para la motivación del cambio y el contexto del problema, véase [proposal.md](proposal.md).
El proyecto cuenta con el enrutador `authRoutes.js` y el controlador `authController.js` estructurados en el módulo de autenticación, además de las utilidades de seguridad en `authHelper.js` (`compararContrasena`, `generarToken`), el modelo de acceso a datos `userModel.js` (`obtenerUsuarioPorCorreo`) y la gestión de errores con `AppError.js` y `errorHandler.js`.

Este diseño detalla la arquitectura técnica para habilitar `POST /api/auth/login` de manera segura contra ataques comunes como enumeración de usuarios o fuga de hashes criptográficos.

## Goals / Non-Goals

**Goals:**
- Extender `src/backend/routes/authRoutes.js` con el endpoint `POST /login`.
- Validar declarativamente `correo_electronico` y `contrasena` con `express-validator` y `validateRequest`.
- Implementar la función `iniciarSesion` en `src/backend/controllers/authController.js`.
- Proteger contra enumeración de usuarios respondiendo de forma idéntica (código HTTP `401 Unauthorized`, mensaje `"Credenciales incorrectas."`) tanto si el correo no está registrado como si la contraseña es errónea.
- Emitir un token JWT con payload `{ id, correo_electronico }` y expiración de 24 horas usando `authHelper.generarToken`.
- Retornar respuesta HTTP `200 OK` con formato estándar `{ status: "success", mensaje, token, usuario }` excluyendo `contrasena_hash`.

**Non-Goals:**
- Implementar listas de revocación de tokens o endpoints de logout con estado.
- Implementar middleware de autenticación `authMiddleware.js` (aplica a rutas protegidas, no a la ruta pública de login).
- Modificar esquemas de bases de datos o campos en la tabla `usuarios`.

## Decisions

### Decisión 1: Mitigación de enumeración de usuarios en `iniciarSesion`
- **Elección**: Manejar la ausencia del usuario y el fallo de `compararContrasena` bajo el mismo bloque de control con un único error operacional: `throw new AppError('Credenciales incorrectas.', 401)`.
- **Razón**: Si se devuelven mensajes diferenciados (como "Usuario no encontrado" vs "Contraseña inválida"), un atacante puede determinar qué correos electrónicos están registrados en la plataforma.
- **Alternativa considerada**: Lanzar errores diferenciados para logs internos; descartada en la respuesta al cliente para garantizar la seguridad del usuario según el estándar y el SRS.

### Decisión 2: Exclusión explícita de `contrasena_hash` al retornar el usuario
- **Elección**: Al consultar con `userModel.obtenerUsuarioPorCorreo(correo_electronico)` se obtiene la fila completa (necesaria para el hash). Al construir la respuesta HTTP 200, se desestructura o proyecta un objeto seguro con `{ id, nombre, correo_electronico, edad, peso_kg, meta_diaria_ml }`.
- **Razón**: Previene cualquier fuga accidental del hash bcrypt en la respuesta JSON o en clientes de red.

### Decisión 3: Validación sintáctica temprana antes de la consulta a base de datos
- **Elección**: Configurar validadores de `express-validator` en la ruta seguidos de `validateRequest`.
- **Razón**: Si el payload no contiene un correo válido o la contraseña está vacía, la petición se rechaza con 400 Bad Request inmediatamente, ahorrando lecturas a SQLite y ciclos de CPU en bcrypt.

## Risks / Trade-offs

- **[Riesgo] Ataque de análisis de tiempos (timing attacks)**:
  - *Mitigación*: `bcrypt.compare` opera con tiempos constantes de ejecución para hashes válidos. Aunque una cuenta inexistente retornaría más rápido al no invocar bcrypt, para el volumen y modelo SQLite local del proyecto, la respuesta unificada con 401 mitiga la mayor parte del riesgo de enumeración funcional.
- **[Riesgo] Sobrecarga de peticiones inválidas**:
  - *Mitigación*: `validateRequest` filtra peticiones malformadas antes de tocar la base de datos o bcrypt.
