# Spec Delta

## ADDED Requirements

### Requirement: Funciones deterministas de cálculo de meta y vigilia
El sistema SHALL proveer funciones puras para calcular la meta diaria hídrica multiplicando el peso por 35 ml (sumando 500 ml si se declara factor extra y redondeando al entero más cercano), y SHALL calcular las horas y minutos de vigilia validando que `horaInicio` y `horaFin` sigan el formato de 24 horas `"HH:MM"`.

#### Scenario: Cálculo de meta diaria estándar y con factor extra
- **WHEN** se calcula la meta para un peso de 70 kg con y sin factor extra
- **THEN** el sistema retorna 2450 ml para el caso estándar y 2950 ml cuando el factor extra es verdadero

#### Scenario: Cálculo de ventana de vigilia válida
- **WHEN** se suministra una `horaInicio` de `"07:00"` y una `horaFin` de `"21:00"`
- **THEN** el sistema retorna una diferencia de 840 minutos y 14 horas de vigilia

#### Scenario: Rechazo de ventana de vigilia inconsistente
- **WHEN** se ingresa una `horaFin` anterior o igual a `horaInicio`, o con formato diferente a `"HH:MM"`
- **THEN** el sistema lanza un error operacional de validación con código HTTP 400

### Requirement: Cálculo de volumen por toma y generación de cronograma
El sistema SHALL calcular el volumen por toma dividiendo la meta diaria entre el cociente de los minutos de vigilia sobre el intervalo en minutos (`meta / ((vigilia_horas * 60) / intervalo)`), redondeando al entero más cercano, y SHALL generar un cronograma secuencial de tomas desde `horaInicio` incrementando el intervalo sin rebasar `horaFin`.

#### Scenario: Cálculo de volumen por toma en horario estándar
- **WHEN** se calcula el volumen para una meta de 2450 ml, vigilia de 14 horas e intervalo de 120 minutos
- **THEN** el sistema retorna 350 ml por toma y un total de 7 tomas programadas

#### Scenario: Generación del cronograma estructurado de tomas
- **WHEN** se genera el cronograma para el horario de `"07:00"` a `"21:00"` con intervalo de 120 minutos y 350 ml por toma
- **THEN** el sistema genera una colección ordenada de tomas con formato `{ hora: "HH:MM", cantidad_ml: 350, estado: "pendiente" }` finalizando en o antes de las 21:00

#### Scenario: Intervalo no válido respecto a la vigilia
- **WHEN** el intervalo en minutos es menor o igual a cero o supera los minutos totales de vigilia
- **THEN** el sistema interrumpe el cálculo lanzando un error operacional con código HTTP 400
