# Tasks

## 1. Implementación del Servicio de Hidratación (Backend - Services)

- [x] 1.1 Crear `src/backend/services/hydrationService.js` definiendo las constantes globales `ML_POR_KG = 35`, `EXTRA_ACTIVIDAD_O_CLIMA_ML = 500` y `HORARIO_DEFAULT` con comentarios JSDoc en español.
- [x] 1.2 Implementar helpers de tiempo (`horaAMinutos`, `minutosAHora`) y la función `calcularHorasVigilia(horaInicio, horaFin)` validando formato 24h `"HH:MM"` y `horaFin > horaInicio`.
- [x] 1.3 Implementar `calcularMetaDiaria(pesoKg, factorExtra = false)` aplicando la fórmula de RN-01 con redondeo al entero más cercano.
- [x] 1.4 Implementar `calcularVolumenPorToma(metaDiariaMl, horaInicio, horaFin, intervaloMinutos)` aplicando la fórmula de RN-02 y validando restricciones de intervalo.
- [x] 1.5 Implementar `generarCronogramaTomas({ horaInicio, horaFin, intervaloMinutos, cantidadMlPorToma })` retornando la lista secuencial de tomas con estado `"pendiente"`.

## 2. Verificación y Validación de la Propuesta

- [x] 2.1 Validar mediante script de pruebas unitarias automatizadas todos los cálculos matemáticos, redondeos y manejo de errores con `AppError`.
- [x] 2.2 Ejecutar `npx openspec validate --all` para confirmar la conformidad de especificaciones y artefactos de cambio.
