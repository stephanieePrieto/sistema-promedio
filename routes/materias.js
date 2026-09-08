const express = require('express');
const router = express.Router();
const xmlManager = require('../services/xmlManager');

// GET /alumnos/:matricula/materias ... mostrar lista de materias
router.get('/:matricula/materias', async (req, res) => {
    try {
        const matricula = req.params.matricula;
        const datos = await xmlManager.obtenerDatos();
        
        const estudiante = datos.estudiantes.find(e => e.matricula === matricula);

        if (!estudiante) {
            return res.status(404).send("Estudiante no encontrado.");
        }

        res.json({
            mensaje: `Materias del alumno ${estudiante.nombre}`,
            materias: estudiante.materias
        });

    } catch (error) {
        res.status(500).send(`Error al cargar las materias: ${error.message}`);
    }
});

// POST /alumnos/:matricula/materias ... agregar nueva materia
router.post('/:matricula/materias', async (req, res) => {
    try {
        const matricula = req.params.matricula;
        const { nombre, creditos } = req.body;
        
        const datos = await xmlManager.obtenerDatos();
        const estudiante = datos.estudiantes.find(e => e.matricula === matricula);

        if (!estudiante) {
            return res.status(404).send("Estudiante no encontrado.");
        }

        let nuevoId = 1;
        if (estudiante.materias.length > 0) {
            nuevoId = Math.max(...estudiante.materias.map(m => m.id)) + 1;
        }

        const nuevaMateria = {
            id: nuevoId,
            nombre: nombre,
            creditos: parseInt(creditos, 10),
            calificacion: null
        };

        estudiante.materias.push(nuevaMateria);

        await xmlManager.guardarDatos(datos);

        res.redirect(`/alumnos/${matricula}/materias`);
    } catch (error) {
        res.status(400).send(`Error al guardar la materia: ${error.message}`);
    }
});

// POST /alumnos/:matricula/materias/:idMateria/editar ... modificar materia
router.post('/:matricula/materias/:idMateria/editar', async (req, res) => {
    try {
        const matricula = req.params.matricula;
        const idMateria = parseInt(req.params.idMateria, 10);
        const { nombre, creditos } = req.body;
        
        const datos = await xmlManager.obtenerDatos();
        const estudiante = datos.estudiantes.find(e => e.matricula === matricula);

        if (!estudiante) return res.status(404).send("Estudiante no encontrado.");

        const indexMateria = estudiante.materias.findIndex(m => m.id === idMateria);
        if (indexMateria === -1) return res.status(404).send("Materia no encontrada.");

        estudiante.materias[indexMateria].nombre = nombre;
        estudiante.materias[indexMateria].creditos = parseInt(creditos, 10);

        await xmlManager.guardarDatos(datos);
        res.redirect(`/alumnos/${matricula}/materias`);
    } catch (error) {
        res.status(400).send(`Error al editar la materia: ${error.message}`);
    }
});

// POST /alumnos/:matricula/materias/:idMateria/eliminar ... eliminar materia
router.post('/:matricula/materias/:idMateria/eliminar', async (req, res) => {
    try {
        const matricula = req.params.matricula;
        const idMateria = parseInt(req.params.idMateria, 10);
        
        const datos = await xmlManager.obtenerDatos();
        const estudiante = datos.estudiantes.find(e => e.matricula === matricula);

        if (!estudiante) return res.status(404).send("Estudiante no encontrado.");

        estudiante.materias = estudiante.materias.filter(m => m.id !== idMateria);

        await xmlManager.guardarDatos(datos);
        res.redirect(`/alumnos/${matricula}/materias`);
    } catch (error) {
        res.status(400).send(`Error al eliminar la materia: ${error.message}`);
    }
});

module.exports = router;