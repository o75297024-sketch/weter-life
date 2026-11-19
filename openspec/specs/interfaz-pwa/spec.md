# interfaz-pwa Specification

## Purpose

Definir la experiencia visual y el comportamiento de la PWA en dispositivos móviles, incluyendo diseño adaptable, sistema de estilos y acceso offline.

## Requirements

### Requirement: Diseño mobile-first y adaptable
La interfaz SHALL diseñarse primero para pantallas de 320 px en adelante y SHALL adaptarse con CSS Flexbox y Grid a tablets y escritorio sin scroll horizontal.

#### Scenario: Vista en móvil
- **WHEN** la aplicación se abre en una pantalla de 320 px de ancho
- **THEN** todos los controles son accesibles con una sola mano y no aparece desplazamiento horizontal

#### Scenario: Vista en escritorio
- **WHEN** la aplicación se abre en una pantalla de escritorio
- **THEN** el contenido se reorganiza en columnas sin perder legibilidad ni funcionalidad

### Requirement: Sistema de estilos basado en variables
La interfaz SHALL usar la paleta global definida en `variables.css` y MUST NOT declarar colores hexadecimales directamente en las reglas de los componentes.

#### Scenario: Uso de la paleta
- **WHEN** se estiliza un botón primario
- **THEN** su color proviene de `var(--color-primary)` y no de un valor literal

#### Scenario: Paleta de estados
- **WHEN** se representan tomas completadas, próximas a vencer u omitidas
- **THEN** se utilizan respectivamente `var(--color-success)`, `var(--color-warning)` y `var(--color-danger)`

### Requirement: Convención BEM en CSS
Las clases CSS SHALL seguir el patrón bloque `reminder-card`, elemento `reminder-card__time` y modificador `reminder-card--completed`.

#### Scenario: Estructura de una tarjeta
- **WHEN** se implementa una tarjeta de recordatorio
- **THEN** sus clases siguen la convención BEM y no se usan estilos en línea

### Requirement: HTML semántico
El frontend SHALL estructurar cada vista con etiquetas semánticas (`header`, `nav`, `main`, `section`, `article`, `footer`) y SHALL mantener un único `main` por página.

#### Scenario: Estructura del dashboard
- **WHEN** se renderiza el dashboard
- **THEN** la cabecera, la navegación, el progreso y las tarjetas están delimitados por etiquetas semánticas apropiadas

### Requirement: Indicadores de progreso y racha
El dashboard SHALL mostrar la barra de progreso diaria, el total consumido frente a la meta y la racha actual de días cumplidos.

#### Scenario: Estado del día visible
- **WHEN** el usuario abre la aplicación con consumos registrados
- **THEN** ve la barra de progreso, el texto "consumido / meta" y el contador de racha actualizados

### Requirement: Consejos de hidratación
La aplicación SHALL incluir una sección de recomendaciones sobre hábitos saludables de hidratación, temperatura del agua y consumo durante el ejercicio.

#### Scenario: Acceso a recomendaciones
- **WHEN** el usuario navega a la sección de consejos
- **THEN** se muestran las recomendaciones sin requerir conexión a la API

### Requirement: Funcionamiento como PWA
La aplicación SHALL registrar un Service Worker y SHALL servir la interfaz principal desde caché cuando no haya conexión.

#### Scenario: Carga sin conexión
- **WHEN** el usuario abre la aplicación sin red después de una visita previa
- **THEN** la interfaz principal carga desde caché y las acciones que requieren la API informan la falta de conexión
