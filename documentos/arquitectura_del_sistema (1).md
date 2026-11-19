# Documento de Arquitectura de Software y Diseño de Base de Datos

**Proyecto:** AguaRecordatorio  
**Versión:** 1.0.0  
**Estado:** Especificación de Diseño Técnico (SDD)  
**Stack Tecnológico:** HTML5, CSS3, JavaScript (ES6+), Node.js (Express), SQLite3  

---

## 1. Visión General de la Arquitectura

El sistema **AguaRecordatorio** adopta una arquitectura en capas basada en el patrón cliente-servidor para aplicaciones web progresivas (PWA).

```
+-------------------------------------------------------------------+
|                        CAPA DE PRESENTACIÓN                       |
|          Cliente PWA (HTML5 / CSS3 / JavaScript ES6+)             |
|   [ Dashboard ] <---> [ Service Worker ] <---> [ Web Push API ]   |
+-------------------------------------------------------------------+
                                  |
                           HTTP / REST (JSON)
                                  v
+-------------------------------------------------------------------+
|                         CAPA DE NEGOCIO                           |
|                    Backend (Node.js + Express)                    |
|   [ Auth / JWT ] ---> [ Controllers ] ---> [ Scheduler Service ]  |
+-------------------------------------------------------------------+
                                  |
                             SQLite Driver
                                  v
+-------------------------------------------------------------------+
|                        CAPA DE PERSISTENCIA                       |
|                          Base de Datos                            |
|                            (SQLite3)                              |
+-------------------------------------------------------------------+
```

### 1.1 Capas del Sistema
1. **Capa de Presentación (Frontend):** Interfaz móvil accesible desde navegadores web. Implementa Service Workers para recepción de notificaciones Push y almacenamiento en caché local.
2. **Capa de Aplicación (Backend):** Servidor HTTP creado en Node.js con Express. Maneja la lógica del cálculo de agua, autenticación por JWT y despacho de notificaciones.
3. **Capa de Datos (Persistencia):** Motor relacional liviano (SQLite3) que almacena la información persistente con llaves foráneas habilitadas.

---

## 2. Diseño de Base de Datos (SQLite)

### 2.1 Diagrama Entidad-Relación (Lógico)

* **usuarios** (1) <--- (N) **horarios**
* **usuarios** (1) <--- (N) **recordatorios**
* **usuarios** (1) <--- (N) **consumos**
* **usuarios** (1) <--- (N) **subscripciones_push**

---

### 2.2 Esquema DDL (SQL para SQLite3)

```sql
-- Habilitar integridad referencial en SQLite
PRAGMA foreign_keys = ON;

-- 1. Tabla de Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    correo_electronico TEXT NOT NULL UNIQUE,
    contrasena_hash TEXT NOT NULL,
    edad INTEGER NOT NULL CHECK(edad BETWEEN 5 AND 120),
    peso_kg REAL NOT NULL CHECK(peso_kg BETWEEN 20.0 AND 300.0),
    meta_diaria_ml INTEGER NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Horarios de Hidratación
CREATE TABLE IF NOT EXISTS horarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    hora_inicio TEXT NOT NULL, -- Formato "HH:MM" (24h)
    hora_fin TEXT NOT NULL,    -- Formato "HH:MM" (24h)
    intervalo_minutos INTEGER NOT NULL CHECK(intervalo_minutos > 0),
    cantidad_ml_por_toma INTEGER NOT NULL CHECK(cantidad_ml_por_toma > 0),
    activo INTEGER DEFAULT 1 CHECK(activo IN (0, 1)),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 3. Tabla de Recordatorios Generados
CREATE TABLE IF NOT EXISTS recordatorios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,       -- Formato "YYYY-MM-DD"
    hora TEXT NOT NULL,        -- Formato "HH:MM"
    cantidad_ml INTEGER NOT NULL,
    estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'completado', 'omitido')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 4. Tabla de Consumos de Agua
CREATE TABLE IF NOT EXISTS consumos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    cantidad_ml INTEGER NOT NULL CHECK(cantidad_ml > 0),
    fecha TEXT NOT NULL,       -- Formato "YYYY-MM-DD"
    hora TEXT NOT NULL,        -- Formato "HH:MM"
    registrado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 5. Tabla de Subscripciones Web Push (Notificaciones)
CREATE TABLE IF NOT EXISTS subscripciones_push (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Índices para Optimización de Consultas Frecuentes
CREATE INDEX IF NOT EXISTS idx_recordatorios_usuario_fecha 
ON recordatorios(usuario_id, fecha);

CREATE INDEX IF NOT EXISTS idx_consumos_usuario_fecha 
ON consumos(usuario_id, fecha);
```

---

## 3. Especificación de la API REST (Endpoints)

### 3.1 Módulo de Autenticación (`/api/auth`)

#### `POST /api/auth/registro`
* **Descripción:** Registra un nuevo usuario y calcula automáticamente su meta diaria de agua.
* **Cuerpo de la Petición (JSON):**
```json
{
  "nombre": "Leonardo",
  "correo_electronico": "leonardo@email.com",
  "contrasena": "Password123",
  "edad": 14,
  "peso_kg": 55
}
```
* **Respuestas:**
  * `201 Created`: Usuario creado exitosamente. Retorna token JWT.
  * `400 Bad Request`: Datos de entrada inválidos.
  * `409 Conflict`: El correo electrónico ya está registrado.

#### `POST /api/auth/login`
* **Descripción:** Autentica a un usuario registrado.
* **Cuerpo de la Petición (JSON):**
```json
{
  "correo_electronico": "leonardo@email.com",
  "contrasena": "Password123"
}
```
* **Respuestas:**
  * `200 OK`: Autenticación exitosa. Retorna token JWT y datos de perfil.
  * `401 Unauthorized`: Credenciales incorrectas.

---

### 3.2 Módulo de Usuarios y Horarios (`/api/usuarios`)

#### `POST /api/usuarios/{id}/horarios`
* **Descripción:** Establece la ventana horaria activa y los intervalos de recordatorio.
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Cuerpo de la Petición (JSON):**
```json
{
  "hora_inicio": "07:00",
  "hora_fin": "21:00",
  "intervalo_minutos": 120,
  "cantidad_ml": 250
}
```
* **Respuestas:**
  * `201 Created`: Horario guardado y programa de recordatorios generado.
  * `400 Bad Request`: Formato de hora o intervalo no válido.
  * `404 Not Found`: Usuario no encontrado.

---

### 3.3 Módulo de Recordatorios y Consumo (`/api/usuarios`)

#### `GET /api/usuarios/{id}/recordatorios?fecha=YYYY-MM-DD`
* **Descripción:** Obtiene los recordatorios de una fecha específica.
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Respuestas:**
  * `200 OK`:
```json
{
  "usuario_id": 1,
  "fecha": "2026-10-28",
  "meta_diaria_ml": 1925,
  "consumido_total_ml": 500,
  "recordatorios": [
    { "id": 10, "hora": "07:00", "cantidad_ml": 250, "estado": "completado" },
    { "id": 11, "hora": "09:00", "cantidad_ml": 250, "estado": "completado" },
    { "id": 12, "hora": "11:00", "cantidad_ml": 250, "estado": "pendiente" }
  ]
}
```

#### `POST /api/usuarios/{id}/consumo`
* **Descripción:** Registra una toma de agua realizada por el usuario.
* **Headers:** `Authorization: Bearer <JWT_TOKEN>`
* **Cuerpo de la Petición (JSON):**
```json
{
  "cantidad_ml": 250,
  "hora": "09:05",
  "fecha": "2026-10-28"
}
```
* **Respuestas:**
  * `201 Created`: Consumo registrado correctamente.
  * `400 Bad Request`: Datos de consumo incompletos.

---

## 4. Estrategia de Notificaciones Push

1. **Suscripción:** El cliente (PWA) solicita permiso para notificaciones en el navegador y envía la suscripción (`endpoint`, `p256dh`, `auth`) al backend (`POST /api/usuarios/{id}/push-subscription`).
2. **Monitoreo:** En el backend, un temporizador en segundo plano (Scheduler Node.js) evalúa cada minuto la tabla `recordatorios`.
3. **Despacho:** Si coincide la fecha, hora actual y el estado es `'pendiente'`, el backend envía una notificación push usando la librería `web-push`.
4. **Recepción:** El `Service Worker` del cliente captura el evento push y muestra una notificación en el dispositivo del usuario.