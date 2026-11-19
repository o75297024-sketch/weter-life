# Proposal

## Why

El backend necesita centralizar y desacoplar la lógica de dominio relacionada con los cálculos de hidratación y generación de cronogramas en un servicio puro y determinista (`hydrationService.js`), aislado de la base de datos y de la capa HTTP.

Esto garantiza la correcta implementación de las reglas de negocio **RN-01** (cálculo de meta diaria hídrica) y **RN-02** (distribución de dosis por toma según vigilia e intervalo), sirviendo de base para los flujos de registro (**RF-03**) y generación dinámica de tomas diarias (**RF-05**).

## What Changes

- **Creación de `src/backend/services/hydrationService.js`**:
  - Definición de constantes matemáticas y de configuración: `ML_POR_KG = 35`, `EXTRA_ACTIVIDAD_O_CLIMA_ML = 500` y `HORARIO_DEFAULT = { hora_inicio: "07:00", hora_fin: "21:00", intervalo_minutos: 120 }`.
  - `calcularMetaDiaria(pesoKg, factorExtra = false)`: Cálculo determinista de meta en ml según peso y factor adicional (actividad física o clima severo), redondeado al entero más cercano.
  - `calcularHorasVigilia(horaInicio, horaFin)`: Validación estricta de formato 24h (`"HH:MM"`), validación de que `horaFin > horaInicio` (lanzando `AppError` 400 si es inválido) y cálculo de minutos y horas decimales de vigilia.
  - `calcularVolumenPorToma(metaDiariaMl, horaInicio, horaFin, intervaloMinutos)`: Aplicación de la fórmula de distribución `metaDiariaMl / ((horasVigilia * 60) / intervaloMinutos)`, validación de intervalos positivos y menores a la vigilia total, retornando `cantidad_ml_por_toma` y `total_tomas`.
  - `generarCronogramaTomas({ horaInicio, horaFin, intervaloMinutos, cantidadMlPorToma })`: Generación secuencial de tomas con formato `{ hora: "HH:MM", cantidad_ml, estado: "pendiente" }` desde `horaInicio` hasta alcanzar o sin exceder `horaFin`.

### Out of Scope (Alcance Excluido)

- Persistencia de horarios o tomas en las tablas `horarios` o `recordatorios` de SQLite3; este servicio es puramente computacional y libre de efectos secundarios.
- Exposición de endpoints REST (`/api/usuarios/:id/horarios` o `/api/usuarios/:id/recordatorios`); los controladores se integrarán en cambios posteriores.
- Lógica de frontend o notificaciones push.

## Capabilities

### New Capabilities

*(No se introducen nuevas capacidades; se formalizan los cálculos en la capacidad existente).*

### Modified Capabilities

- `hidratacion`: Se incorporan especificaciones detalladas para la validación de ventanas de vigilia en formato 24h, redondeo determinista de dosis y generación del cronograma en memoria de tomas pendientes.

## Impact

- **Código afectado**:
  - `src/backend/services/hydrationService.js` (nuevo archivo).
- **Dependencias**:
  - `src/backend/utils/AppError.js` (para validaciones de dominio con HTTP 400).
- **Reglas y Requerimientos cubiertos**:
  - **RN-01**: Meta diaria (`peso_kg * 35` + 500 extra opcional).
  - **RN-02**: Volumen por toma (`meta / (vigilia_minutos / intervalo_minutos)`).
  - **RF-03 / RF-05**: Horario sugerido y cronograma estructurado de tomas diarias.
