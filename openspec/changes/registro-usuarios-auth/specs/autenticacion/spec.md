# Spec Delta

## MODIFIED Requirements

### Requirement: Registro de usuarios
El sistema SHALL procesar el registro en `POST /api/auth/registro` recibiendo `nombre` (máx. 100 caracteres), `correo_electronico` único, `contrasena` (mín. 8 caracteres), `edad` (10 a 120), `peso_kg` (30.0 a 250.0) y opcionalmente `factor_extra` (booleano), calculando de forma determinista `meta_diaria_ml` (RN-01) y emitiendo un token JWT firmado.

#### Scenario: Registro exitoso
- **WHEN** el cliente envía `POST /api/auth/registro` con datos válidos y un correo no registrado
- **THEN** el sistema responde `201 Created` con `{ status: "success", mensaje, token, usuario }` conteniendo los datos del perfil sin incluir la contraseña

#### Scenario: Correo ya registrado
- **WHEN** el correo enviado ya existe en la base de datos
- **THEN** el sistema responde `409 Conflict` con la estructura de error `{ status: "error", codigo: 409, mensaje }`

#### Scenario: Datos inválidos
- **WHEN** el cuerpo de la petición no cumple los rangos o formatos requeridos en `nombre`, `correo_electronico`, `contrasena`, `edad` o `peso_kg`
- **THEN** el sistema responde `400 Bad Request` mediante el middleware de validación sin persistir registros ni generar token
