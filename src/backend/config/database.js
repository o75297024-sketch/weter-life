/**
 * Conexión a la base de datos SQLite3 de AguaRecordatorio.
 *
 * Expone una única conexión (singleton) al archivo `agua_recordatorio.db`
 * ubicado en la raíz del backend, junto con helpers basados en Promesas
 * para poder usar `async/await` en toda la aplicación.
 */

const path = require('node:path');
const sqlite3 = require('sqlite3');

/** Ruta absoluta del archivo de base de datos (raíz de `src/backend/`). */
const RUTA_BASE_DATOS = path.resolve(__dirname, '..', 'agua_recordatorio.db');

/** Tiempo máximo de espera cuando otro proceso mantiene bloqueado el archivo. */
const ESPERA_BLOQUEO_MS = 5000;

/** Conexión abierta y verificada. */
let instancia = null;

/** Promesa de apertura en curso, para evitar conexiones duplicadas. */
let promesaConexion = null;

/**
 * Abre el archivo de SQLite3.
 * @returns {Promise<sqlite3.Database>} Conexión recién abierta.
 */
const abrirArchivo = () =>
  new Promise((resolve, reject) => {
    const conexion = new sqlite3.Database(RUTA_BASE_DATOS, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(conexion);
    });
  });

/**
 * Ejecuta una sentencia de escritura sobre una conexión concreta.
 * @param {sqlite3.Database} conexion Conexión activa.
 * @param {string} sql Sentencia SQL con parámetros `?`.
 * @param {Array<unknown>} parametros Valores enlazados a la sentencia.
 * @returns {Promise<{ lastID: number, changes: number }>}
 */
const ejecutarEscritura = (conexion, sql, parametros) =>
  new Promise((resolve, reject) => {
    // Se usa `function` para acceder a `this.lastID` y `this.changes`.
    conexion.run(sql, parametros, function manejarResultado(error) {
      if (error) {
        reject(error);
        return;
      }
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });

/**
 * Lee una única fila de una conexión concreta.
 * @param {sqlite3.Database} conexion Conexión activa.
 * @param {string} sql Sentencia SQL con parámetros `?`.
 * @param {Array<unknown>} parametros Valores enlazados a la sentencia.
 * @returns {Promise<unknown>} Fila encontrada o `undefined`.
 */
const leerFila = (conexion, sql, parametros) =>
  new Promise((resolve, reject) => {
    conexion.get(sql, parametros, (error, fila) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(fila);
    });
  });

/**
 * Abre la conexión, configura el tiempo de espera y verifica la integridad
 * referencial. `PRAGMA foreign_keys` es una propiedad por conexión, por eso
 * se aplica y se comprueba en cada apertura.
 * @returns {Promise<sqlite3.Database>}
 */
const inicializar = async () => {
  const conexion = await abrirArchivo();
  conexion.configure('busyTimeout', ESPERA_BLOQUEO_MS);

  await ejecutarEscritura(conexion, 'PRAGMA foreign_keys = ON', []);
  const verificacion = await leerFila(conexion, 'PRAGMA foreign_keys', []);

  if (!verificacion || verificacion.foreign_keys !== 1) {
    await new Promise((resolve) => conexion.close(() => resolve()));
    throw new Error('No fue posible habilitar PRAGMA foreign_keys en SQLite.');
  }

  instancia = conexion;
  return conexion;
};

/**
 * Devuelve la conexión activa, abriéndola la primera vez.
 * Las llamadas concurrentes comparten la misma promesa de apertura.
 * @returns {Promise<sqlite3.Database>}
 */
const conectar = async () => {
  if (instancia) {
    return instancia;
  }

  if (!promesaConexion) {
    promesaConexion = inicializar().finally(() => {
      promesaConexion = null;
    });
  }

  return promesaConexion;
};

/**
 * Cierra la conexión activa. Es seguro llamarlo cuando ya está cerrada.
 * @returns {Promise<void>}
 */
const cerrar = async () => {
  if (!instancia) {
    return;
  }

  const conexion = instancia;
  instancia = null;
  promesaConexion = null;

  await new Promise((resolve, reject) => {
    conexion.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
};

/**
 * Valida que los parámetros lleguen como arreglo para no romper el enlace
 * de valores de SQLite.
 * @param {unknown} parametros Valores recibidos.
 * @returns {Array<unknown>}
 */
const normalizarParametros = (parametros) => {
  if (parametros === undefined) {
    return [];
  }

  if (!Array.isArray(parametros)) {
    throw new TypeError('Los parámetros de una consulta deben enviarse como arreglo.');
  }

  return parametros;
};

/**
 * Ejecuta una sentencia de escritura (`INSERT`, `UPDATE`, `DELETE`).
 * @param {string} sql Sentencia SQL con parámetros `?`.
 * @param {Array<unknown>} [parametros] Valores enlazados.
 * @returns {Promise<{ lastID: number, changes: number }>}
 */
const run = async (sql, parametros) => {
  const conexion = await conectar();
  return ejecutarEscritura(conexion, sql, normalizarParametros(parametros));
};

/**
 * Obtiene la primera fila del resultado.
 * @param {string} sql Sentencia SQL con parámetros `?`.
 * @param {Array<unknown>} [parametros] Valores enlazados.
 * @returns {Promise<unknown>}
 */
const get = async (sql, parametros) => {
  const conexion = await conectar();
  return leerFila(conexion, sql, normalizarParametros(parametros));
};

/**
 * Obtiene todas las filas del resultado.
 * @param {string} sql Sentencia SQL con parámetros `?`.
 * @param {Array<unknown>} [parametros] Valores enlazados.
 * @returns {Promise<Array<unknown>>}
 */
const all = async (sql, parametros) => {
  const conexion = await conectar();

  return new Promise((resolve, reject) => {
    conexion.all(sql, normalizarParametros(parametros), (error, filas) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(filas);
    });
  });
};

module.exports = {
  RUTA_BASE_DATOS,
  conectar,
  cerrar,
  get,
  all,
  run
};
