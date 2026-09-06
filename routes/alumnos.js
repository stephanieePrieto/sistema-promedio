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
        <link rel="stylesheet" href="/style.css">
        <div class="card">
          <p class="error">Estudiante con matrícula "${matricula}" no encontrado.</p>
          <div class="acciones">
            <a href="/" class="btn btn-generar">Regresar</a>
          </div>
        </div>
      `);
    }

    res.send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <h1>Perfil de Estudiante</h1>
        <div class="datos-alumno">
          <div>
            <label>Matrícula</label>
            <input type="text" value="${estudiante.matricula}" disabled />
          </div>
          <div>
            <label>Nombre</label>
            <input type="text" value="${estudiante.nombre}" disabled />
          </div>
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

        <div class="acciones">
          <a href="/alumnos/${estudiante.matricula}/editar" class="btn btn-generar">Editar Datos</a>
          <form action="/alumnos/${estudiante.matricula}/eliminar" method="POST" onsubmit="return confirm('¿Seguro que deseas eliminar este estudiante y todas sus materias?');">
            <button type="submit" class="btn error">Eliminar Estudiante</button>
          </form>
          <a href="/" class="btn">Inicio</a>
        </div>
      </div>
    `);
  } catch (error) {
    res.status(500).send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <p class="error">Error en el servidor: ${error.message}</p>
      </div>
    `);
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
      return res.status(404).send(`
        <link rel="stylesheet" href="/style.css">
        <div class="card">
          <p class="error">Estudiante no encontrado.</p>
        </div>
      `);
    }

    res.send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <h1>Editar Estudiante</h1>
        <form action="/alumnos/${estudiante.matricula}/editar" method="POST">
          <div class="datos-alumno">
            <div>
              <label>Matrícula (No modificable):</label>
              <input type="text" value="${estudiante.matricula}" disabled />
            </div>
            <div>
              <label>Nombre Completo:</label>
              <input type="text" name="nombre" value="${estudiante.nombre}" required />
            </div>
          </div>
          <div class="acciones">
            <button type="submit" class="btn btn-calcular">Guardar Cambios</button>
            <a href="/alumnos/${estudiante.matricula}" class="btn">Cancelar</a>
          </div>
        </form>
      </div>
    `);
  } catch (error) {
    res.status(500).send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <p class="error">Error en el servidor: ${error.message}</p>
      </div>
    `);
  }
});

// 3. Procesar Edición de Alumno (POST)
router.post('/:matricula/editar', async (req, res) => {
  try {
    const { matricula } = req.params;
    const { nombre } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).send(`
        <link rel="stylesheet" href="/style.css">
        <div class="card">
          <p class="error">El nombre no puede estar vacío.</p>
          <div class="acciones">
            <a href="/alumnos/${matricula}/editar" class="btn btn-generar">Volver a intentar</a>
          </div>
        </div>
      `);
    }

    const datos = await obtenerDatos();
    const estudiante = datos.estudiantes.find(
      (e) => e.matricula.toUpperCase() === matricula.toUpperCase()
    );

    if (!estudiante) {
      return res.status(404).send(`
        <link rel="stylesheet" href="/style.css">
        <div class="card">
          <p class="error">Estudiante no encontrado.</p>
        </div>
      `);
    }

    estudiante.nombre = nombre.trim();
    await guardarDatos(datos);

    res.redirect(`/alumnos/${matricula}`);
  } catch (error) {
    res.status(500).send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <p class="error">Error al actualizar: ${error.message}</p>
      </div>
    `);
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
      return res.status(404).send(`
        <link rel="stylesheet" href="/style.css">
        <div class="card">
          <p class="error">Estudiante no encontrado para eliminar.</p>
        </div>
      `);
    }

    datos.estudiantes.splice(indice, 1);
    await guardarDatos(datos);

    res.send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <h1>Estudiante Eliminado</h1>
        <p class="error">El registro de la matrícula ${matricula} fue removido con éxito del XML.</p>
        <div class="acciones">
          <a href="/" class="btn btn-generar">Volver al Inicio</a>
        </div>
      </div>
    `);
  } catch (error) {
    res.status(500).send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <p class="error">Error al eliminar: ${error.message}</p>
      </div>
    `);
  }
});

module.exports = router;