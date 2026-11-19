# Spec Delta

## Purpose

Proveer la base operativa de la API de AguaRecordatorio: servidor HTTP con CORS, verificación de salud, manejo uniforme de errores y una capa de acceso a SQLite con integridad referencial y consultas asíncronas.

## ADDED Requirements

### Requirement: Arranque del servidor HTTP
El sistema SHALL iniciar un servidor HTTP que escuche en el puerto definido por la variable de entorno `PORT` y SHALL usar 3000 cuando la variable no esté definida.

#### Scenario: Puerto por defecto
- **WHEN** se inicia la API sin definir `PORT`
- **THEN** el servidor queda escuchando en el puerto 3000 y responde las peticiones HTTP

#### Scenario: Puerto personalizado
- **WHEN** se inicia la API con `PORT` definido en el entorno
- **THEN** el servidor queda escuchando en ese puerto y no en el 3000

### Requirement: Procesamiento de cuerpos de petición
El sistema SHALL interpretar cuerpos JSON y cuerpos codificados como `application/x-www-form-urlencoded` en las peticiones entrantes.

#### Scenario: Cuerpo JSON
- **WHEN** una petición llega con `Content-Type: application/json` y un objeto válido
- **THEN** el cuerpo queda disponible como objeto JavaScript en el manejador de la ruta

#### Scenario: Cuerpo urlencoded
- **WHEN** una petición llega con `Content-Type: application/x-www-form-urlencoded`
- **THEN** el cuerpo queda disponible como objeto JavaScript en el manejador de la ruta

### Requirement: Intercambio con el cliente web
El sistema SHALL permitir peticiones de origen cruzado desde el cliente PWA y SHALL responder a las peticiones de verificación previa (preflight) del navegador.

#### Scenario: Petición desde el cliente PWA
- **WHEN** el frontend alojado en otro origen llama a un endpoint de la API
- **THEN** la respuesta incluye las cabeceras CORS y el navegador no bloquea la lectura del cuerpo

#### Scenario: Verificación previa del navegador
- **WHEN** el navegador envía una petición `OPTIONS` a un endpoint de la API
- **THEN** el servidor responde con las cabeceras CORS correspondientes y sin error

### Requirement: Verificación de salud de la API
El sistema SHALL exponer `GET /api/health-check` y SHALL responder `200 OK` con el cuerpo `{ "status": "ok", "message": "API AguaRecordatorio en funcionamiento" }` sin requerir autenticación.

#### Scenario: Consulta de salud exitosa
- **WHEN** un cliente solicita `GET /api/health-check`
- **THEN** recibe `200 OK` con `status` igual a `"ok"` y el mensaje `"API AguaRecordatorio en funcionamiento"`

#### Scenario: Salud sin sesión iniciada
- **WHEN** la petición de salud no incluye token de autenticación
- **THEN** el servidor responde igualmente `200 OK`

### Requirement: Formato estándar de errores
Toda respuesta de error de la API SHALL usar el cuerpo `{ "status": "error", "codigo": <entero>, "mensaje": <texto> }`, con `status` igual a `"error"`, `codigo` igual al código HTTP devuelto y `mensaje` descriptivo en español.

#### Scenario: Error interno no controlado
- **WHEN** un manejador lanza una excepción no capturada
- **THEN** el cliente recibe `500 Internal Server Error` con `{ "status": "error", "codigo": 500, "mensaje": "..." }`

#### Scenario: Error con código propio
- **WHEN** un manejador reporta un error con código `404`
- **THEN** el cliente recibe `404 Not Found` con `codigo` igual a 404 y el mensaje asociado, sin convertirse en 500

### Requirement: Ocultamiento de detalles internos en errores
El sistema MUST NOT incluir trazas de pila, rutas absolutas del servidor ni mensajes de error del motor de base de datos en las respuestas 500 enviadas al cliente.

#### Scenario: Error inesperado en producción
- **WHEN** se produce una excepción interna durante una petición
- **THEN** el cuerpo de la respuesta contiene un mensaje genérico y ningún detalle técnico interno

### Requirement: Conexión única a la base de datos
El sistema SHALL abrir una sola conexión al archivo `agua_recordatorio.db` ubicado en la raíz de `src/backend/` y SHALL reutilizarla durante toda la vida del proceso.

#### Scenario: Reutilización de la conexión
- **WHEN** varios módulos solicitan acceso a la base de datos dentro del mismo proceso
- **THEN** todos operan sobre la misma conexión abierta y el archivo no se abre más de una vez

#### Scenario: Archivo inexistente
- **WHEN** la API arranca y el archivo de base de datos aún no existe
- **THEN** la conexión se crea correctamente y el servidor queda operativo

### Requirement: Integridad referencial activa
La conexión MUST habilitar `PRAGMA foreign_keys = ON` al abrirse y MUST mantenerlo activo en cada conexión del proceso.

#### Scenario: Inserción con referencia inexistente
- **WHEN** se intenta insertar una fila cuyo valor de llave foránea no existe en la tabla referenciada
- **THEN** SQLite rechaza la operación con un error de restricción de llave foránea

#### Scenario: Eliminación en cascada
- **WHEN** se elimina un usuario que tiene registros dependientes definidos con `ON DELETE CASCADE`
- **THEN** los registros dependientes se eliminan en la misma operación

### Requirement: Acceso asíncrono a datos
El sistema SHALL ofrecer operaciones de lectura de una fila, lectura de varias filas y escritura que puedan consumirse con `async/await`, y MUST enviar los valores como parámetros enlazados en lugar de concatenarlos en la sentencia SQL.

#### Scenario: Lectura asíncrona
- **WHEN** un módulo consulta un registro usando `await` sobre la operación de lectura
- **THEN** recibe el resultado resuelto o un error rechazado, sin usar callbacks

#### Scenario: Escritura con parámetros enlazados
- **WHEN** un módulo inserta datos con valores recibidos de una petición
- **THEN** los valores viajan como parámetros de la sentencia y no forman parte del texto SQL

#### Scenario: Fallo de consulta
- **WHEN** una sentencia SQL es inválida
- **THEN** la operación asíncrona se rechaza con un error que el middleware de errores puede manejar
