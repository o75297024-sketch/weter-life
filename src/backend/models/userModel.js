/**
 * Modelo de acceso a datos para la entidad de Usuarios en SQLite3.
 *
 * Encapsula las operaciones de persistencia y consulta sobre la tabla `usuarios`,
 * asegurando el uso estricto de sentencias preparadas parametrizadas (?) para mitigar
 * inyecciones SQL y protegiendo el hash de contraseñas en consultas públicas.
 */

const { run, get } = require('../config/database');
const AppError = require('../utils/AppError');

/**
 * Consulta un usuario por su clave primaria `id` retornando únicamente columnas públicas.
 * Excluye explícitamente `contrasena_hash` para evitar fugas de credenciales.
 * @param {number} id - Identificador numérico del usuario.
 * @returns {Promise<{ id: number, nombre: string, correo_electronico: string, edad: number, peso_kg: number, meta_diaria_ml: number, creado_en: string } | null>}
 */
const obtenerUsuarioPorId = async (id) => {
  try {
    const sql = `
      SELECT id, nombre, correo_electronico, edad, peso_kg, meta_diaria_ml, creado_en
      FROM usuarios
      WHERE id = ?
    `;
    const usuario = await get(sql, [id]);
    return usuario || null;
  } catch (error) {
    throw new AppError(`Error al consultar usuario por id: ${error.message}`, 500);
  }
};

/**
 * Consulta un usuario por su correo electrónico único.
 * Retorna el registro íntegro (incluyendo `contrasena_hash`) para verificación en login.
 * @param {string} correoElectronico - Correo electrónico a buscar.
 * @returns {Promise<{ id: number, nombre: string, correo_electronico: string, contrasena_hash: string, edad: number, peso_kg: number, meta_diaria_ml: number, creado_en: string } | null>}
 */
const obtenerUsuarioPorCorreo = async (correoElectronico) => {
  try {
    const sql = `
      SELECT id, nombre, correo_electronico, contrasena_hash, edad, peso_kg, meta_diaria_ml, creado_en
      FROM usuarios
      WHERE correo_electronico = ?
    `;
    const usuario = await get(sql, [correoElectronico]);
    return usuario || null;
  } catch (error) {
    throw new AppError(`Error al consultar usuario por correo: ${error.message}`, 500);
  }
};

/**
 * Inserta un nuevo usuario en la base de datos y retorna el registro creado sin el hash.
 * @param {Object} datosUsuario
 * @param {string} datosUsuario.nombre - Nombre completo del usuario.
 * @param {string} datosUsuario.correo_electronico - Correo único.
 * @param {string} datosUsuario.contrasena_hash - Hash bcrypt de la contraseña.
 * @param {number} datosUsuario.edad - Edad del usuario (5 - 120).
 * @param {number} datosUsuario.peso_kg - Peso en kg (20.0 - 300.0).
 * @param {number} datosUsuario.meta_diaria_ml - Meta diaria calculada en ml.
 * @returns {Promise<{ id: number, nombre: string, correo_electronico: string, edad: number, peso_kg: number, meta_diaria_ml: number, creado_en: string }>}
 */
const crearUsuario = async ({
  nombre,
  correo_electronico,
  contrasena_hash,
  edad,
  peso_kg,
  meta_diaria_ml
}) => {
  try {
    const sql = `
      INSERT INTO usuarios (nombre, correo_electronico, contrasena_hash, edad, peso_kg, meta_diaria_ml)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const parametros = [
      nombre,
      correo_electronico,
      contrasena_hash,
      edad,
      peso_kg,
      meta_diaria_ml
    ];

    const resultado = await run(sql, parametros);
    const nuevoUsuario = await obtenerUsuarioPorId(resultado.lastID);

    if (!nuevoUsuario) {
      throw new AppError('No fue posible recuperar el usuario tras su creación.', 500);
    }

    return nuevoUsuario;
  } catch (error) {
    // Si es un error de restricción SQLite o AppError, lo propagamos sin envolver
    if (error.code && error.code.startsWith('SQLITE_CONSTRAINT')) {
      throw error;
    }
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Error al crear usuario en base de datos: ${error.message}`, 500);
  }
};

/**
 * Actualiza la meta diaria de consumo en ml para un usuario específico.
 * @param {number} usuarioId - Identificador del usuario.
 * @param {number} nuevaMetaMl - Nuevo volumen objetivo en ml.
 * @returns {Promise<number>} Cantidad de filas afectadas (1 si se actualizó, 0 si no existía).
 */
const actualizarMetaDiaria = async (usuarioId, nuevaMetaMl) => {
  try {
    const sql = `
      UPDATE usuarios
      SET meta_diaria_ml = ?
      WHERE id = ?
    `;
    const resultado = await run(sql, [nuevaMetaMl, usuarioId]);
    return resultado.changes;
  } catch (error) {
    if (error.code && error.code.startsWith('SQLITE_CONSTRAINT')) {
      throw error;
    }
    throw new AppError(`Error al actualizar meta diaria: ${error.message}`, 500);
  }
};

module.exports = {
  crearUsuario,
  obtenerUsuarioPorCorreo,
  obtenerUsuarioPorId,
  actualizarMetaDiaria
};
