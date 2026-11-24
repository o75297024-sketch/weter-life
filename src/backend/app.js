/**
 * Punto de entrada del backend de AguaRecordatorio.
 *
 * Configura Express, conecta la base de datos SQLite3 y expone la ruta de
 * verificación de salud. Los módulos de negocio se montarán en los routers
 * de `src/backend/routes/`.
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { conectar } = require('./config/database');
const { inicializarTablas } = require('./config/initDb');
const AppError = require('./utils/AppError');
const errorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');

/** Puerto de escucha; 3000 cuando `PORT` no está definido o no es numérico. */
const PUERTO = Number(process.env.PORT) || 3000;

/** Origen permitido por CORS; comodín '*' por defecto para desarrollo local. */
const ORIGEN_CORS = process.env.CORS_ORIGIN || '*';

const app = express();

// Permite peticiones del cliente PWA delimitando los orígenes permitidos.
app.use(cors({
  origin: ORIGEN_CORS
}));

// Interpreta cuerpos JSON y formularios codificados.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * Verificación rápida de disponibilidad de la API.
 * No requiere autenticación ni acceso a la base de datos.
 */
app.get('/api/health-check', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API AguaRecordatorio en funcionamiento'
  });
});

// Rutas modulares de la API
app.use('/api/auth', authRoutes);

// Cualquier ruta no registrada se convierte en un 404 mediante AppError.
app.use((req, res, next) => {
  next(new AppError(`Ruta no encontrada: ${req.method} ${req.originalUrl}`, 404));
});

// Manejador global de errores: siempre al final de la cadena de middlewares.
app.use(errorHandler);

/**
 * Conecta la base de datos, aplica el esquema y levanta el servidor HTTP.
 * Si SQLite no está disponible o el esquema falla, el proceso termina para
 * no servir una API sin persistencia.
 * @returns {Promise<import('node:http').Server | undefined>}
 */
const iniciar = async () => {
  try {
    await conectar();
    await inicializarTablas();

    const servidor = app.listen(PUERTO, () => {
      console.log(`API AguaRecordatorio escuchando en http://localhost:${PUERTO}`);
      console.log('Base de datos SQLite3 conectada con integridad referencial activa.');
    });

    return servidor;
  } catch (error) {
    console.error(`No fue posible iniciar la API: ${error.message}`);
    process.exit(1);
    return undefined;
  }
};

// Solo arranca el servidor cuando el archivo se ejecuta directamente,
// de modo que las pruebas puedan importar `app` sin abrir el puerto.
if (require.main === module) {
  iniciar();
}

module.exports = { app, iniciar };
