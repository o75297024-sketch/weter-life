# hidratacion Specification

## Purpose

Calcular la meta diaria de agua de cada usuario y administrar su ventana de vigilia, frecuencia de tomas y volumen por dosis.

## Requirements

### Requirement: Cálculo de la meta diaria
El sistema SHALL calcular la meta diaria inicial como `peso_kg * 35` ml y SHALL sumar 500 ml cuando el usuario declare actividad física o condiciones climáticas severas.

#### Scenario: Cálculo estándar
- **WHEN** un usuario de 55 kg se registra sin actividad física declarada
- **THEN** el sistema asignó una meta diaria de 1925 ml

#### Scenario: Ajuste por actividad física
- **WHEN** el usuario declara actividad física o clima severo
- **THEN** la meta diaria resultante es la del cálculo estándar más 500 ml

### Requirement: Generación automática del horario sugerido
Tras el registro, el sistema SHALL proponer un horario por defecto con `hora_inicio` "07:00", `hora_fin` "21:00" e `intervalo_minutos` 120, derivando la cantidad por toma de la meta diaria.

#### Scenario: Horario sugerido al registrarse
- **WHEN** un usuario completa su registro
- **THEN** su perfil queda con el horario sugerido y una cantidad por toma calculada según la meta diaria

### Requirement: Cálculo del volumen por toma
El sistema SHALL calcular el volumen por toma como la meta diaria dividida entre la cantidad de tomas que caben en la ventana de vigilia (`horas de vigilia * 60 / intervalo_minutos`).

#### Scenario: Distribución de la meta
- **WHEN** la meta es 2000 ml, la vigilia es de 14 horas y el intervalo es de 120 minutos
- **THEN** el sistema programa 7 tomas y calcula la cantidad por toma en función de esa distribución

### Requirement: Personalización del horario
El usuario autenticado SHALL poder modificar en cualquier momento su `hora_inicio`, `hora_fin`, `intervalo_minutos` y la meta diaria recomendada mediante `POST /api/usuarios/{id}/horarios`.

#### Scenario: Actualización válida del horario
- **WHEN** el usuario envía un horario con formato "HH:MM", `hora_fin` posterior a `hora_inicio` e intervalo mayor que cero
- **THEN** el sistema responde `201 Created` y regenera los recordatorios programados del día

#### Scenario: Formato de hora o intervalo inválido
- **WHEN** el horario enviado no usa el formato "HH:MM" o el intervalo es menor o igual a cero
- **THEN** el sistema responde `400 Bad Request` y conserva la configuración anterior

#### Scenario: Usuario inexistente
- **WHEN** el `id` de la ruta no corresponde a un usuario existente
- **THEN** el sistema responde `404 Not Found`

### Requirement: Consulta del horario activo
El sistema SHALL exponer el horario vigente del usuario autenticado para que el frontend inicialice sus temporizadores.

#### Scenario: Lectura del horario activo
- **WHEN** el cliente autenticado consulta la configuración del horario
- **THEN** el sistema devuelve `hora_inicio`, `hora_fin`, `intervalo_minutos`, `cantidad_ml_por_toma` y el indicador `activo`
