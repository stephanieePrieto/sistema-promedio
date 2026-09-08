const express = require('express');
const router = express.Router();
const { obtenerDatos, guardarDatos } = require('../services/xmlManager');

// GET /alumnos/:matricula/calificaciones
router.get('/alumnos/:matricula/calificaciones', async (req, res) => {
  try {
    const { matricula } = req.params;
    const datos = await obtenerDatos();
    const estudiante = datos.estudiantes.find(e => e.matricula.toUpperCase() === matricula.toUpperCase());

    if (!estudiante) {
      return res.status(404).send(`
        <link rel="stylesheet" href="/style.css">
        <div class="card"><p class="error">Alumno no encontrado.</p></div>
      `);
    }

    const filas = estudiante.materias.map(m => `
      <div class="fila-materia">
        <span><strong>${m.nombre}</strong> (${m.creditos} créditos)</span>
        <div>
          <input 
            type="number" 
            name="calif_${m.id}" 
            min="0" 
            max="100" 
            step="1" 
            value="${m.calificacion !== null && m.calificacion !== undefined ? m.calificacion : ''}" 
            placeholder="0 - 100" 
            style="width: 120px;"
          />
        </div>
      </div>
    `).join('');

    res.send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <h1>Capturar Calificaciones</h1>
        <p>Alumno: <strong>${estudiante.nombre}</strong> (${estudiante.matricula})</p>
        <p style="font-size: 13px; color: var(--text-secondary);">
          * Ingrese números enteros entre <strong>0</strong> y <strong>100</strong> (sin decimales). Deje la casilla en blanco para marcar como "Pendiente".
        </p>

        <form action="/alumnos/${estudiante.matricula}/calificaciones" method="POST">
          <div class="tabla-filas">
            ${filas || '<div class="vacio">No hay materias registradas para calificar.</div>'}
          </div>
          <div class="acciones">
            <button type="submit" class="btn btn-calcular">Guardar Notas</button>
            <a href="/alumnos/${estudiante.matricula}/panel" class="btn">Cancelar</a>
          </div>
        </form>
      </div>
    `);
  } catch (error) {
    res.status(500).send(`<p class="error">Error: ${error.message}</p>`);
  }
});

// POST /alumnos/:matricula/calificaciones
router.post('/alumnos/:matricula/calificaciones', async (req, res) => {
  try {
    const { matricula } = req.params;
    const datos = await obtenerDatos();
    const estudiante = datos.estudiantes.find(e => e.matricula.toUpperCase() === matricula.toUpperCase());

    if (!estudiante) throw new Error('Estudiante no encontrado.');

    // Validar entero estricto antes de guardar
    estudiante.materias.forEach(m => {
      const valor = req.body[`calif_${m.id}`];
      if (valor !== undefined && valor !== '') {
        const texto = String(valor).trim();
        
        // Rechazar si contiene punto o coma decimal
        if (texto.includes('.') || texto.includes(',')) {
          throw new Error(`La calificación de "${m.nombre}" (${texto}) contiene decimales. Solo se aceptan calificaciones enteras (0 a 100).`);
        }

        const cal = parseInt(texto, 10);
        if (isNaN(cal) || cal < 0 || cal > 100) {
          throw new Error(`La calificación de "${m.nombre}" (${texto}) no es válida. Debe situarse entre 0 y 100.`);
        }
        m.calificacion = cal;
      } else {
        m.calificacion = null;
      }
    });

    await guardarDatos(datos);
    res.redirect(`/alumnos/${estudiante.matricula}/panel`);
  } catch (error) {
    res.status(400).send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <h1>Error en Calificaciones</h1>
        <p class="error">${error.message}</p>
        <div class="acciones">
          <a href="/alumnos/${req.params.matricula}/calificaciones" class="btn btn-generar">Corregir</a>
          <a href="/alumnos/${req.params.matricula}/panel" class="btn">Volver al Panel</a>
        </div>
      </div>
    `);
  }
});

// Limpiar calificación
router.post('/alumnos/:matricula/materias/:idMateria/quitar-calificacion', async (req, res) => {
  try {
    const { matricula, idMateria } = req.params;
    const datos = await obtenerDatos();
    const estudiante = datos.estudiantes.find(e => e.matricula.toUpperCase() === matricula.toUpperCase());
    if (!estudiante) throw new Error('Alumno no encontrado.');

    const materia = estudiante.materias.find(m => m.id === parseInt(idMateria, 10));
    if (materia) materia.calificacion = null;

    await guardarDatos(datos);
    res.redirect(`/alumnos/${matricula}/panel`);
  } catch (error) {
    res.status(400).send(`<p class="error">Error: ${error.message}</p>`);
  }
});

module.exports = router;