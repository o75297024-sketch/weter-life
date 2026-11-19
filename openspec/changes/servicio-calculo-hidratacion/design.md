# Design

## Context

Véase `proposal.md` para la motivación general del cambio. El sistema `AguaRecordatorio` requiere que la lógica de cálculo hídrico (RN-01, RN-02) y la planificación de tomas (RF-03, RF-05) sea independiente de la infraestructura de almacenamiento (SQLite) y del framework de transporte (Express).

Centralizar estas reglas en `src/backend/services/hydrationService.js` mediante funciones puras permite realizar pruebas unitarias deterministas, reutilizar los cálculos en el registro de usuarios, en la actualización de horarios y en los cronjobs de generación diaria de tomas.

## Goals / Non-Goals

**Goals:**
- Implementar constantes inmutables en `UPPER_SNAKE_CASE`:
  - `ML_POR_KG = 35`
  - `EXTRA_ACTIVIDAD_O_CLIMA_ML = 500`
  - `HORARIO_DEFAULT = Object.freeze({ hora_inicio: "07:00", hora_fin: "21:00", intervalo_minutos: 120 })`
- Implementar funciones puras:
  - `calcularMetaDiaria(pesoKg, factorExtra = false)`
  - `calcularHorasVigilia(horaInicio, horaFin)`
  - `calcularVolumenPorToma(metaDiariaMl, horaInicio, horaFin, intervaloMinutos)`
  - `generarCronogramaTomas({ horaInicio, horaFin, intervaloMinutos, cantidadMlPorToma })`
- Validación rigurosa de horas en formato militar `"HH:MM"` (regex estricto `^([01]\d|2[0-3]):([0-5]\d)$`), verificando que `horaFin > horaInicio`.
- Lanzamiento de `AppError(mensaje, 400)` cuando los argumentos violen las restricciones de dominio.

**Non-Goals:**
- Insertar registros en `recordatorios` o `horarios` (eso compete a los modelos y controladores).
- Manejo de zonas horarias complejas o desfases UTC (las horas se manejan en tiempo local del usuario como cadenas `"HH:MM"`).

## Decisions

### Decisión 1: Conversión a minutos para operaciones de tiempo
- **Elección**: Crear un helper interno `horaAMinutos(horaStr)` que transforme `"HH:MM"` en minutos desde la medianoche (`horas * 60 + minutos`), y `minutosAHora(minutos)` para el proceso inverso.
- **Razón**: Simplifica las comparaciones aritméticas, el cálculo de diferencias y los incrementos de intervalo sin lidiar con objetos `Date` ni riesgos de desbordamientos de fecha.
- **Alternativa descartada**: Usar objetos `new Date()` o bibliotecas externas como `date-fns`/`moment`; introduce dependencias innecesarias y problemas con fechas absolutas cuando solo se manejan horas de vigilia del día.

### Decisión 2: Lanzamiento de `AppError` en validaciones de dominio
- **Elección**: Si el formato de hora es inválido, si `horaFin <= horaInicio` o si `intervaloMinutos <= 0`, lanzar `new AppError(..., 400)`.
- **Razón**: Permite que cualquier controlador que invoque el servicio propague automáticamente el error al middleware global `errorHandler.js` con el código HTTP 400 y el contrato `{ status: 'error', codigo: 400, mensaje: ... }`.

### Decisión 3: Redondeo matemático simétrico
- **Elección**: Usar `Math.round()` tanto para `calcularMetaDiaria` como para `calcularVolumenPorToma`.
- **Razón**: Cumple con las especificaciones del estándar de desarrollo y SRS, garantizando enteros limpios en mililitros sin decimales en base de datos ni UI.

## Endpoints, Tablas y Validaciones Afectadas

- **Servicios afectados**:
  - `src/backend/services/hydrationService.js` (nuevo).
- **Controladores futuros que consumirán el servicio**:
  - `authController.js`: Al registrar usuario, calculará la meta y asociará el horario por defecto.
  - `scheduleController.js`: Al modificar horarios, recalculará dosis y tomas.
  - `reminderController.js`: Al iniciar el día, generará los recordatorios usando `generarCronogramaTomas`.
- **Validaciones**:
  - Formato estricto de hora `"HH:MM"`.
  - Peso positivo numérico (`pesoKg > 0`).
  - Intervalos enteros positivos mayores a cero y menores que la vigilia total.

## Risks / Trade-offs

- **[Riesgo] Dosis que no suman exactamente la meta diaria debido a redondeos** → *Mitigación*: La última toma del día puede absorber ligeras diferencias o mantenerse simétrica; el estándar de negocio especifica `Math.round` para dosis uniformes y predecibles.
- **[Riesgo] Vigilias nocturnas (que cruzan la medianoche, ej. 22:00 a 06:00)** → *Mitigación*: El SRS actual modela la vigilia dentro del mismo día (`horaFin > horaInicio`). Se documenta la restricción y se valida con error 400 en caso contrario.
