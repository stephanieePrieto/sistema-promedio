'use strict';

// Escala institucional para determinar el estado del alumno.
// Ajusta estos valores si tu facultad maneja otra escala.
const CALIFICACION_MINIMA_APROBATORIA = 70;
const CALIFICACION_MINIMA_RIESGO = 60;

/**
 * Calcula el promedio ponderado por créditos
 * Solo toma en cuenta las materias que ya tienen una calificación asignada.
 *
 * @param {Array<{creditos:number, calificacion:number|null}>} materias
 * @returns {{
 *   promedioFinal: number|null,
 *   creditosEvaluados: number,
 *   creditosTotales: number,
 *   estado: 'Aprobado'|'En riesgo'|'Reprobado'|'Sin calificaciones'
 * }}
 */
function calcularPromedio(materias = []) {
    const materiasEvaluadas = materias.filter(
        (m) => m && m.calificacion !== null && m.calificacion !== undefined && m.calificacion !== ''
    );

    const creditosTotales = materias.reduce((acc, m) => acc + (Number(m.creditos) || 0), 0);
    const creditosEvaluados = materiasEvaluadas.reduce(
        (acc, m) => acc + (Number(m.creditos) || 0),
        0
    );

    // Si no tiene calificación no hay promedio que calcular
    if (materiasEvaluadas.length === 0 || creditosEvaluados === 0) {
        return {
            promedioFinal: null,
            creditosEvaluados: 0,
            creditosTotales,
            estado: 'Sin calificaciones'
        };
    }

    const sumaPonderada = materiasEvaluadas.reduce(
        (acc, m) => acc + Number(m.calificacion) * Number(m.creditos),
        0
    );

    const promedioFinal = Number((sumaPonderada / creditosEvaluados).toFixed(2));

    let estado;
    if (promedioFinal >= CALIFICACION_MINIMA_APROBATORIA) {
        estado = 'Aprobado';
    } else if (promedioFinal >= CALIFICACION_MINIMA_RIESGO) {
        estado = 'En riesgo';
    } else {
        estado = 'Reprobado';
    }

    return { promedioFinal, creditosEvaluados, creditosTotales, estado };
}

module.exports = { calcularPromedio };