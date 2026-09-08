'use strict';

/**
 * @fileoverview Enrutador para el control de materias y créditos por estudiante (Integrante 5).
 * Valida límites institucionales (1 a 25 créditos) y persistencia XML.
 * @module routes/materias
 */

const express = require('express');
const router = express.Router();
const xmlManager = require('../services/xmlManager');

/**
 * Muestra el formulario para inscribir una nueva materia en el nodo del estudiante.
 * @name GET/:matricula/materias/nueva
 * @function
 * @param {express.Request} req - Parámetros: { matricula: string }.
 * @param {express.Response} res - Vista HTML para registrar materia.
 */
router.get('/:matricula/materias/nueva', async (req, res) => {
  try {
    const { matricula } = req.params;
    const datos = await xmlManager.obtenerDatos();
    const estudiante = datos.estudiantes.find(
      (e) => e.matricula.toUpperCase() === matricula.toUpperCase()
    );

    if (!estudiante) {
      return res.status(404).send('<p class="error">Estudiante no encontrado.</p>');
    }

    res.send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <h1>Inscribir Materia</h1>
        <p>Alumno: <strong>${estudiante.nombre}</strong> (${estudiante.matricula})</p>
        
        <form action="/alumnos/${estudiante.matricula}/materias" method="POST">
          <div class="datos-alumno">
            <div>
              <label for="nombre">Nombre de la Experiencia Educativa / Materia:</label>
              <input type="text" id="nombre" name="nombre" placeholder="Ej. Redes y Comunicaciones" required />
            </div>
            <div>
              <label for="creditos">Créditos (Rango institucional: 1 a 25):</label>
              <input type="number" id="creditos" name="creditos" min="1" max="25" placeholder="1 - 25" required />
            </div>
          </div>
          <div class="acciones">
            <button type="submit" class="btn btn-calcular">Agregar Materia</button>
            <a href="/alumnos/${estudiante.matricula}/panel" class="btn">Cancelar</a>
          </div>
        </form>
      </div>
    `);
  } catch (error) {
    res.status(500).send(`<p class="error">Error: ${error.message}</p>`);
  }
});

/**
 * Inserta una nueva materia calculando un identificador secuencial y validando créditos.
 * @name POST/:matricula/materias
 * @function
 * @param {express.Request} req - Cuerpo: { nombre: string, creditos: string|number }.
 * @param {express.Response} res - Redirección al panel del estudiante.
 * @throws {Error} Si el nombre está vacío o los créditos quedan fuera de 1 a 25.
 */
router.post('/:matricula/materias', async (req, res) => {
  try {
    const { matricula } = req.params;
    const { nombre, creditos } = req.body;

    if (!nombre || nombre.trim() === '') {
      throw new Error('El nombre de la materia no puede estar vacío.');
    }

    const numCreditos = parseInt(creditos, 10);
    if (isNaN(numCreditos) || numCreditos < 1 || numCreditos > 25) {
      throw new Error(
        `Los créditos ingresados (${creditos}) son inválidos. El valor debe ser un entero entre 1 y 25.`
      );
    }

    const datos = await xmlManager.obtenerDatos();
    const estudiante = datos.estudiantes.find(
      (e) => e.matricula.toUpperCase() === matricula.toUpperCase()
    );

    if (!estudiante) {
      throw new Error('Estudiante no encontrado en la base de datos.');
    }

    let nuevoId = 1;
    if (estudiante.materias.length > 0) {
      nuevoId = Math.max(...estudiante.materias.map((m) => m.id)) + 1;
    }

    estudiante.materias.push({
      id: nuevoId,
      nombre: nombre.trim(),
      creditos: numCreditos,
      calificacion: null
    });

    await xmlManager.guardarDatos(datos);
    res.redirect(`/alumnos/${matricula}/panel`);
  } catch (error) {
    res.status(400).send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <h1>Error al Agregar Materia</h1>
        <p class="error">${error.message}</p>
        <div class="acciones">
          <a href="/alumnos/${req.params.matricula}/materias/nueva" class="btn btn-generar">Volver a intentar</a>
          <a href="/alumnos/${req.params.matricula}/panel" class="btn">Volver al Panel</a>
        </div>
      </div>
    `);
  }
});

/**
 * Sirve el formulario para modificar el nombre y los créditos de una materia inscrita.
 * @name GET/:matricula/materias/:idMateria/editar
 * @function
 * @param {express.Request} req - Parámetros: { matricula: string, idMateria: string }.
 * @param {express.Response} res - Formulario con datos precargados de la materia.
 */
router.get('/:matricula/materias/:idMateria/editar', async (req, res) => {
  try {
    const { matricula, idMateria } = req.params;
    const datos = await xmlManager.obtenerDatos();
    const estudiante = datos.estudiantes.find(
      (e) => e.matricula.toUpperCase() === matricula.toUpperCase()
    );

    if (!estudiante) return res.status(404).send('<p class="error">Estudiante no encontrado.</p>');

    const materia = estudiante.materias.find((m) => m.id === parseInt(idMateria, 10));
    if (!materia) return res.status(404).send('<p class="error">Materia no encontrada.</p>');

    res.send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <h1>Editar Materia</h1>
        <form action="/alumnos/${estudiante.matricula}/materias/${materia.id}/editar" method="POST">
          <div class="datos-alumno">
            <div>
              <label>Nombre de la Materia:</label>
              <input type="text" name="nombre" value="${materia.nombre}" required />
            </div>
            <div>
              <label>Créditos (1 - 25):</label>
              <input type="number" name="creditos" min="1" max="25" value="${materia.creditos}" required />
            </div>
          </div>
          <div class="acciones">
            <button type="submit" class="btn btn-calcular">Guardar Cambios</button>
            <a href="/alumnos/${estudiante.matricula}/panel" class="btn">Cancelar</a>
          </div>
        </form>
      </div>
    `);
  } catch (error) {
    res.status(500).send(`<p class="error">Error: ${error.message}</p>`);
  }
});

/**
 * Actualiza los datos de la materia en el XML asegurando créditos dentro del rango 1 a 25.
 * @name POST/:matricula/materias/:idMateria/editar
 * @function
 * @param {express.Request} req - Cuerpo: { nombre: string, creditos: string|number }.
 * @param {express.Response} res - Redirección al panel del estudiante.
 */
router.post('/:matricula/materias/:idMateria/editar', async (req, res) => {
  try {
    const { matricula, idMateria } = req.params;
    const { nombre, creditos } = req.body;

    if (!nombre || nombre.trim() === '') throw new Error('El nombre de la materia es obligatorio.');

    const numCreditos = parseInt(creditos, 10);
    if (isNaN(numCreditos) || numCreditos < 1 || numCreditos > 25) {
      throw new Error(`Los créditos (${creditos}) están fuera del rango reglamentario (1 a 25).`);
    }

    const datos = await xmlManager.obtenerDatos();
    const estudiante = datos.estudiantes.find(
      (e) => e.matricula.toUpperCase() === matricula.toUpperCase()
    );
    if (!estudiante) throw new Error('Estudiante no encontrado.');

    const materia = estudiante.materias.find((m) => m.id === parseInt(idMateria, 10));
    if (!materia) throw new Error('Materia no encontrada para editar.');

    materia.nombre = nombre.trim();
    materia.creditos = numCreditos;

    await xmlManager.guardarDatos(datos);
    res.redirect(`/alumnos/${matricula}/panel`);
  } catch (error) {
    res.status(400).send(`
      <link rel="stylesheet" href="/style.css">
      <div class="card">
        <h1>Error al Modificar Materia</h1>
        <p class="error">${error.message}</p>
        <div class="acciones">
          <a href="/alumnos/${req.params.matricula}/panel" class="btn btn-generar">Volver al Panel</a>
        </div>
      </div>
    `);
  }
});

/**
 * Remueve una materia específica del nodo de materias del estudiante.
 * @name POST/:matricula/materias/:idMateria/eliminar
 * @function
 * @param {express.Request} req - Parámetros: { matricula: string, idMateria: string }.
 * @param {express.Response} res - Redirección al panel del estudiante.
 */
router.post('/:matricula/materias/:idMateria/eliminar', async (req, res) => {
  try {
    const { matricula, idMateria } = req.params;
    const datos = await xmlManager.obtenerDatos();
    const estudiante = datos.estudiantes.find(
      (e) => e.matricula.toUpperCase() === matricula.toUpperCase()
    );

    if (!estudiante) throw new Error('Estudiante no encontrado.');

    estudiante.materias = estudiante.materias.filter(
      (m) => m.id !== parseInt(idMateria, 10)
    );
    await xmlManager.guardarDatos(datos);

    res.redirect(`/alumnos/${matricula}/panel`);
  } catch (error) {
    res.status(400).send(`<p class="error">Error al eliminar materia: ${error.message}</p>`);
  }
});

module.exports = router;