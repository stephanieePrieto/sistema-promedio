'use strict';

const express = require('express');
const router = express.Router();

const { obtenerDatos } = require('../services/xmlManager');
const { calcularPromedio } = require('../services/calculations');

function escaparHTML(texto) {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function claseBadge(estado) {
  const clases = {
    Aprobado: 'badge badge-aprobado',
    'En riesgo': 'badge badge-riesgo',
    Reprobado: 'badge badge-reprobado',
    'Sin calificaciones': 'badge badge-pendiente'
  };
  return clases[estado] || 'badge';
}

function paginaBase(titulo, contenido) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escaparHTML(titulo)}</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <div class="card">
        ${contenido}
      </div>
    </body>
    </html>
  `;
}

// GET /alumnos/:matricula/boleta
router.get('/alumnos/:matricula/boleta', async (req, res) => {
  const { matricula } = req.params;

  try {
    const { estudiantes } = await obtenerDatos();
    const estudiante = estudiantes.find((e) => e.matricula.toUpperCase() === matricula.toUpperCase());

    if (!estudiante) {
      return res.status(404).send(
        paginaBase('Alumno no encontrado', `
          <h1>Alumno no encontrado</h1>
          <p class="error">No existe ningún estudiante con matrícula ${escaparHTML(matricula)}.</p>
          <div class="acciones">
            <a class="btn btn-secundario" href="/">Volver al inicio</a>
          </div>
        `)
      );
    }

    const resultado = calcularPromedio(estudiante.materias);

    const filasMaterias = estudiante.materias
      .map(
        (m) => `
        <div class="fila-resultado">
          <div>${escaparHTML(m.nombre)}</div>
          <div>${m.creditos}</div>
          <div>${m.calificacion !== null && m.calificacion !== undefined ? Number(m.calificacion).toFixed(1) : 'Pendiente'}</div>
        </div>
      `
      )
      .join('');

    const cuerpo = `
      <h1>Boleta de calificaciones</h1>

      <div class="datos-alumno">
        <div>
          <label>Matrícula</label>
          <input type="text" value="${escaparHTML(estudiante.matricula)}" disabled />
        </div>
        <div>
          <label>Nombre</label>
          <input type="text" value="${escaparHTML(estudiante.nombre)}" disabled />
        </div>
      </div>

      <h2>Materias</h2>
      <div class="tabla-header resultados-header">
        <div>Materia</div>
        <div>Créditos</div>
        <div>Calificación</div>
      </div>
      <div class="tabla-filas">
        ${filasMaterias || '<div class="vacio">Este alumno no tiene materias registradas.</div>'}
      </div>

      <div class="promedio-general">
        <span>Promedio final (créditos evaluados: ${resultado.creditosEvaluados} / ${resultado.creditosTotales})</span>
        <span id="promedioGeneral">${resultado.promedioFinal !== null ? resultado.promedioFinal : 'N/A'}</span>
      </div>

      <p style="margin-top: 14px;">
        Estado: <span class="${claseBadge(resultado.estado)}">${resultado.estado}</span>
      </p>

      <div class="acciones">
        <a class="btn btn-secundario" href="/alumnos/${escaparHTML(estudiante.matricula)}">Volver al perfil</a>
      </div>
    `;

    res.send(paginaBase(`Boleta de ${estudiante.nombre}`, cuerpo));
  } catch (error) {
    console.error('[reportes] Error al generar la boleta:', error);
    res.status(500).send(paginaBase('Error', '<h1>Ocurrió un error al generar la boleta.</h1>'));
  }
});

module.exports = router;