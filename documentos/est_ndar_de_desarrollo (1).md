# Estándar de Desarrollo y Convenciones de Código
**Proyecto:** AguaRecordatorio  
**Versión:** 1.0.0  
**Estado:** Especificación Técnica de Estándares (SDD)  
**Stack Tecnológico:** HTML5, CSS3, JavaScript (ES6+), Node.js (Express), SQLite3  

---

## 1. Introducción

### 1.1 Propósito
Este documento establece las reglas, convenciones de nombres, estructura de archivos y buenas prácticas de programación que se deben seguir obligatoriamente durante la construcción de la aplicación **AguaRecordatorio**. El objetivo es garantizar un código limpio, legible, mantenible y escalable.

---

## 2. Convenciones de Nombres (Naming Conventions)

### 2.1 Resumen por Capa y Lenguaje

| Elemento | Lenguaje / Entorno | Convención | Ejemplo |
| :--- | :--- | :--- | :--- |
| **Archivos Frontend** | HTML, CSS, JS | `kebab-case` | `user-profile.js`, `main-styles.css` |
| **Archivos Backend** | Node.js | `kebab-case` o `camelCase` | `auth-controller.js`, `userModel.js` |
| **Variables y Funciones** | JavaScript | `camelCase` | `calcularMetaDiaria()`, `usuarioId` |
| **Clases** | JavaScript | `PascalCase` | `NotificationService`, `DatabaseConnection` |
| **Constantes Globales** | JavaScript | `UPPER_SNAKE_CASE` | `MAX_WATER_LIMIT`, `PORT` |
| **Tablas de Base de Datos** | SQLite | `snake_case` (Plural) | `usuarios`, `recordatorios` |
| **Columnas de Base de Datos**| SQLite | `snake_case` (Singular) | `peso_kg`, `cantidad_ml`, `hora_inicio` |
| **Rutas de API REST** | HTTP Endpoints | `kebab-case` (Plural) | `/api/usuarios/{id}/consumo` |

---

## 3. Estructura del Proyecto (Directorio de Archivos)

```text
agua-recordatorio/
├── docs/                      # Documentación del proyecto (SRS, UI/UX, SDD)
├── src/
│   ├── backend/               # Servidor Node.js
│   │   ├── config/            # Configuración de base de datos y entorno
│   │   │   └── database.js
│   │   ├── controllers/       # Lógica de procesamiento de endpoints
│   │   │   ├── authController.js
│   │   │   ├── userController.js
│   │   │   └── consumptionController.js
│   │   ├── middlewares/       # Validaciones y autenticación (JWT)
│   │   │   └── authMiddleware.js
│   │   ├── models/            # Consultas e interacción con SQLite3
│   │   │   ├── userModel.js
│   │   │   └── reminderModel.js
│   │   ├── routes/            # Definición de rutas de la API REST
│   │   │   ├── authRoutes.js
│   │   │   └── userRoutes.js
│   │   └── app.js             # Punto de entrada de la aplicación Node.js
│   │
│   └── frontend/              # Cliente PWA (HTML/CSS/JS)
│       ├── assets/
│       │   ├── css/           # Hoja de estilos modular
│       │   │   ├── variables.css
│       │   │   ├── typography.css
│       │   │   └── style.css
│       │   ├── js/            # Scripts del cliente
│       │   │   ├── api.js     # Cliente Fetch HTTP
│       │   │   ├── app.js     # Lógica principal del Dashboard
│       │   │   └── sw.js      # Service Worker para Notificaciones Push
│       │   └── icons/         # Iconografía y recursos gráficos
│       └── index.html         # Vista principal
│
├── .gitignore
├── package.json
└── README.md
```

---

## 4. Guía de Estilo y Reglas de Código

### 4.1 JavaScript (Frontend & Backend ES6+)
* **Declaración de Variables:** Utilizar `const` por defecto para valores que no cambian y `let` para variables reasignables. Queda estrictamente prohibido el uso de `var`.
* **Asincronía:** Utilizar únicamente `async/await` para el manejo de promesas en llamadas a base de datos y peticiones HTTP. Evitar callbacks y cadenas de `.then()`.
* **Manejo de Errores:** Bloques `try/catch` obligatorios en todos los controladores de backend y peticiones `fetch` del frontend.

```javascript
// ✅ Correcto (Backend - Controller)
const registrarConsumo = async (req, res) => {
  try {
    const { cantidad_ml, hora, fecha } = req.body;
    if (!cantidad_ml || !hora) {
      return res.status(400).json({ error: "Datos incompletos o incorrectos." });
    }
    const nuevoConsumo = await consumptionModel.create({ cantidad_ml, hora, fecha });
    return res.status(201).json(nuevoConsumo);
  } catch (error) {
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};
```

### 4.2 HTML5 y CSS3 (Frontend)
* **HTML Semántico:** Utilizar etiquetas semánticas (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`).
* **CSS BEM (Block Element Modifier):** Para la estructuración de clases en CSS:
  * Block: `.reminder-card`
  * Element: `.reminder-card__time`
  * Modifier: `.reminder-card--completed`
* **Variables CSS:** Prohibido escribir códigos de color Hexadecimales directo en las reglas de componentes. Utilizar siempre las variables globales definidas (`var(--color-primary)`).

### 4.3 Base de Datos (SQLite3)
* **Sentencias Preparadas (Prepared Statements):** Es obligatorio el uso de parámetros parametrizados (`?`) en todas las consultas SQL para prevenir inyecciones de código SQL (SQL Injection).

```javascript
// ✅ Correcto (Uso de Prepared Statements)
const obtenerUsuarioPorId = (id) => {
  const sql = `SELECT id, nombre, edad, peso_kg FROM usuarios WHERE id = ?`;
  return db.get(sql, [id]);
};
```

---

## 5. Estándar de Commit y Control de Versiones (Git)

Para mantener un historial de cambios claro, los commits en Git deben seguir el estándar **Conventional Commits**:

### 5.1 Estructura del Mensaje de Commit
`<tipo>: <descripción corta en presente y minúsculas>`

### 5.2 Tipos Permitidos
* `feat`: Una nueva funcionalidad (ej. `feat: agregar endpoint para registro de consumo`).
* `fix`: Corrección de un error o bug (ej. `fix: corregir calculo de racha diaria`).
* `docs`: Cambios en la documentación (ej. `docs: actualizar especificacion SRS`).
* `style`: Cambios en formatos, CSS o tipografía sin afectar lógica (ej. `style: aplicar paleta de colores a botones`).
* `refactor`: Reestructuración de código sin cambiar su comportamiento.

---

## 6. Estándar para Diseños de API REST

1. **Formatos de Intercambio:** `application/json`.
2. **Códigos de Respuesta Estándar:**
   * `200 OK`: Consulta exitosa.
   * `201 Created`: Recurso creado exitosamente.
   * `400 Bad Request`: Datos de entrada inválidos.
   * `401 Unauthorized`: Falta de token o credenciales incorrectas.
   * `404 Not Found`: Recurso no encontrado.
   * `500 Internal Server Error`: Error no controlled en backend.
3. **Estructura Estándar de Respuesta de Error:**
```json
{
  "status": "error",
  "codigo": 400,
  "mensaje": "El campo 'peso_kg' es obligatorio y debe ser un número positivo."
}
```