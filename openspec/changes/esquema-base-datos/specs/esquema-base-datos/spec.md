# Spec Delta

## Purpose

Definir el esquema relacional de AguaRecordatorio en SQLite3 —tablas, restricciones e índices— y la forma segura e idempotente de aplicarlo al arrancar la API.

## ADDED Requirements

### Requirement: Tabla de usuarios
El esquema SHALL incluir la tabla `usuarios` con `id` autoincremental, `nombre` obligatorio, `correo_electronico` obligatorio y único, `contrasena_hash` obligatorio, `edad` restringida entre 5 y 120, `peso_kg` restringido entre 20.0 y 300.0, `meta_diaria_ml` obligatoria y `creado_en` con marca de tiempo por defecto.

#### Scenario: Alta de usuario mínima
- **WHEN** se inserta un usuario con nombre, correo único, hash, edad y peso dentro de rango, omitiendo `creado_en`
- **THEN** la fila se guarda y `creado_en` queda poblado con la fecha y hora de la inserción

#### Scenario: Correo electrónico duplicado
- **WHEN** se inserta un usuario con un `correo_electronico` ya existente
- **THEN** la base de datos rechaza la inserción por la restricción de unicidad

#### Scenario: Edad o peso fuera de rango
- **WHEN** se inserta un usuario con `edad` menor a 5 o mayor a 120, o con `peso_kg` fuera del rango 20.0 a 300.0
- **THEN** la base de datos rechaza la inserción por la restricción `CHECK`

#### Scenario: Meta diaria ausente
- **WHEN** se intenta insertar un usuario sin `meta_diaria_ml`
- **THEN** la base de datos rechaza la inserción por la restricción de obligatoriedad

### Requirement: Tabla de horarios
El esquema SHALL incluir la tabla `horarios` con `usuario_id` obligatorio referenciando `usuarios(id)` con `ON DELETE CASCADE`, `hora_inicio` y `hora_fin` en texto, `intervalo_minutos` mayor que cero, `cantidad_ml_por_toma` mayor que cero y `activo` con valor por defecto 1 restringido a 0 o 1.

#### Scenario: Definición de la llave foránea
- **WHEN** se consulta `PRAGMA foreign_key_list('horarios')`
- **THEN** el resultado contiene una referencia a la tabla `usuarios` con acción de borrado `CASCADE`

#### Scenario: Intervalo no positivo
- **WHEN** se inserta un horario con `intervalo_minutos` igual a 0 o negativo
- **THEN** la base de datos rechaza la inserción por la restricción `CHECK`

#### Scenario: Cantidad por toma no positiva
- **WHEN** se inserta un horario con `cantidad_ml_por_toma` igual a 0 o negativo
- **THEN** la base de datos rechaza la inserción por la restricción `CHECK`

#### Scenario: Indicador activo inválido
- **WHEN** se inserta un horario con `activo` distinto de 0 y de 1
- **THEN** la base de datos rechaza la inserción por la restricción `CHECK`

#### Scenario: Activo por defecto
- **WHEN** se inserta un horario omitiendo la columna `activo`
- **THEN** la fila queda guardada con `activo` igual a 1

### Requirement: Tabla de recordatorios
El esquema SHALL incluir la tabla `recordatorios` con `usuario_id` obligatorio referenciando `usuarios(id)` con `ON DELETE CASCADE`, `fecha` y `hora` en texto, `cantidad_ml` obligatoria y `estado` con valor por defecto `'pendiente'` restringido a `'pendiente'`, `'completado'` u `'omitido'`.

#### Scenario: Estado inicial de una toma
- **WHEN** se inserta un recordatorio omitiendo el estado
- **THEN** la fila queda guardada con estado `'pendiente'`

#### Scenario: Estado no permitido
- **WHEN** se inserta o actualiza un recordatorio con un estado distinto de los tres permitidos
- **THEN** la base de datos rechaza la operación por la restricción `CHECK`

#### Scenario: Recordatorio de un usuario inexistente
- **WHEN** se inserta un recordatorio con un `usuario_id` que no existe en `usuarios`
- **THEN** la base de datos rechaza la inserción por la llave foránea

### Requirement: Tabla de consumos
El esquema SHALL incluir la tabla `consumos` con `usuario_id` obligatorio referenciando `usuarios(id)` con `ON DELETE CASCADE`, `cantidad_ml` mayor que cero, `fecha` y `hora` en texto y `registrado_en` con marca de tiempo por defecto.

#### Scenario: Registro de consumo válido
- **WHEN** se inserta un consumo con cantidad positiva, fecha, hora y un usuario existente
- **THEN** la fila se guarda y `registrado_en` queda poblado automáticamente

#### Scenario: Cantidad no positiva
- **WHEN** se inserta un consumo con `cantidad_ml` igual a 0 o negativa
- **THEN** la base de datos rechaza la inserción por la restricción `CHECK`

### Requirement: Tabla de subscripciones push
El esquema SHALL incluir la tabla `subscripciones_push` con `usuario_id` obligatorio referenciando `usuarios(id)` con `ON DELETE CASCADE`, `endpoint`, `p256dh` y `auth` obligatorios.

#### Scenario: Suscripción completa
- **WHEN** se inserta una suscripción con endpoint, p256dh, auth y un usuario existente
- **THEN** la fila se guarda correctamente

#### Scenario: Suscripción incompleta
- **WHEN** se intenta insertar una suscripción sin `endpoint`, `p256dh` o `auth`
- **THEN** la base de datos rechaza la inserción por la restricción de obligatoriedad

### Requirement: Índices de consulta
El esquema SHALL crear el índice `idx_recordatorios_usuario_fecha` sobre `recordatorios(usuario_id, fecha)` y el índice `idx_consumos_usuario_fecha` sobre `consumos(usuario_id, fecha)`.

#### Scenario: Índice de recordatorios
- **WHEN** se consulta `PRAGMA index_list('recordatorios')`
- **THEN** el resultado incluye el índice `idx_recordatorios_usuario_fecha` sobre las columnas `usuario_id` y `fecha`, en ese orden

#### Scenario: Índice de consumos
- **WHEN** se consulta `PRAGMA index_list('consumos')`
- **THEN** el resultado incluye el índice `idx_consumos_usuario_fecha` sobre las columnas `usuario_id` y `fecha`, en ese orden

### Requirement: Inicialización idempotente
La inicialización del esquema SHALL poder ejecutarse varias veces sin error y sin duplicar tablas ni índices.

#### Scenario: Segundo arranque
- **WHEN** la API arranca sobre una base de datos que ya tiene el esquema aplicado
- **THEN** la inicialización termina correctamente y el esquema queda igual que antes

#### Scenario: Base de datos vacía
- **WHEN** la inicialización se ejecuta sobre un archivo sin tablas
- **THEN** se crean las cinco tablas y los dos índices en una sola ejecución

### Requirement: Inicialización atómica
La inicialización MUST ejecutarse dentro de una transacción, de modo que un fallo no deje tablas ni índices parciales.

#### Scenario: Fallo a mitad de la creación
- **WHEN** una de las sentencias de creación falla durante la inicialización
- **THEN** la transacción se revierte, no queda ninguna tabla nueva y el error se propaga al arranque

### Requirement: Esquema listo antes de aceptar peticiones
El servidor HTTP SHALL comenzar a escuchar solo después de que el esquema esté aplicado, y SHALL registrar en consola un mensaje que confirme que la base de datos y las tablas están listas.

#### Scenario: Arranque exitoso
- **WHEN** la API inicia con una base de datos accesible
- **THEN** el esquema se aplica primero y solo después el puerto queda a la escucha, mostrando el mensaje de confirmación

#### Scenario: Esquema no aplicable
- **WHEN** la creación del esquema falla
- **THEN** el proceso termina sin abrir el puerto y sin aceptar peticiones
