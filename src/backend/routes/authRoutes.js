/**
 * Enrutador para el módulo de Autenticación de AguaRecordatorio.
 *
 * Expone endpoints para el registro y gestión de credenciales bajo el prefijo `/api/auth`.
 * Implementa validaciones declarativas mediante `express-validator` y el middleware `validateRequest`.
 */

const { Router } = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validateRequest = require('../middlewares/validateRequest');

const router = Router();

/**
 * Validaciones para el endpoint de registro de usuarios (POST /registro).
 * Valida formatos, rangos estipulados en el SRS (RF-01.1, RF-01.2) y sanitiza entradas.
 */
const validacionesRegistro = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio.')
    .isLength({ max: 100 }).withMessage('El nombre no debe exceder 100 caracteres.'),

  body('correo_electronico')
    .notEmpty().withMessage('El correo electrónico es obligatorio.')
    .isEmail().withMessage('El correo electrónico debe tener un formato válido.')
    .normalizeEmail(),

  body('contrasena')
    .isString().withMessage('La contraseña debe ser una cadena de texto.')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres.'),

  body('edad')
    .notEmpty().withMessage('La edad es obligatoria.')
    .isInt({ min: 10, max: 120 }).withMessage('La edad debe ser un número entero entre 10 y 120.')
    .toInt(),

  body('peso_kg')
    .notEmpty().withMessage('El peso en kg es obligatorio.')
    .isFloat({ min: 30.0, max: 250.0 }).withMessage('El peso en kg debe ser un número decimal entre 30.0 y 250.0.')
    .toFloat(),

  body('factor_extra')
    .optional()
    .isBoolean().withMessage('El campo factor_extra debe ser un valor booleano (true o false).')
    .toBoolean()
];

/**
 * @route POST /api/auth/registro
 * @desc Registra un nuevo usuario, calcula su meta hídrica y retorna token JWT de sesión.
 * @access Público
 */
router.post('/registro', validacionesRegistro, validateRequest, authController.registrarUsuario);

module.exports = router;
