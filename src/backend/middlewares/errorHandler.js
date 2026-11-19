/**
 * Middleware global de manejo de errores de AguaRecordatorio.
 *
 * Captura y normaliza todas las excepciones del servidor (AppError operacionales,
 * sintaxis JSON malformada, violaciones de restricciones SQLite y fallos no previstos)
 * asegurando la estructura estricta:
 *   { "status": "error", "codigo": <HTTP>, "mensaje": <texto> }
 */

const AppError = require('../utils/AppError');

/** Mensaje genérico para errores no controlados en entornos de producción. */
const MENSAJE_ERROR_INTERNO = 'Ocurrió un error interno en el servidor.';

/**
 * Normaliza un error recibido resolviendo su código HTTP y mensaje amigable.
 * @param {Error & Record<string, any>} error - Error capturado.
 * @returns {{ codigo: number, mensaje: string }}
 */
const normalizarError = (error) => {
  // 1. Errores operacionales explícitos (AppError o marcados como operacionales)
  if (error instanceof AppError || error.esOperacional) {
    const codigo = Number(error.codigo) || 500;
    return {
      codigo,
      mensaje: error.message || error.mensaje || MENSAJE_ERROR_INTERNO
    };
  }

  // 2. Errores de sintaxis en el cuerpo JSON recibido (express.json parser)
  if (error instanceof SyntaxError && (error.status === 400 || error.statusCode === 400) && 'body' in error) {
    return {
      codigo: 400,
      mensaje: 'El cuerpo de la petición contiene un JSON con sintaxis inválida.'
    };
  }

  // 3. Errores de restricciones de SQLite3
  const codigoErrorSql = String(error.code || '');
  const mensajeErrorSql = String(error.message || '');

  if (codigoErrorSql === 'SQLITE_CONSTRAINT_UNIQUE' || mensajeErrorSql.includes('UNIQUE constraint failed')) {
    return {
      codigo: 409,
      mensaje: 'El recurso ya existe o infringe una restricción de unicidad.'
    };
  }

  if (codigoErrorSql === 'SQLITE_CONSTRAINT_CHECK' || mensajeErrorSql.includes('CHECK constraint failed')) {
    return {
      codigo: 400,
      mensaje: 'Los datos proporcionados no cumplen con las restricciones de validación de la base de datos.'
    };
  }

  if (codigoErrorSql.startsWith('SQLITE_CONSTRAINT')) {
    return {
      codigo: 400,
      mensaje: 'La operación no cumple con las restricciones de integridad de la base de datos.'
    };
  }

  // 4. Código explícito en el error si existe (ej. 401, 403, 404)
  const codigoCandidato = Number(error.codigo ?? error.status ?? error.statusCode);
  if (Number.isInteger(codigoCandidato) && codigoCandidato >= 400 && codigoCandidato <= 599) {
    const mensaje = (codigoCandidato >= 500 && process.env.NODE_ENV === 'production')
      ? MENSAJE_ERROR_INTERNO
      : (error.mensaje || error.message || MENSAJE_ERROR_INTERNO);

    return { codigo: codigoCandidato, mensaje };
  }

  // 5. Errores inesperados del sistema (500)
  const mensaje500 = process.env.NODE_ENV === 'production'
    ? MENSAJE_ERROR_INTERNO
    : (error.message || MENSAJE_ERROR_INTERNO);

  return { codigo: 500, mensaje: mensaje500 };
};

/**
 * Middleware de manejo de errores de Express (debe poseer 4 parámetros).
 * @param {Error} error - Error propagado por throw o next(error).
 * @param {import('express').Request} req - Petición HTTP.
 * @param {import('express').Response} res - Respuesta HTTP.
 * @param {import('express').NextFunction} next - Siguiente función middleware.
 */
const errorHandler = (error, req, res, next) => {
  // Si la cabecera ya se envió, delega a Express para cerrar la conexión.
  if (res.headersSent) {
    next(error);
    return;
  }

  const { codigo, mensaje } = normalizarError(error);

  // Registro en logs del servidor para trazabilidad y depuración.
  console.error(`[error] ${req.method} ${req.originalUrl} -> ${codigo}: ${error.message || error}`);

  res.status(codigo).json({
    status: 'error',
    codigo,
    mensaje
  });
};

module.exports = errorHandler;
