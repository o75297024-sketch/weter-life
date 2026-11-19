# recordatorios Specification

## Purpose

Generar, consultar y actualizar las tomas de agua programadas para cada usuario y fecha, incluyendo su estado de cumplimiento.

## Requirements

### Requirement: Generación de tomas programadas
El sistema SHALL generar las tomas del día a partir del horario activo del usuario, distribuyéndolas desde `hora_inicio` hasta `hora_fin` según `intervalo_minutos` y la cantidad por toma.

#### Scenario: Generación diaria
- **WHEN** el usuario tiene un horario activo de 07:00 a 21:00 con intervalo de 120 minutos
- **THEN** el sistema genera las tomas correspondientes a las 07:00, 09:00, 11:00, 13:00, 15:00, 17:00 y 19:00

#### Scenario: Horario inactivo
- **WHEN** el horario del usuario está marcado como inactivo
- **THEN** el sistema no genera ni despacha recordatorios para ese usuario

### Requirement: Estados de una toma
Cada toma SHALL tener uno de los estados `pendiente`, `completado` u `omitido`, y el sistema MUST rechazar cualquier otro valor.

#### Scenario: Estado inicial
- **WHEN** se genera una toma para el día
- **THEN** su estado inicial es `pendiente`

#### Scenario: Estado inválido
- **WHEN** se intenta guardar un estado distinto de los tres permitidos
- **THEN** la base de datos rechaza la escritura y el sistema responde con un error controlado

### Requirement: Consulta de recordatorios por fecha
El sistema SHALL devolver en `GET /api/usuarios/{id}/recordatorios?fecha=YYYY-MM-DD` el resumen del día con la meta diaria, el total consumido y la lista de tomas con hora, cantidad y estado.

#### Scenario: Consulta con tomas registradas
- **WHEN** el usuario autenticado consulta una fecha con recordatorios generados
- **THEN** el sistema responde `200 OK` con `usuario_id`, `fecha`, `meta_diaria_ml`, `consumido_total_ml` y el arreglo `recordatorios`

#### Scenario: Fecha sin recordatorios
- **WHEN** la fecha consultada no tiene tomas generadas
- **THEN** el sistema responde `200 OK` con el arreglo `recordatorios` vacío y el resumen del día

#### Scenario: Fecha con formato inválido
- **WHEN** el parámetro `fecha` no cumple el formato `YYYY-MM-DD`
- **THEN** el sistema responde `400 Bad Request`

### Requirement: Actualización del estado por consumo
Cuando el usuario registra un consumo que cubre una toma pendiente, el sistema SHALL marcar esa toma como `completado`.

#### Scenario: Toma cubierta por un consumo
- **WHEN** el usuario registra 250 ml a las 09:05 y existe una toma pendiente de 250 ml a las 09:00
- **THEN** la toma de las 09:00 pasa a estado `completado`

#### Scenario: Toma omitida
- **WHEN** el usuario decide no realizar una toma pendiente del día
- **THEN** el sistema guarda esa toma con estado `omitido` y la excluye de los avisos posteriores
