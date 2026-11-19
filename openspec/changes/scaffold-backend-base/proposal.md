# Proposal

## Why

El repositorio solo contiene documentación y el andamiaje de OpenSpec: no existe paquete de aplicación ni código ejecutable. Sin un esqueleto de servidor y una capa de acceso a datos no es posible implementar ninguno de los módulos del SRS (autenticación, horarios, recordatorios, consumo), ni validar localmente la API.

## What Changes

- Crear `package.json` de aplicación con las dependencias del stack (express, sqlite3, dotenv, cors, bcryptjs, jsonwebtoken, express-validator) y nodemon en desarrollo, conservando los scripts de OpenSpec ya existentes.
- Añadir los scripts `start` y `dev` que ejecutan `src/backend/app.js`.
- Crear el árbol `src/backend/` con `config/`, `controllers/`, `middlewares/`, `models/`, `routes/` y `app.js`.
- Implementar `src/backend/config/database.js`: conexión singleton a `src/backend/agua_recordatorio.db`, `PRAGMA foreign_keys = ON` al abrir y helpers `get`, `all`, `run` basados en Promesas (compatibles con `async/await` y sentencias preparadas).
- Crear `src/backend/middlewares/errorHandler.js` con el formato de error estándar `{ status, codigo, mensaje }` y soporte para errores con código HTTP propio.
- Crear `src/backend/app.js`: Express con JSON y `urlencoded`, CORS, inicialización de la base de datos, ruta `GET /api/health-check` y puerto desde `PORT` (3000 por defecto).
- Añadir `.env.example` con `PORT` y la ruta de la base de datos.

## Capabilities

### New Capabilities

- `plataforma-api`: arranque del servidor Express, verificación de salud de la API, formato estándar de respuestas de error y capa de acceso a SQLite con integridad referencial y helpers asíncronos.

### Modified Capabilities

Ninguna. Los requisitos funcionales de `autenticacion`, `hidratacion`, `recordatorios`, `consumo`, `notificaciones` e `interfaz-pwa` no cambian; este cambio solo habilita la infraestructura sobre la que se implementarán.

## Impact

- **Código nuevo:** `src/backend/config/database.js`, `src/backend/middlewares/errorHandler.js`, `src/backend/app.js` y directorios vacíos `controllers/`, `models/`, `routes/`.
- **Código modificado:** `package.json` (scripts y dependencias), `.gitignore` si hiciera falta.
- **Endpoints nuevos:** `GET /api/health-check`.
- **Dependencias nuevas:** express, sqlite3, dotenv, cors, bcryptjs, jsonwebtoken, express-validator; nodemon (dev).
- **Datos:** se creará el archivo `src/backend/agua_recordatorio.db` (ignorado por Git).
- **Riesgo:** `sqlite3` incluye un módulo nativo; si no hay binario precompilado para la versión de Node local, la instalación requiere herramientas de compilación (ver design.md).

## Out of Scope

- Esquema DDL de las tablas, seeds y migraciones (se abordará en un cambio posterior).
- Endpoints de autenticación, usuarios, horarios, recordatorios y consumo.
- Autenticación JWT, validaciones con express-validator y planificador de notificaciones push.
- Pruebas automatizadas, Docker y despliegue.
