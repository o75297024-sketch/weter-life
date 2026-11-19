/**
 * Servicio de lógica de dominio y cálculos de hidratación de AguaRecordatorio.
 *
 * Implementa las reglas de negocio de meta diaria (RN-01), volumen por toma (RN-02)
 * y cronograma sugerido (RF-03, RF-05) mediante funciones puras y deterministas
 * sin acoplamiento a base de datos ni capa HTTP.
 */

const AppError = require('../utils/AppError');

/** Mililitros recomendados por kilogramo de peso corporal (RN-01). */
const ML_POR_KG = 35;

/** Mililitros adicionales por actividad física o condiciones climáticas severas (RN-01). */
const EXTRA_ACTIVIDAD_O_CLIMA_ML = 500;

/** Configuración de horario sugerido estándar tras el registro (RF-03). */
const HORARIO_DEFAULT = Object.freeze({
  hora_inicio: '07:00',
  hora_fin: '21:00',
  intervalo_minutos: 120
});

/** Expresión regular para validar formato militar de 24 horas "HH:MM". */
const REGEX_HORA_24H = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Convierte una hora en formato "HH:MM" a minutos transcurridos desde medianoche.
 * @param {string} horaStr - Hora en formato militar "HH:MM".
 * @returns {number} Minutos transcurridos (0 - 1439).
 */
const horaAMinutos = (horaStr) => {
  if (typeof horaStr !== 'string' || !REGEX_HORA_24H.test(horaStr)) {
    throw new AppError(`Formato de hora inválido ('${horaStr}'). Debe ser 'HH:MM' en rango 00:00 a 23:59.`, 400);
  }
  const [horas, minutos] = horaStr.split(':').map(Number);
  return horas * 60 + minutos;
};

/**
 * Convierte minutos transcurridos desde medianoche a una cadena "HH:MM".
 * @param {number} minutos - Minutos desde medianoche.
 * @returns {string} Cadena formateada "HH:MM".
 */
const minutosAHora = (minutos) => {
  const horasNormalizadas = Math.floor(minutos / 60) % 24;
  const minutosNormalizados = minutos % 60;
  const hh = String(horasNormalizadas).padStart(2, '0');
  const mm = String(minutosNormalizados).padStart(2, '0');
  return `${hh}:${mm}`;
};

/**
 * Calcula la meta diaria recomendada de agua en mililitros a partir del peso corporal (RN-01).
 *
 * Fórmula:
 *   Meta Diaria = (pesoKg * ML_POR_KG) + (factorExtra ? EXTRA_ACTIVIDAD_O_CLIMA_ML : 0)
 *
 * @param {number} pesoKg - Peso corporal del usuario en kilogramos.
 * @param {boolean} [factorExtra=false] - Indica si hay actividad física o clima severo (+500 ml).
 * @returns {number} Meta diaria redondeada al entero más cercano en mililitros.
 */
const calcularMetaDiaria = (pesoKg, factorExtra = false) => {
  const peso = Number(pesoKg);

  if (!Number.isFinite(peso) || peso <= 0) {
    throw new AppError('El peso debe ser un número positivo válido.', 400);
  }

  let meta = peso * ML_POR_KG;

  if (Boolean(factorExtra)) {
    meta += EXTRA_ACTIVIDAD_O_CLIMA_ML;
  }

  return Math.round(meta);
};

/**
 * Calcula la ventana de vigilia del usuario entre dos horas en formato "HH:MM".
 * Valida que la hora de finalización sea estrictamente posterior a la hora de inicio.
 *
 * @param {string} horaInicio - Hora de inicio de vigilia (ej. "07:00").
 * @param {string} horaFin - Hora de fin de vigilia (ej. "21:00").
 * @returns {{ totalMinutos: number, totalHoras: number }} Minutos y horas decimales de vigilia.
 */
const calcularHorasVigilia = (horaInicio, horaFin) => {
  const minutosInicio = horaAMinutos(horaInicio);
  const minutosFin = horaAMinutos(horaFin);

  if (minutosFin <= minutosInicio) {
    throw new AppError('La hora de fin debe ser estrictamente posterior a la hora de inicio.', 400);
  }

  const totalMinutos = minutosFin - minutosInicio;
  const totalHoras = totalMinutos / 60;

  return {
    totalMinutos,
    totalHoras
  };
};

/**
 * Calcula el volumen de agua asignado a cada toma y la cantidad esperada de tomas (RN-02).
 *
 * Fórmula del SRS:
 *   Volumen por Toma = Meta Diaria / ((Horas de Vigilia * 60) / intervalo_minutos)
 *
 * @param {number} metaDiariaMl - Meta total diaria en mililitros.
 * @param {string} horaInicio - Inicio de vigilia en formato "HH:MM".
 * @param {string} horaFin - Fin de vigilia en formato "HH:MM".
 * @param {number} intervaloMinutos - Frecuencia entre tomas en minutos.
 * @returns {{ cantidad_ml_por_toma: number, total_tomas: number }}
 */
const calcularVolumenPorToma = (metaDiariaMl, horaInicio, horaFin, intervaloMinutos) => {
  const meta = Number(metaDiariaMl);
  if (!Number.isFinite(meta) || meta <= 0) {
    throw new AppError('La meta diaria debe ser un número positivo en mililitros.', 400);
  }

  const intervalo = Number(intervaloMinutos);
  if (!Number.isInteger(intervalo) || intervalo <= 0) {
    throw new AppError('El intervalo entre tomas debe ser un número entero positivo en minutos.', 400);
  }

  const { totalMinutos, totalHoras } = calcularHorasVigilia(horaInicio, horaFin);

  if (intervalo > totalMinutos) {
    throw new AppError('El intervalo entre tomas no puede superar la ventana total de vigilia.', 400);
  }

  const tomasTeoricas = (totalHoras * 60) / intervalo;
  const cantidadMlPorToma = Math.round(meta / tomasTeoricas);
  const totalTomas = Math.round(tomasTeoricas);

  return {
    cantidad_ml_por_toma: cantidadMlPorToma,
    total_tomas: totalTomas
  };
};

/**
 * Genera el cronograma secuencial de tomas diarias a partir de la ventana horaria (RF-03, RF-05).
 * Genera horas exactas incrementando el intervalo sin exceder la hora final.
 *
 * @param {Object} params
 * @param {string} params.horaInicio - Hora inicial de la primera toma ("HH:MM").
 * @param {string} params.horaFin - Hora límite para la programación ("HH:MM").
 * @param {number} params.intervaloMinutos - Frecuencia de tomas en minutos.
 * @param {number} params.cantidadMlPorToma - Dosis calculada en mililitros por toma.
 * @returns {Array<{ hora: string, cantidad_ml: number, estado: 'pendiente' }>} Lista ordenada de tomas.
 */
const generarCronogramaTomas = ({
  horaInicio,
  horaFin,
  intervaloMinutos,
  cantidadMlPorToma
}) => {
  const dosis = Number(cantidadMlPorToma);
  if (!Number.isFinite(dosis) || dosis <= 0) {
    throw new AppError('La cantidad en ml por toma debe ser un número positivo.', 400);
  }

  const intervalo = Number(intervaloMinutos);
  if (!Number.isInteger(intervalo) || intervalo <= 0) {
    throw new AppError('El intervalo en minutos debe ser un entero positivo.', 400);
  }

  const minutosInicio = horaAMinutos(horaInicio);
  const minutosFin = horaAMinutos(horaFin);

  if (minutosFin <= minutosInicio) {
    throw new AppError('La hora de fin debe ser estrictamente posterior a la hora de inicio.', 400);
  }

  const tomas = [];
  for (let tiempoActual = minutosInicio; tiempoActual <= minutosFin; tiempoActual += intervalo) {
    tomas.push({
      hora: minutosAHora(tiempoActual),
      cantidad_ml: Math.round(dosis),
      estado: 'pendiente'
    });
  }

  return tomas;
};

module.exports = {
  ML_POR_KG,
  EXTRA_ACTIVIDAD_O_CLIMA_ML,
  HORARIO_DEFAULT,
  calcularMetaDiaria,
  calcularHorasVigilia,
  calcularVolumenPorToma,
  generarCronogramaTomas
};
