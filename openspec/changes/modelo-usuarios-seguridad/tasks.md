# Tasks

## 1. Helper de Seguridad y Tokens (Backend - Utils)

- [x] 1.1 Crear `src/backend/utils/authHelper.js` definiendo las constantes `SALT_ROUNDS = 10`, `JWT_SECRET` y `JWT_EXPIRES_IN = '24h'` con documentación JSDoc en español.
- [x] 1.2 Implementar y exportar `hashearContrasena(contrasenaPlana)` y `compararContrasena(contrasenaPlana, contrasenaHash)` usando `bcryptjs`.
- [x] 1.3 Implementar y exportar `generarToken(payload)` y `verificarToken(token)` usando `jsonwebtoken`, arrojando una instancia de `AppError` con código HTTP 401 en caso de token inválido o expirado.

## 2. Modelo de Acceso a Datos de Usuarios (Backend - Models)

- [x] 2.1 Crear `src/backend/models/userModel.js` importando la conexión de base de datos e implementando `crearUsuario(...)` mediante sentencias preparadas (`?`) que retorne el objeto del usuario creado excluyendo `contrasena_hash`.
- [x] 2.2 Implementar y exportar `obtenerUsuarioPorCorreo(correo_electronico)` para consultar el registro íntegro (incluyendo `contrasena_hash`) o `null` si no existe.
- [x] 2.3 Implementar y exportar `obtenerUsuarioPorId(id)` retornando únicamente las columnas públicas (`id`, `nombre`, `correo_electronico`, `edad`, `peso_kg`, `meta_diaria_ml`, `creado_en`) o `null` si no existe.
- [x] 2.4 Implementar y exportar `actualizarMetaDiaria(usuarioId, nuevaMetaMl)` mediante sentencia preparada retornando la cantidad de registros modificados.

## 3. Verificación e Integración

- [x] 3.1 Validar mediante script de pruebas automatizadas el correcto funcionamiento de hashing, comparación, firma/verificación de JWT y operaciones de base de datos en `usuarios`.
- [x] 3.2 Ejecutar `npx openspec validate --all` para asegurar que todas las especificaciones y cambios mantengan plena coherencia y validación sin errores.
