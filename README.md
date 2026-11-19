# AguaRecordatorio

PWA de recordatorios de hidratación. Calcula la meta diaria de agua según el peso
del usuario, programa tomas dentro de su ventana de vigilia, envía notificaciones
web y registra el consumo diario y las rachas.

## Stack

- **Frontend:** HTML5, CSS3 (BEM + variables) y JavaScript ES6+.
- **Backend:** Node.js + Express, API REST/JSON.
- **Base de datos:** SQLite3 (`agua_recordatorio.db`).

## Requisitos

- Node.js 20 o superior.
- `npm.cmd` / `npx.cmd` en Windows si PowerShell bloquea scripts `.ps1`.

## Instalación

```bash
npm.cmd install
```

Si `sqlite3` no encuentra un binario precompilado para tu versión de Node, instala
las herramientas de compilación de Visual Studio Build Tools y Python, o usa Node LTS.

## Ejecución

```bash
npm.cmd run dev     # nodemon, recarga automática
npm.cmd start       # node directo
```

La API escucha por defecto en `http://localhost:3000`.

### Variables de entorno

Copia `.env.example` a `.env` y ajusta lo necesario:

| Variable | Descripción | Valor por defecto |
| :--- | :--- | :--- |
| `PORT` | Puerto HTTP de la API | `3000` |
| `NODE_ENV` | Entorno de ejecución | `development` |

## Endpoints disponibles

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/health-check` | Verificación de salud de la API |

```json
{ "status": "ok", "message": "API AguaRecordatorio en funcionamiento" }
```

Todos los errores usan el formato estándar:

```json
{ "status": "error", "codigo": 500, "mensaje": "Ocurrió un error interno en el servidor." }
```

## Estructura

```text
src/backend/
├── config/database.js      # Conexión singleton a SQLite3
├── controllers/            # Controladores de los módulos
├── middlewares/            # errorHandler y futuros middlewares
├── models/                 # Consultas a la base de datos
├── routes/                 # Routers de la API
└── app.js                  # Punto de entrada
```

## Desarrollo guiado por especificaciones

Este proyecto usa **OpenSpec**. El flujo de trabajo y las convenciones están en
[`AGENTS.md`](AGENTS.md); los requisitos viven en `openspec/specs/` y los cambios
propuestos en `openspec/changes/`.

```bash
npx.cmd openspec list
npx.cmd openspec validate --all
```
