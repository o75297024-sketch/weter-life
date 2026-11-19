# consumo Specification

## Purpose

Registrar el agua ingerida por el usuario y exponer métricas de progreso diario, historial y rachas de cumplimiento.

## Requirements

### Requirement: Registro de consumo
El usuario autenticado SHALL poder registrar una ingesta mediante `POST /api/usuarios/{id}/consumo` indicando `cantidad_ml`, `hora` y `fecha`.

#### Scenario: Registro exitoso
- **WHEN** el usuario envía una cantidad positiva con hora y fecha válidas
- **THEN** el sistema responde `201 Created` y persiste el consumo asociado a su usuario

#### Scenario: Datos incompletos
- **WHEN** falta `cantidad_ml`, `hora` o `fecha`, o la cantidad no es un entero positivo
- **THEN** el sistema responde `400 Bad Request` y no registra el consumo

#### Scenario: Consumo de otro usuario
- **WHEN** el `id` de la ruta no coincide con el usuario del token
- **THEN** el sistema responde `401 Unauthorized` y no registra el consumo

### Requirement: Eliminación de un consumo
El usuario SHALL poder eliminar un consumo registrado por error mientras la fecha siga siendo el día en curso.

#### Scenario: Eliminación en el mismo día
- **WHEN** el usuario elimina un consumo cuya fecha es hoy
- **THEN** el sistema elimina el registro y recalcula el total consumido del día

#### Scenario: Eliminación de un día anterior
- **WHEN** el usuario intenta eliminar un consumo de una fecha pasada
- **THEN** el sistema responde `400 Bad Request` y conserva el registro

### Requirement: Progreso diario
El frontend SHALL calcular y mostrar el porcentaje de cumplimiento como `(consumo total / meta diaria) * 100`, actualizándolo en tiempo real al registrar o eliminar consumos.

#### Scenario: Actualización de la barra de progreso
- **WHEN** el usuario registra 250 ml teniendo 1925 ml de meta y 500 ml consumidos
- **THEN** la barra de progreso muestra aproximadamente 39% sin recargar la página

#### Scenario: Meta alcanzada
- **WHEN** el consumo acumulado iguala o supera la meta diaria
- **THEN** la interfaz indica que la meta del día se cumplió y no muestra progreso superior al 100%

### Requirement: Cálculo de la racha diaria
El sistema SHALL contar como día cumplido aquel cuyo consumo alcance al menos el 80% de la meta diaria programada, y SHALL reiniciar la racha a 0 cuando un día calendario completo no lo alcance.

#### Scenario: Día cumplido
- **WHEN** el consumo del día es 1540 ml o más con una meta de 1925 ml
- **THEN** el día suma a la racha activa

#### Scenario: Racha rota
- **WHEN** termina un día calendario con un consumo inferior al 80% de la meta
- **THEN** la racha activa vuelve a 0

### Requirement: Historial de consumo
El sistema SHALL permitir consultar los consumos registrados por el usuario para una fecha dada.

#### Scenario: Consulta del historial diario
- **WHEN** el usuario consulta una fecha con consumos registrados
- **THEN** el sistema devuelve los registros con `cantidad_ml`, `hora` y `registrado_en`, ordenados por hora
