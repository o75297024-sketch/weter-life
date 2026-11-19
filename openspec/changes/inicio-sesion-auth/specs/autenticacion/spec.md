# Spec Delta

## MODIFIED Requirements

### Requirement: Inicio de sesión con JWT
El sistema SHALL autenticar credenciales en `POST /api/auth/login` validando formato de correo y presencia de contraseña, comprobando el hash bcrypt en persistencia y devolviendo un token JWT con expiración de 24 horas junto con los datos de perfil público del usuario (`id`, `nombre`, `correo_electronico`, `edad`, `peso_kg`, `meta_diaria_ml`), respondiendo `401 Unauthorized` de manera uniforme ante credenciales erróneas.

#### Scenario: Credenciales válidas
- **WHEN** el usuario envía `POST /api/auth/login` con un correo registrado y la contraseña correspondiente
- **THEN** el sistema responde `200 OK` con `{ status: "success", mensaje: "Inicio de sesión exitoso.", token, usuario }` sin incluir la contraseña

#### Scenario: Credenciales inválidas
- **WHEN** el correo suministrado no existe en el sistema o la contraseña no coincide con el hash almacenado
- **THEN** el sistema responde `401 Unauthorized` con el mensaje genérico `"Credenciales incorrectas."` sin revelar si falló el correo o la clave

#### Scenario: Datos de entrada malformados
- **WHEN** la petición omite el correo o la contraseña, o el correo tiene formato no válido
- **THEN** el sistema responde `400 Bad Request` mediante el middleware de validación sin consultar la persistencia
