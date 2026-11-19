# autenticacion Specification

## Purpose

Definir el registro, el inicio de sesión y el control de acceso de los usuarios de AguaRecordatorio mediante tokens JWT, garantizando el almacenamiento seguro de credenciales.

## Requirements

### Requirement: Registro de usuarios
El sistema SHALL permitir crear una cuenta con `nombre_completo` (máx. 100 caracteres), `correo_electronico` único, `contrasena` (mín. 8 caracteres), `edad` (10 a 120) y `peso_kg` (30.0 a 250.0), calculando automáticamente la meta diaria de hidratación durante el registro.

#### Scenario: Registro exitoso
- **WHEN** el cliente envía `POST /api/auth/registro` con datos válidos y un correo no registrado
- **THEN** el sistema responde `201 Created` con los datos del perfil y un token JWT válido

#### Scenario: Correo ya registrado
- **WHEN** el correo enviado ya existe en la base de datos
- **THEN** el sistema responde `409 Conflict` con la estructura de error `{ status, codigo, mensaje }`

#### Scenario: Datos inválidos
- **WHEN** el cuerpo no cumple los rangos o formatos de edad, peso, contraseña o correo
- **THEN** el sistema responde `400 Bad Request` indicando el campo inválido y no crea el usuario

### Requirement: Almacenamiento seguro de contraseñas
El sistema MUST almacenar únicamente el hash bcrypt de la contraseña, con factor de costo mínimo 10, y MUST NOT persistir ni registrar la contraseña en texto plano.

#### Scenario: Persistencia de credenciales
- **WHEN** un usuario completa su registro
- **THEN** la columna `contrasena_hash` contiene un hash bcrypt y la contraseña original no aparece en la base de datos ni en los logs

### Requirement: Inicio de sesión con JWT
El sistema SHALL autenticar credenciales en `POST /api/auth/login` y devolver un token JWT con expiración de 24 horas junto con los datos básicos del usuario.

#### Scenario: Credenciales válidas
- **WHEN** el usuario envía un correo registrado y la contraseña correcta
- **THEN** el sistema responde `200 OK` con el token JWT y el perfil del usuario

#### Scenario: Credenciales inválidas
- **WHEN** el correo no existe o la contraseña no coincide
- **THEN** el sistema responde `401 Unauthorized` sin revelar cuál de los dos datos es incorrecto

### Requirement: Protección de rutas autenticadas
El sistema SHALL exigir la cabecera `Authorization: Bearer <token>` en los endpoints protegidos y MUST rechazar tokens ausentes, inválidos o expirados.

#### Scenario: Acceso con token válido
- **WHEN** una petición protegida incluye un JWT vigente del usuario autenticado
- **THEN** el backend procesa la petición y limita el acceso a los recursos del propio usuario

#### Scenario: Acceso sin token o con token expirado
- **WHEN** falta la cabecera `Authorization` o el token es inválido o expiró
- **THEN** el sistema responde `401 Unauthorized` sin ejecutar la operación

### Requirement: Persistencia de sesión en el cliente
El frontend SHALL almacenar el JWT en `localStorage` o `sessionStorage` y SHALL adjuntarlo automáticamente en cada petición protegida.

#### Scenario: Petición autenticada desde la PWA
- **WHEN** un usuario con sesión activa consulta un recurso protegido
- **THEN** el cliente envía el token en la cabecera `Authorization` sin intervención manual
