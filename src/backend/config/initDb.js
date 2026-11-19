/**
 * Inicialización del esquema de AguaRecordatorio.
 *
 * Aplica el DDL aprobado de forma idempotente y atómica: si una sentencia
 * falla, la transacción se revierte y el arranque de la API se detiene para
 * no servir peticiones contra una base incompleta.
 */

const { run, get } = require('./database');

/** Cantidad de tablas de negocio que define el esquema. */
const TOTAL_TABLAS = 5;

/** Cantidad de índices de optimización que define el esquema. */
const TOTAL_INDICES = 2;

/**
 * Sentencias del esquema en orden de dependencia:
 * primero `usuarios`, luego las tablas que la referencian y al final los índices.
 */
const SENTENCIAS_ESQUEMA = Object.freeze([
  `CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    correo_electronico TEXT NOT NULL UNIQUE,
    contrasena_hash TEXT NOT NULL,
    edad INTEGER NOT NULL CHECK(edad BETWEEN 5 AND 120),
    peso_kg REAL NOT NULL CHECK(peso_kg BETWEEN 20.0 AND 300.0),
    meta_diaria_ml INTEGER NOT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE IF NOT EXISTS horarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    hora_inicio TEXT NOT NULL,
    hora_fin TEXT NOT NULL,
    intervalo_minutos INTEGER NOT NULL CHECK(intervalo_minutos > 0),
    cantidad_ml_por_toma INTEGER NOT NULL CHECK(cantidad_ml_por_toma > 0),
    activo INTEGER DEFAULT 1 CHECK(activo IN (0, 1)),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS recordatorios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    cantidad_ml INTEGER NOT NULL,
    estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'completado', 'omitido')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS consumos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    cantidad_ml INTEGER NOT NULL CHECK(cantidad_ml > 0),
    fecha TEXT NOT NULL,
    hora TEXT NOT NULL,
    registrado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  )`,

  `CREATE TABLE IF NOT EXISTS subscripciones_push (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  )`,

  `CREATE INDEX IF NOT EXISTS idx_recordatorios_usuario_fecha
    ON recordatorios(usuario_id, fecha)`,

  `CREATE INDEX IF NOT EXISTS idx_consumos_usuario_fecha
    ON consumos(usuario_id, fecha)`
]);

/**
 * Cuenta las tablas de negocio existentes, excluyendo las internas de SQLite.
 * @returns {Promise<number>}
 */
const contarTablas = async () => {
  const fila = await get(
    `SELECT COUNT(*) AS total
       FROM sqlite_master
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`
  );

  return fila ? fila.total : 0;
};

/**
 * Crea las tablas e índices del esquema si aún no existen.
 *
 * `PRAGMA foreign_keys` se aplica antes del `BEGIN` porque SQLite ignora ese
 * pragma dentro de una transacción.
 *
 * @param {ReadonlyArray<string>} [sentencias] Sentencias a ejecutar; se
 *   permite inyectarlas para verificar el comportamiento transaccional.
 * @returns {Promise<void>}
 */
const inicializarTablas = async (sentencias = SENTENCIAS_ESQUEMA) => {
  try {
    await run('PRAGMA foreign_keys = ON');

    const verificacion = await get('PRAGMA foreign_keys');
    if (!verificacion || verificacion.foreign_keys !== 1) {
      throw new Error('La integridad referencial de SQLite no está activa.');
    }

    await run('BEGIN');

    for (const sentencia of sentencias) {
      await run(sentencia);
    }

    await run('COMMIT');

    const totalTablas = await contarTablas();
    console.log(
      `Esquema de base de datos verificado: ${totalTablas} tablas y ${TOTAL_INDICES} índices listos.`
    );
  } catch (error) {
    // Se intenta revertir; si el fallo ocurrió antes del BEGIN, no hay nada que deshacer.
    try {
      await run('ROLLBACK');
    } catch {
      // La transacción no estaba abierta: se conserva el error original.
    }

    throw new Error(`No fue posible inicializar el esquema: ${error.message}`);
  }
};

module.exports = {
  SENTENCIAS_ESQUEMA,
  TOTAL_TABLAS,
  TOTAL_INDICES,
  inicializarTablas
};
