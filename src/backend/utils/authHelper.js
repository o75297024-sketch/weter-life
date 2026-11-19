/**
 * Utilidades criptográficas y de gestión de tokens JWT para AguaRecordatorio.
 *
 * Provee funciones para hashing y comparación segura de contraseñas con bcryptjs,
 * así como emisión y validación de tokens de sesión con jsonwebtoken.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AppError = require('./AppError');

/** Factor de costo para hashing de contraseñas (mínimo 10 según SRS RF-01.2). */
const SALT_ROUNDS = 10;

/** Clave secreta para firma de tokens JWT; respaldo para desarrollo local. */
const JWT_SECRET = process.env.JWT_SECRET || 'agua_recordatorio_jwt_dev_secret_key_2026';

/** Tiempo de vigencia del token de sesión. */
const JWT_EXPIRES_IN = '24h';

/**
 * Genera un hash criptográfico a partir de una contraseña en texto plano.
 * @param {string} contrasenaPlana - Contraseña sin procesar.
 * @returns {Promise<string>} Hash generado con bcrypt.
 */
const hashearContrasena = async (contrasenaPlana) => {
  if (!contrasenaPlana || typeof contrasenaPlana !== 'string') {
    throw new AppError('La contraseña proporcionada es inválida.', 400);
  }
  return bcrypt.hash(contrasenaPlana, SALT_ROUNDS);
};

/**
 * Compara una contraseña en texto plano contra su hash almacenado.
 * @param {string} contrasenaPlana - Contraseña ingresada por el usuario.
 * @param {string} contrasenaHash - Hash previamente persistido.
 * @returns {Promise<boolean>} `true` si coincide, de lo contrario `false`.
 */
const compararContrasena = async (contrasenaPlana, contrasenaHash) => {
  if (!contrasenaPlana || !contrasenaHash) {
    return false;
  }
  return bcrypt.compare(contrasenaPlana, contrasenaHash);
};

/**
 * Genera y firma un token JWT con la identidad del usuario.
 * @param {{ id: number, correo_electronico: string }} payload - Datos a incrustar en el token.
 * @returns {string} Token JWT firmado con vigencia de 24 horas.
 */
const generarToken = (payload) => {
  if (!payload || !payload.id || !payload.correo_electronico) {
    throw new AppError('El payload del token debe incluir id y correo_electronico.', 500);
  }

  return jwt.sign(
    {
      id: payload.id,
      correo_electronico: payload.correo_electronico
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

/**
 * Verifica y decodifica un token JWT.
 * Lanza un AppError 401 operacional si el token está corrupto, expirado o manipulado.
 * @param {string} token - Token JWT a verificar.
 * @returns {{ id: number, correo_electronico: string, iat: number, exp: number }} Payload decodificado.
 */
const verificarToken = (token) => {
  if (!token || typeof token !== 'string') {
    throw new AppError('Token de autenticación no proporcionado o inválido.', 401);
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new AppError('Token de autenticación inválido o expirado.', 401);
  }
};

module.exports = {
  SALT_ROUNDS,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  hashearContrasena,
  compararContrasena,
  generarToken,
  verificarToken
};
