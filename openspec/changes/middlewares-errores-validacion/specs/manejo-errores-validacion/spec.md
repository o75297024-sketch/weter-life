# Spec Delta

## Purpose

Proveer la capa transversal de manejo estandarizado de errores operacionales e imprevistos, validación declarativa de datos de entrada mediante middlewares y delimitación perimetral de CORS para la API REST de AguaRecordatorio.

## ADDED Requirements

### Requirement: Errores operacionales tipificados con AppError
El sistema SHALL proveer una clase de error operacional `AppError` que extienda de `Error` y SHALL almacenar un mensaje descriptivo, el código de estado HTTP numérico, la propiedad `status` con valor `"error"` y un indicador booleano `esOperacional` establecido en `true`.

#### Scenario: Instanciación de un error operacional
- **WHEN** un módulo de la API crea una instancia de `AppError` con el mensaje `"Recurso no encontrado"` y código 404
- **THEN** la instancia contiene `codigo` igual a 404, `status` igual a `"error"`, `esOperacional` igual a `true` y el mensaje asociado

#### Scenario: Código de estado por defecto
- **WHEN** se crea un `AppError` sin especificar un código de estado numérico válido
- **THEN** el sistema asigna el código HTTP 500 por defecto manteniendo su condición de error operacional

### Requirement: Formato uniforme y centralizado de respuestas de error
El sistema SHALL capturar todas las excepciones y errores propagados mediante un middleware de Express de cuatro parámetros `(err, req, res, next)` y SHALL responder con cabecera `Content-Type: application/json` y un cuerpo con la estructura `{ "status": "error", "codigo": <entero>, "mensaje": <cadena> }`.

#### Scenario: Procesamiento de error operacional AppError
- **WHEN** un controlador propaga un `AppError` con código 400 y mensaje `"Parámetros inválidos"`
- **THEN** el cliente recibe HTTP 400 con `{ "status": "error", "codigo": 400, "mensaje": "Parámetros inválidos" }`

#### Scenario: Procesamiento de JSON malformado
- **WHEN** un cliente envía un cuerpo con sintaxis JSON inválida en una petición POST o PUT
- **THEN** el sistema captura el error de sintaxis y responde HTTP 400 con un mensaje descriptivo sin interrumpir el proceso del servidor

### Requirement: Mapeo de errores de integridad de base de datos SQLite
El sistema SHALL interceptar las violaciones de restricciones de SQLite3 y SHALL mapear las restricciones de unicidad (`SQLITE_CONSTRAINT_UNIQUE`) a HTTP `409 Conflict` y las restricciones de validación o chequeo (`SQLITE_CONSTRAINT_CHECK`) a HTTP `400 Bad Request`.

#### Scenario: Violación de restricción de unicidad
- **WHEN** una operación de inserción o actualización falla con código de error SQLite `SQLITE_CONSTRAINT_UNIQUE` (por ejemplo, correo ya registrado)
- **THEN** el middleware responde con HTTP 409 Conflict y un mensaje comprensible sobre la duplicidad del recurso

#### Scenario: Violación de restricción de chequeo (check)
- **WHEN** una operación de base de datos infringe una regla `CHECK` de SQLite
- **THEN** el middleware responde con HTTP 400 Bad Request indicando que los datos no cumplen las restricciones permitidas

### Requirement: Ocultamiento de trazas técnicas en errores internos
Para errores no operacionales o excepciones imprevistas con código HTTP 500, el sistema MUST NOT exponer trazas de ejecución (`stack traces`), rutas del sistema de archivos ni detalles técnicos del motor de base de datos en las respuestas entregadas al cliente.

#### Scenario: Error no controlado en entorno de producción
- **WHEN** ocurre una excepción no controlada en el servidor y `NODE_ENV` está configurado en `"production"`
- **THEN** la respuesta HTTP es 500 con el mensaje genérico `"Ocurrió un error interno en el servidor."`

### Requirement: Validación interceptora de peticiones con validateRequest
El sistema SHALL proveer un middleware reusable `validateRequest` que verifique el resultado de las validaciones de `express-validator` y, si existen infracciones, MUST interceptar la petición antes de ejecutar el controlador de la ruta, respondiendo con HTTP `400 Bad Request` en el formato estándar.

#### Scenario: Petición con campos requeridos ausentes o inválidos
- **WHEN** una petición entrante no supera las reglas de validación configuradas
- **THEN** el middleware `validateRequest` interrumpe la cadena y devuelve HTTP 400 con `{ "status": "error", "codigo": 400, "mensaje": "<descripción del error>" }`

#### Scenario: Petición con datos válidos
- **WHEN** una petición entrante cumple todas las reglas de validación del esquema
- **THEN** el middleware `validateRequest` transfiere el control al siguiente handler de la ruta sin emitir respuesta prematura

### Requirement: Control perimetral de CORS configurable
El sistema SHALL configurar las cabeceras CORS en Express para permitir únicamente peticiones originadas desde los dominios especificados en la variable de entorno `CORS_ORIGIN`, y SHALL admitir comodín (`*`) cuando la variable no esté presente en entornos de desarrollo.

#### Scenario: Petición desde origen configurado
- **WHEN** un cliente web realiza una petición desde un origen declarado en `CORS_ORIGIN`
- **THEN** el servidor responde con las cabeceras `Access-Control-Allow-Origin` correspondientes

#### Scenario: Verificación previa (preflight) del navegador
- **WHEN** el navegador emite una petición HTTP `OPTIONS`
- **THEN** el servidor responde inmediatamente con código exitoso y cabeceras de autorización de métodos y cabeceras

### Requirement: Captura de rutas no registradas (404)
El sistema SHALL registrar un middleware previo al manejador global de errores que capture cualquier solicitud a rutas o verbos HTTP no implementados y SHALL propagar un `AppError` con código `404 Not Found`.

#### Scenario: Acceso a ruta no implementada
- **WHEN** un cliente realiza una petición a un endpoint inexistente (ej. `GET /api/no-existe`)
- **THEN** el sistema responde con HTTP 404 y cuerpo `{ "status": "error", "codigo": 404, "mensaje": "Ruta no encontrada: GET /api/no-existe" }`
