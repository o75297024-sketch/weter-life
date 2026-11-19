# Especificación de Requerimientos de Software (SRS) - Completa y Detallada

**Proyecto:** AguaRecordatorio  
**Versión:** 1.1.0  
**Fecha:** 28 de Octubre de 2026  
**Stack Tecnológico:** HTML5, CSS3, JavaScript Vanilla (Frontend) | Node.js, Express (Backend) | SQLite3 (Base de Datos)  
**Arquitectura:** RESTful API / Client-Server Architecture (SPA)

---

## 1. Introducción

### 1.1 Propósito
El propósito de este documento es especificar formalmente los requerimientos funcionales, no funcionales, reglas de negocio y restricciones del sistema **AguaRecordatorio**. Servirá como la guía técnica definitiva para la arquitectura, el modelado de datos SQLite, el desarrollo de la API REST y la construcción del cliente web responsive.

### 1.2 Alcance del Sistema
**AguaRecordatorio** es una Web App (Single Page Application) que calcula de forma personalizada el consumo hídrico óptimo para un usuario basándose en sus métricas físicas (`peso_kg`, `edad`), calcula cronogramas de recordatorio de hidratación, envía notificaciones web en tiempo real, lleva un registro histórico de ingesta y contabiliza métricas de hábito (rachas y porcentajes de cumplimiento).

---

## 2. Descripción General y Arquitectura del Sistema

### 2.1 Vista General de la Arquitectura
El sistema se organiza en tres componentes desacoplados:
1. **Frontend (Cliente Web SPA):** Interfaz desarrollada en HTML5 semántico, CSS3 puro (siguiendo la guía de estilos visuales) y JavaScript ES6+ asíncrono (`fetch API`). Implementa almacenamiento local (`localStorage`) para tokens de sesión y la *Web Notifications API* para alertas.
2. **Backend (Servidor API REST):** Aplicación en Node.js con Express que expone endpoints RESTful con formato de intercambio JSON, validación estricta de esquemas, hash de contraseñas (`bcryptjs`) y control de autenticación mediante Tokens JWT (*JSON Web Token*).
3. **Base de Datos (Persistencia):** Motor relacional SQLite3 incrustado mediante controlador nativo para Node.js, configurado para garantizar la integridad referencial y transaccionalidad.

---

## 3. Reglas de Negocio (RN)

* **RN-01 (Cálculo de Meta Diaria de Agua):** La meta diaria por defecto de hidratación se calcula con la fórmula estándar:
  $$\text{Meta Diaria (ml)} = \text{peso\_kg} \times 35 \text{ ml}$$
  *Si el usuario especifica actividad física o condiciones climáticas severas, se aplicará un factor multiplicador regulable ($+500 \text{ ml}$).*
* **RN-02 (Cálculo de Intervalos de Recordatorio):** Los recordatorios se distribuyen únicamente dentro del rango de vigilia definido por el usuario (`hora_inicio` y `hora_fin`). El volumen por dosis se obtiene mediante:
  $$\text{Volumen por Toma (ml)} = \frac{\text{Meta Diaria (ml)}}{\left(\frac{\text{Horas de Vigilia} \times 60}{\text{intervalo\_minutos}}\right)}$$
* **RN-03 (Cómputo de Racha Diaria):** Se considera un "Día Cumplido" para la racha cuando el total de agua consumida en la fecha ($T_c$) es mayor o igual al $80\%$ de la meta diaria programada ($M_d$):
  $$\text{Cumplimiento} \ge 0.80 \times M_d$$
  Si un usuario no alcanza el $80\%$ en un día calendario completo, la racha activa se reinicia a 0.

---

## 4. Requerimientos Funcionales (RF)

### Módulo 1: Autenticación y Gestión de Usuarios

* **RF-01: Registro de Usuarios**
  * **RF-01.1 (Captura de Datos):** El sistema debe registrar un nuevo usuario mediante un formulario que solicite: `nombre_completo` (String, max 100), `correo` (Email único), `password` (String, min 8 caracteres), `edad` (Integer: 10 - 120) y `peso_kg` (Decimal: 30.0 - 250.0).
  * **RF-01.2 (Seguridad):** La contraseña nunca se almacenará en texto plano; el backend debe procesarla mediante un algoritmo de hashing `bcrypt` con un factor de costo mínimo de 10.
  * **RF-01.3 (Validaciones):** Si el correo ya existe en SQLite, el servidor devolverá un código HTTP `409 Conflict`. Si los datos no cumplen el formato, devolverá `400 Bad Request`.

* **RF-02: Inicio de Sesión y Control de Acceso**
  * **RF-02.1 (Autenticación JWT):** El endpoint `/api/auth/login` validará las credenciales y retornará un token JWT con tiempo de expiración (ej. 24 horas) y los datos básicos del usuario.
  * **RF-02.2 (Persistencia de Sesión):** El cliente JavaScript almacenará el JWT en `localStorage` o `sessionStorage` y lo adjuntará en las cabeceras `Authorization: Bearer <token>` de cada petición HTTP protegida.

---

### Módulo 2: Configuración de Horarios y Cálculo de Metas

* **RF-03: Cálculo y Generación Automática de Horario**
  * **RF-03.1 (Generación Sugerida):** Tras el registro, el sistema calculará automáticamente la meta diaria en ml según **RN-01** y sugerirá una configuración estándar (`hora_inicio`: "07:00", `hora_fin`: "21:00", `intervalo_minutos`: 120).
  * **RF-03.2 (Personalización de Horario):** El usuario podrá modificar en cualquier momento su rango de vigilia (`hora_inicio`, `hora_fin`), la frecuencia (`intervalo_minutos`) y ajustar manualmente la meta diaria recomendada.

* **RF-04: Consulta de Horario Activo**
  * **RF-04.1:** Permite al cliente recuperar la configuración del horario vigente del usuario autenticado para inicializar los temporizadores del Frontend.

---

### Módulo 3: Monitoreo, Recordatorios y Notificaciones

* **RF-05: Generación y Consulta de Recordatorios Diarios**
  * **RF-05.1 (Generación de Tomas):** El backend calculará dinámicamente el listado de tomas programadas para la fecha actual consultada.
  * **RF-05.2 (Estado de Toma):** Cada toma tendrá un estado computable: `"pendiente"`, `"completado"` o `"omitido"`.
  * **RF-05.3 (Consulta por Fecha):** El endpoint `GET /api/usuarios/{id}/recordatorios?fecha=YYYY-MM-DD` devolverá la matriz de recordatorios del día.

* **RF-06: Notificaciones en Frontend (Web Notifications API)**
  * **RF-06.1 (Permisos):** El Frontend solicitará permiso explícito al navegador para activar las Notificaciones Web (`Notification.requestPermission()`).
  * **RF-06.2 (Disparo de Alerta):** Un temporizador en JS (`setInterval` o Service Worker) comprobará cada minuto la hora actual frente a la lista de recordatorios pendientes y disparará una notificación flotante de escritorio/móvil con sonido opcional al coincidir la hora.

---

### Módulo 4: Registro de Consumo e Historial

* **RF-07: Registro de Ingesta de Agua**
  * **RF-07.1 (Captura de Evento):** El usuario podrá registrar un consumo manual o confirmar una toma de agua proporcionando: `cantidad_ml` (Integer), `fecha_hora` (Timestamp ISO 8601).
  * **RF-07.2 (Actualización de Estado):** Al registrar una cantidad que cubra una toma pendiente, el backend actualizará el estado del recordatorio correspondiente a `"completado"`.
  * **RF-07.3 (Deshacer / Eliminar Consumo):** El usuario podrá eliminar un registro de consumo cargado por error durante el mismo día en curso.

* **RF-08: Visualización de Progreso y Rachas**
  * **RF-08.1 (Barra de Progreso Diaria):** El Frontend calculará el porcentaje alcanzado ($(\text{Consumo Total} / \text{Meta Diaria}) \times 100$) y actualizará la UI en tiempo real.
  * **RF-08.2 (Contador de Racha):** El sistema mostrará la cantidad de días consecutivos en los que el usuario ha alcanzado o superado el $80\%$ de su meta (**RN-03**).

* **RF-09: Panel de Indicaciones y Consejos de Salud**
  * **RF-09.1:** La aplicación incluirá una sección estática/dinámica con recomendaciones sobre hábitos saludables de hidratación, la temperatura ideal del agua y pautas de consumo durante el ejercicio.

---

## 5. Requerimientos No Funcionales (RNF)

### RNF-01: Rendimiento y Eficiencia
* **RNF-01.1 (Tiempo de Respuesta API):** Las peticiones a la API REST servidas por Node.js y SQLite deben responder en menos de 200 ms en condiciones normales de carga local.
* **RNF-01.2 (Ligereza del Cliente):** El paquete del Frontend (HTML, CSS, JS) no debe superar los 2 MB de peso total en transmisión para garantizar una carga instantánea.

### RNF-02: Seguridad y Protección de Datos
* **RNF-02.1 (Protección contra Inyecciones):** Todas las consultas a la base de datos SQLite deberán utilizar sentencias preparadas (*Prepared Statements*) con parámetros enlazados para prevenir ataques SQL Injection.
* **RNF-02.2 (Validación de Entradas):** El backend sanitizará y validará todo el cuerpo JSON de los requests usando librerías de validación como `express-validator` o esquemas equivalentes.
* **RNF-02.3 (Políticas CORS):** El servidor implementará middleware CORS delimitando qué orígenes pueden consumir la API.

### RNF-03: Usabilidad y Diseño (UI/UX)
* **RNF-03.1 (Diseño Responsive):** La interfaz deberá adaptarse fluidamente a pantallas móviles (320px en adelante), tablets y escritorio utilizando CSS Flexbox y CSS Grid.
* **RNF-03.2 (Cumplimiento de Guía de Estilos):** La paleta cromática utilizará el color primario `#0094B8` (Cian Agua), fondos oscuros o acentos `#002933` / `#293133`, y la tipografía **Inter** para cuerpo de texto y **Montserrat** para encabezados y métricas clave.

### RNF-04: Mantenibilidad y Portabilidad
* **RNF-04.1 (Cero Dependencias Complejas de BD):** El motor SQLite3 utilizará un único archivo de base de datos (`agua_recordatorio.db`), lo que facilitará la portabilidad y despliegue del proyecto sin necesidad de instalar servicios externos como MySQL o PostgreSQL.

---

## 6. Diagrama de Casos de Uso (Matriz de Actores y Acciones)

| Actor | Caso de Uso | Descripción |
| :--- | :--- | :--- |
| **Usuario No Autenticado** | CU-01: Registrar Cuenta | Crea una cuenta proporcionando datos físicos e institucionales. |
| **Usuario No Autenticado** | CU-02: Iniciar Sesión | Autentica credenciales y obtiene Token de acceso JWT. |
| **Usuario Autenticado** | CU-03: Configurar Horario | Ajusta parámetros de vigilia, intervalos y meta personalizada. |
| **Usuario Autenticado** | CU-04: Registrar Consumo | Ingresa la cantidad de agua consumida en ml. |
| **Usuario Autenticado** | CU-05: Consultar Estado y Racha | Visualiza el porcentaje del día, racha actual e historial diario. |
| **Sistema (Frontend JS)** | CU-06: Disparar Alerta | Lanza la notificación del navegador a la hora programada. |