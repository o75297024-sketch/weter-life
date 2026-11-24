/**
 * Controlador de Autenticación y Cuentas de Usuario.
 *
 * Maneja el flujo de registro e inicio de sesión integrando el modelo de datos,
 * el hashing criptográfico de contraseñas, el cálculo determinista de hidratación
 * y la emisión de tokens JWT.
 */

const userModel = require('../models/userModel');
const authHelper = require('../utils/authHelper');
const hydrationService = require('../services/hydrationService');
const AppError = require('../utils/AppError');

/**
 * Registra un nuevo usuario en la plataforma.
 *
 * Flujo:
 * 1. Verifica si el correo electrónico ya se encuentra registrado (HTTP 409 si existe).
 * 2. Calcula automáticamente la meta diaria en ml según peso y factor extra (RN-01).
 * 3. Encripta la contraseña usando bcrypt con factor de costo 10 (RF-01.2).
 * 4. Guarda el usuario en SQLite3 mediante el modelo de persistencia.
 * 5. Genera un token JWT firmado de 24 horas.
 * 6. Responde con HTTP 201 Created y el perfil sin contraseñas.
 *
 * @param {import('express').Request} req - Petición con los datos del usuario.
 * @param {import('express').Response} res - Respuesta HTTP.
 * @param {import('express').NextFunction} next - Siguiente función middleware.
 */
const registrarUsuario = async (req, res, next) => {
  try {
    const {
      nombre,
      correo_electronico,
      contrasena,
      edad,
      peso_kg,
      factor_extra = false
    } = req.body;

    // 1. Verificación de existencia previa de correo
    const usuarioExistente = await userModel.obtenerUsuarioPorCorreo(correo_electronico);
    if (usuarioExistente) {
      throw new AppError('El correo electrónico ya está registrado.', 409);
    }

    // 2. Cálculo determinista de meta diaria de hidratación (RN-01)
    const metaDiariaMl = hydrationService.calcularMetaDiaria(
      Number(peso_kg),
      Boolean(factor_extra)
    );

    // 3. Encriptación segura de contraseña (RF-01.2)
    const contrasenaHash = await authHelper.hashearContrasena(contrasena);

    // 4. Inserción en base de datos SQLite3
    const nuevoUsuario = await userModel.crearUsuario({
      nombre: nombre.trim(),
      correo_electronico,
      contrasena_hash: contrasenaHash,
      edad: Number(edad),
      peso_kg: Number(peso_kg),
      meta_diaria_ml: metaDiariaMl
    });

    // 5. Generación de token JWT de sesión
    const token = authHelper.generarToken({
      id: nuevoUsuario.id,
      correo_electronico: nuevoUsuario.correo_electronico
    });

    // 6. Respuesta limpia y estandarizada (HTTP 201 Created)
    return res.status(201).json({
      status: 'success',
      mensaje: 'Usuario registrado exitosamente.',
      token,
      usuario: {
        id: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        correo_electronico: nuevoUsuario.correo_electronico,
        edad: nuevoUsuario.edad,
        peso_kg: nuevoUsuario.peso_kg,
        meta_diaria_ml: nuevoUsuario.meta_diaria_ml
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  registrarUsuario
};
