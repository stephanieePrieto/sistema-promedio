const express = require('express');
const router = express.Router();
const { obtenerDatos, guardarDatos } = require('../services/xmlManager');

// 1. Vista / Lógica de Búsqueda de Alumno por Matrícula
router.get('/:matricula', async (req, res) => {
  try {
    const { matricula } = req.params;
    const datos = await obtenerDatos();
    const estudiante = datos.estudiantes.find(
      (e) => e.matricula.toUpperCase() === matricula.toUpperCase()
    );

    if (!estudiante) {
      return res.status(404).send(`
        <div class="card">
          <p class="error">Estudiante con matrícula "${matricula}" no encontrado.</p>
          <a href="/" class="btn btn-generar">Regresar</a>
        </div>
      `);
    }

    res.send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <h1>Perfil de Estudiante</h1>
        <div class="datos-alumno">
          <p><strong>Matrícula:</strong> ${estudiante.matricula}</p>
          <p><strong>Nombre:</strong> ${estudiante.nombre}</p>
        </div>

        <h2>Materias Registradas (${estudiante.materias.length})</h2>
        <div class="tabla-header">
          <span>ID</span>
          <span>Materia</span>
          <span>Créditos</span>
          <span>Calificación</span>
        </div>
        <div class="tabla-filas">
          ${
            estudiante.materias.length === 0
              ? '<div class="vacio">No hay materias registradas.</div>'
              : estudiante.materias
                  .map(
                    (m) => `
                    <div class="fila-materia">
                      <span>${m.id}</span>
                      <span>${m.nombre}</span>
                      <span>${m.creditos}</span>
                      <span>${m.calificacion !== null ? m.calificacion : 'Pendiente'}</span>
                    </div>
                  `
                  )
                  .join('')
          }
        </div>

        <div class="acciones" style="gap: 12px; margin-top: 24px;">
          <a href="/alumnos/${estudiante.matricula}/editar" class="btn btn-generar">Editar Datos</a>
          <form action="/alumnos/${estudiante.matricula}/eliminar" method="POST" style="margin: 0;" onsubmit="return confirm('¿Seguro que deseas eliminar este estudiante y todas sus materias?');">
            <button type="submit" class="btn" style="background: #fbe9e9; border-color: #e3a4a4; color: #9a1c1c;">Eliminar Estudiante</button>
          </form>
          <a href="/" class="btn" style="background: #e5e5e5; text-decoration: none; color: inherit;">Inicio</a>
        </div>
      </div>
    `);
  } catch (error) {
    res.status(500).send(`<p class="error">Error en el servidor: ${error.message}</p>`);
  }
});

// 2. Formulario para Editar Alumno (GET)
router.get('/:matricula/editar', async (req, res) => {
  try {
    const { matricula } = req.params;
    const datos = await obtenerDatos();
    const estudiante = datos.estudiantes.find(
      (e) => e.matricula.toUpperCase() === matricula.toUpperCase()
    );

    if (!estudiante) {
      return res.status(404).send('<p class="error">Estudiante no encontrado.</p>');
    }

    res.send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <h1>Editar Estudiante</h1>
        <form action="/alumnos/${estudiante.matricula}/editar" method="POST">
          <div style="margin-bottom: 16px;">
            <label>Matrícula (No modificable):</label>
            <input type="text" value="${estudiante.matricula}" disabled />
          </div>
          <div style="margin-bottom: 24px;">
            <label>Nombre Completo:</label>
            <input type="text" name="nombre" value="${estudiante.nombre}" required />
          </div>
          <div class="acciones" style="gap: 12px;">
            <button type="submit" class="btn btn-calcular">Guardar Cambios</button>
            <a href="/alumnos/${estudiante.matricula}" class="btn" style="background: #e5e5e5; text-decoration: none; color: inherit;">Cancelar</a>
          </div>
        </form>
      </div>
    `);
  } catch (error) {
    res.status(500).send(`<p class="error">Error en el servidor: ${error.message}</p>`);
  }
});

// 3. Procesar Edición de Alumno (POST)
router.post('/:matricula/editar', async (req, res) => {
  try {
    const { matricula } = req.params;
    const { nombre } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).send('<p class="error">El nombre no puede estar vacío.</p>');
    }

    const datos = await obtenerDatos();
    const estudiante = datos.estudiantes.find(
      (e) => e.matricula.toUpperCase() === matricula.toUpperCase()
    );

    if (!estudiante) {
      return res.status(404).send('<p class="error">Estudiante no encontrado.</p>');
    }

    // Actualizamos el nombre
    estudiante.nombre = nombre.trim();

    // Guardamos y validamos contra el XSD mediante xmlManager
    await guardarDatos(datos);

    res.redirect(`/alumnos/${matricula}`);
  } catch (error) {
    res.status(500).send(`<p class="error">Error al actualizar: ${error.message}</p>`);
  }
});

// 4. Procesar Eliminación en Cascada de Alumno (POST)
router.post('/:matricula/eliminar', async (req, res) => {
  try {
    const { matricula } = req.params;
    const datos = await obtenerDatos();

    const indice = datos.estudiantes.findIndex(
      (e) => e.matricula.toUpperCase() === matricula.toUpperCase()
    );

    if (indice === -1) {
      return res.status(404).send('<p class="error">Estudiante no encontrado para eliminar.</p>');
    }

    // Eliminamos al estudiante y automáticamente a sus materias hijas
    datos.estudiantes.splice(indice, 1);

    await guardarDatos(datos);

    res.send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card" style="text-align: center;">
        <h1 style="color: #9a1c1c;">Estudiante Eliminado</h1>
        <p>El registro de la matrícula <strong>${matricula}</strong> fue removido con éxito del XML.</p>
        <div class="acciones">
          <a href="/" class="btn btn-generar">Volver al Inicio</a>
        </div>
      </div>
    `);
  } catch (error) {
    res.status(500).send(`<p class="error">Error al eliminar: ${error.message}</p>`);
  }
});

module.exports = router;