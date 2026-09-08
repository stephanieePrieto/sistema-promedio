const express = require('express');
const router = express.Router();
const { obtenerDatos, guardarDatos } = require('../services/xmlManager');


// 1. Formulario de registro de alumno
router.get('/nuevo', (req, res) => {
  res.send(`
    <link rel="stylesheet" href="/style.css">
    <div class="card">
      <h1>Registrar Nuevo Alumno</h1>
      <form action="/alumnos" method="POST">
        <div class="datos-alumno">
          <div>
            <label for="matricula">Matrícula:</label>
            <input 
              type="text" 
              id="matricula" 
              name="matricula" 
              placeholder="Ej. S24013375" 
              pattern="^[Ss](0[0-9]|1[0-9]|2[0-6])[0-9]{6}$" 
              title="Debe iniciar con S o s, seguido de dos dígitos de año (00 a 26) y 6 dígitos numéricos."
              required 
            />
            <small style="color: var(--text-muted); font-size: 12px;">Formato: S + Año (00-26) + 6 dígitos.</small>
          </div>
          <div>
            <label for="nombre">Nombre Completo:</label>
            <input type="text" id="nombre" name="nombre" placeholder="Nombre y Apellidos" required />
          </div>
        </div>
        <div class="acciones">
          <button type="submit" class="btn btn-calcular">Guardar Alumno</button>
          <a href="/alumnos" class="btn">Cancelar</a>
        </div>
      </form>
    </div>
  `);
});

// 2. Catálogo general de alumnos
router.get('/', async (req, res) => {
  try {
    const datos = await obtenerDatos();
    const filas = datos.estudiantes.map(e => `
      <div class="fila-resultado">
        <div><a href="/alumnos/${e.matricula}/panel">${e.matricula}</a></div>
        <div>${e.nombre}</div>
        <div>${e.materias.length} materias</div>
      </div>
    `).join('');

    res.send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <h1>Catálogo de Estudiantes</h1>
        <div class="acciones">
          <a href="/alumnos/nuevo" class="btn btn-generar">+ Nuevo Alumno</a>
          <a href="/" class="btn">Inicio</a>
        </div>
        <div class="tabla-header resultados-header">
          <div>Matrícula</div>
          <div>Nombre</div>
          <div>Materias Inscritas</div>
        </div>
        <div class="tabla-filas">
          ${filas || '<div class="vacio">No hay estudiantes registrados.</div>'}
        </div>
      </div>
    `);
  } catch (err) {
    res.status(500).send(`<p class="error">Error: ${err.message}</p>`);
  }
});

// 3. Procesamiento de alta
router.post('/', async (req, res) => {
  try {
    const { matricula, nombre } = req.body;

    if (!nombre || nombre.trim() === '') {
      throw new Error('El nombre completo es obligatorio.');
    }

    const mat = matricula ? matricula.trim().toUpperCase() : '';
    const regexMatricula = /^[Ss](0[0-9]|1[0-9]|2[0-6])[0-9]{6}$/;
    if (!regexMatricula.test(mat)) {
      throw new Error(`La matrícula "${matricula}" no es válida. Debe iniciar con S o s, tener un año entre 00 y 26, y 6 números (ej. S24013375).`);
    }

    const datos = await obtenerDatos();
    const duplicada = datos.estudiantes.some(e => e.matricula.toUpperCase() === mat);
    if (duplicada) {
      throw new Error(`La matrícula ${mat} ya está registrada en el sistema. Ingrese una matrícula distinta.`);
    }

    datos.estudiantes.push({
      matricula: mat,
      nombre: nombre.trim(),
      materias: []
    });

    await guardarDatos(datos);
    res.redirect(`/alumnos/${mat}/panel`);
  } catch (error) {
    res.status(400).send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <h1>Error en el Registro</h1>
        <p class="error">${error.message}</p>
        <div class="acciones">
          <a href="/alumnos/nuevo" class="btn btn-generar">Volver a intentar</a>
          <a href="/alumnos" class="btn">Catálogo</a>
        </div>
      </div>
    `);
  }
});

// 4. Panel interactivo del estudiante
router.get(['/:matricula', '/:matricula/panel'], async (req, res) => {
  try {
    const { matricula } = req.params;
    const datos = await obtenerDatos();
    const estudiante = datos.estudiantes.find(e => e.matricula.toUpperCase() === matricula.toUpperCase());

    if (!estudiante) {
      return res.status(404).send(`
        <link rel="stylesheet" href="/style.css">
        <div class="card">
          <p class="error">Estudiante con matrícula "${matricula}" no encontrado.</p>
          <div class="acciones"><a href="/" class="btn">Inicio</a></div>
        </div>
      `);
    }

    res.send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <h1>Panel del Estudiante</h1>
        <div class="datos-alumno">
          <div><label>Matrícula</label><input type="text" value="${estudiante.matricula}" disabled /></div>
          <div><label>Nombre Completo</label><input type="text" value="${estudiante.nombre}" disabled /></div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
          <h2 style="margin: 0;">Materias Registradas (${estudiante.materias.length})</h2>
          <a href="/alumnos/${estudiante.matricula}/materias/nueva" class="btn btn-generar">+ Inscribir Materia</a>
        </div>

        <div class="tabla-header" style="grid-template-columns: 0.6fr 1.6fr 0.8fr 1fr 1.6fr; margin-top: 12px;">
          <span>ID</span>
          <span>Materia</span>
          <span>Créditos</span>
          <span>Calificación</span>
          <span style="text-align: right;">Acciones</span>
        </div>

        <div class="tabla-filas">
          ${
            estudiante.materias.length === 0
              ? '<div class="vacio">No hay materias inscritas. Haz clic en "+ Inscribir Materia" para registrar una.</div>'
              : estudiante.materias.map(m => `
                <div class="fila-materia" style="grid-template-columns: 0.6fr 1.6fr 0.8fr 1fr 1.6fr;">
                  <span>#${m.id}</span>
                  <span><strong>${m.nombre}</strong></span>
                  <span>${m.creditos} cr.</span>
                  <span>${m.calificacion !== null && m.calificacion !== undefined ? m.calificacion : '<em>Pendiente</em>'}</span>
                  <div style="display: flex; gap: 6px; justify-content: flex-end;">
                    <a href="/alumnos/${estudiante.matricula}/materias/${m.id}/editar" class="btn btn-secundario" style="padding: 4px 8px; font-size: 12px;">Editar</a>
                    ${
                      m.calificacion !== null && m.calificacion !== undefined
                        ? `<form action="/alumnos/${estudiante.matricula}/materias/${m.id}/quitar-calificacion" method="POST" style="margin:0;">
                             <button type="submit" class="btn" style="padding: 4px 8px; font-size: 12px; background: #fdf3d9; border-color: #a4720a; color: #7a5901;">Quitar Nota</button>
                           </form>`
                        : ''
                    }
                    <form action="/alumnos/${estudiante.matricula}/materias/${m.id}/eliminar" method="POST" style="margin: 0;" onsubmit="return confirm('¿Eliminar esta materia?');">
                      <button type="submit" class="btn error" style="padding: 4px 8px; font-size: 12px;">Baja</button>
                    </form>
                  </div>
                </div>
              `).join('')
          }
        </div>

        <div class="acciones" style="flex-wrap: wrap; gap: 10px; margin-top: 30px;">
          <a href="/alumnos/${estudiante.matricula}/boleta" class="btn btn-calcular">Ver Boleta de Promedio</a>
          <a href="/alumnos/${estudiante.matricula}/calificaciones" class="btn btn-generar">Capturar / Modificar Notas</a>
          <a href="/alumnos/${estudiante.matricula}/editar" class="btn">Editar Nombre</a>
          <form action="/alumnos/${estudiante.matricula}/eliminar" method="POST" onsubmit="return confirm('¿Seguro que deseas dar de baja este estudiante?');" style="margin: 0;">
            <button type="submit" class="btn error">Eliminar Alumno</button>
          </form>
          <a href="/alumnos" class="btn">Catálogo</a>
        </div>
      </div>
    `);
  } catch (err) {
    res.status(500).send(`<p class="error">Error: ${err.message}</p>`);
  }
});

// 5. Editar Alumno
router.get('/:matricula/editar', async (req, res) => {
  const datos = await obtenerDatos();
  const estudiante = datos.estudiantes.find(e => e.matricula.toUpperCase() === req.params.matricula.toUpperCase());
  if (!estudiante) return res.status(404).send('No encontrado');

  res.send(`
    <link rel="stylesheet" href="/style.css">
    <div class="card">
      <h1>Editar Estudiante</h1>
      <form action="/alumnos/${estudiante.matricula}/editar" method="POST">
        <div class="datos-alumno">
          <div><label>Matrícula</label><input type="text" value="${estudiante.matricula}" disabled /></div>
          <div><label>Nombre Completo</label><input type="text" name="nombre" value="${estudiante.nombre}" required /></div>
        </div>
        <div class="acciones">
          <button type="submit" class="btn btn-calcular">Guardar</button>
          <a href="/alumnos/${estudiante.matricula}/panel" class="btn">Cancelar</a>
        </div>
      </form>
    </div>
  `);
});

router.post('/:matricula/editar', async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || nombre.trim() === '') throw new Error('El nombre no puede quedar vacío.');
    const datos = await obtenerDatos();
    const estudiante = datos.estudiantes.find(e => e.matricula.toUpperCase() === req.params.matricula.toUpperCase());
    if (estudiante) {
      estudiante.nombre = nombre.trim();
      await guardarDatos(datos);
    }
    res.redirect(`/alumnos/${req.params.matricula}/panel`);
  } catch (error) {
    res.status(400).send(`<p class="error">Error: ${error.message}</p>`);
  }
});

// 6. Eliminar Alumno
router.post('/:matricula/eliminar', async (req, res) => {
  const datos = await obtenerDatos();
  datos.estudiantes = datos.estudiantes.filter(e => e.matricula.toUpperCase() !== req.params.matricula.toUpperCase());
  await guardarDatos(datos);
  res.redirect('/alumnos');
});

module.exports = router;