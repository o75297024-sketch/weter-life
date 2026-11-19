# notificaciones Specification

## Purpose

Entregar recordatorios de hidratación al dispositivo del usuario mediante Web Push, coordinando la suscripción del cliente, el planificador del backend y el Service Worker.

## Requirements

### Requirement: Suscripción Web Push
El cliente SHALL solicitar permiso de notificaciones y enviar su suscripción (`endpoint`, `p256dh`, `auth`) al backend mediante `POST /api/usuarios/{id}/push-subscription`.

#### Scenario: Suscripción registrada
- **WHEN** el usuario concede permiso y el navegador genera una suscripción
- **THEN** el backend la persiste en `subscripciones_push` asociada al usuario

#### Scenario: Permiso denegado
- **WHEN** el usuario rechaza el permiso de notificaciones
- **THEN** la aplicación sigue operativa y muestra un aviso de que los recordatorios push están desactivados

### Requirement: Planificación de despachos
El backend SHALL evaluar cada minuto la tabla `recordatorios` y SHALL enviar la notificación cuando coincidan la fecha, la hora actual y el estado `pendiente`.

#### Scenario: Despacho de una toma
- **WHEN** la hora actual coincide con una toma `pendiente` de un usuario suscrito
- **THEN** el backend envía la notificación push a todas las suscripciones de ese usuario

#### Scenario: Toma ya atendida
- **WHEN** la toma coincide en hora pero su estado es `completado` u `omitido`
- **THEN** el backend no envía ninguna notificación

#### Scenario: Suscripción inválida o caducada
- **WHEN** el servicio push responde que una suscripción dejó de ser válida
- **THEN** el backend elimina esa suscripción y continúa con las demás sin interrumpir el planificador

### Requirement: Recepción en el cliente
El Service Worker SHALL capturar el evento `push` y SHALL mostrar una notificación con el mensaje de hidratación correspondiente.

#### Scenario: Notificación recibida
- **WHEN** el Service Worker recibe un evento `push` con la aplicación cerrada
- **THEN** se muestra una notificación del sistema con el texto de recordatorio y la cantidad de agua sugerida

#### Scenario: Apertura desde la notificación
- **WHEN** el usuario toca la notificación
- **THEN** la aplicación se abre en el dashboard con el estado del día actualizado
