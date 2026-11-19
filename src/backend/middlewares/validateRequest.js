/**
 * Middleware para la validación declarativa de esquemas de petición.
 *
 * Intercepta los resultados producidos por cadenas de validación de `express-validator`.
 * Si se detectan infracciones en la petición, interrumpe el flujo y responde inmediatamente
 * con HTTP 400 Bad Request cumpliendo con el formato estándar del proyecto:
 *   { "status": "error", "codigo": 400, "mensaje": "<descripción>" }
 */

const { validationResult } = require('express-validator');

/**
 * Middleware interceptor de errores de validación.
 * @param {import('express').Request} req - Petición HTTP.
 * @param {import('express').Response} res - Respuesta HTTP.
 * @param {import('express').NextFunction} next - Siguiente función middleware.
 */
const validateRequest = (req, res, next) => {
  const errores = validationResult(req);

  if (!errores.isEmpty()) {
    const listaErrores = errores.array();
    // Prioriza el mensaje del primer error relevante detectado
    const primerError = listaErrores[0];
    const mensaje = primerError.msg || 'Los datos de la petición son inválidos o están incompletos.';

    return res.status(400).json({
      status: 'error',
      codigo: 400,
      mensaje
    });
  }

  return next();
};

module.exports = validateRequest;
