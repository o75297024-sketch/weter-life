/**
 * Clase de error operacional para la API de AguaRecordatorio.
 *
 * Extiende la clase nativa `Error` para representar condiciones de error
 * conocidas y controlables (ej. validaciones, recursos no encontrados, conflictos),
 * diferenciándolas de excepciones inesperadas o fallos del sistema.
 */

class AppError extends Error {
  /**
   * Crea una instancia de AppError.
   * @param {string} mensaje - Descripción clara y segura del error.
   * @param {number} [codigoEstado=500] - Código numérico de estado HTTP (400 - 599).
   */
  constructor(mensaje, codigoEstado = 500) {
    super(mensaje);

    const codigoNumerico = Number(codigoEstado);
    const esValido = Number.isInteger(codigoNumerico) && codigoNumerico >= 400 && codigoNumerico <= 599;

    /** @type {number} Código de estado HTTP. Por defecto 500 si no es válido. */
    this.codigo = esValido ? codigoNumerico : 500;

    /** @type {string} Estado de respuesta para el contrato JSON estándar. */
    this.status = 'error';

    /** @type {boolean} Identifica si el error es operacional (controlado). */
    this.esOperacional = true;

    // Captura la traza de la pila excluyendo el constructor de esta clase.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = AppError;
