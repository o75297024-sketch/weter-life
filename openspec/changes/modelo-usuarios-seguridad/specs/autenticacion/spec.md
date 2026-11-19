# Spec Delta

## ADDED Requirements

### Requirement: Hashing y verificación de contraseñas con bcrypt
El sistema MUST generar hashes de contraseñas utilizando bcrypt con un factor de costo mínimo de 10 (`SALT_ROUNDS = 10`) y SHALL verificar asíncronamente si una contraseña en texto plano coincide con un hash almacenado.

#### Scenario: Generación de hash seguro
- **WHEN** el sistema procesa una contraseña en texto plano para persistirla
- **THEN** retorna un hash que cumple con el algoritmo bcrypt y el factor de costo configurado

#### Scenario: Validación de contraseña correcta
- **WHEN** se compara la contraseña provista por el usuario con el hash generado previamente
- **THEN** la verificación retorna `true` permitiendo continuar el flujo de autenticación

#### Scenario: Rechazo de contraseña incorrecta
- **WHEN** se compara una contraseña que no coincide con el hash almacenado
- **THEN** la verificación retorna `false` sin emitir excepciones no controladas

### Requirement: Emisión y validación de tokens JWT
El sistema SHALL generar tokens JWT firmados con el secreto configurado y un tiempo de expiración de 24 horas, y MUST verificar su validez y firma emitiendo un error operacional con código HTTP `401 Unauthorized` si el token es nulo, corrupto o ha expirado.

#### Scenario: Generación de token firmado
- **WHEN** se solicita generar un token con el payload de identidad del usuario (`id`, `correo_electronico`)
- **THEN** el sistema emite una cadena JWT válida firmada con vigencia de 24 horas

#### Scenario: Verificación exitosa de token
- **WHEN** se provee un token JWT firmado y no expirado
- **THEN** el sistema decodifica y devuelve el payload correspondiente

#### Scenario: Rechazo de token inválido o expirado
- **WHEN** se intenta verificar un token con firma alterada o cuya vigencia de 24 horas ha finalizado
- **THEN** el sistema lanza un `AppError` operacional con código HTTP 401 y mensaje descriptivo

### Requirement: Persistencia y consulta segura de usuarios
El sistema SHALL realizar todas las operaciones sobre la tabla `usuarios` mediante sentencias SQL preparadas (`?`), MUST excluir la columna `contrasena_hash` al registrar o consultar el perfil público de un usuario por su identificador, y SHALL proveer la consulta del registro completo por correo para la validación de credenciales.

#### Scenario: Creación de usuario en base de datos
- **WHEN** se persisten los datos de un nuevo usuario en la tabla `usuarios`
- **THEN** el registro se inserta mediante sentencia preparada y se retorna el objeto del usuario creado sin la columna `contrasena_hash`

#### Scenario: Consulta de usuario para inicio de sesión
- **WHEN** se busca un usuario mediante su correo electrónico registrado
- **THEN** se retorna el registro completo incluyendo `contrasena_hash` para posibilitar la comparación criptográfica

#### Scenario: Consulta de perfil público por ID
- **WHEN** se consulta un usuario por su clave primaria `id`
- **THEN** se retornan únicamente los campos públicos (`id`, `nombre`, `correo_electronico`, `edad`, `peso_kg`, `meta_diaria_ml`, `creado_en`) o `null` si no existe

#### Scenario: Modificación de meta diaria
- **WHEN** se actualiza el campo `meta_diaria_ml` de un usuario existente
- **THEN** la base de datos ejecuta la sentencia preparada y confirma la cantidad de registros actualizados
