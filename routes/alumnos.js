const express = require('express');
const router = express.Router();
const xmlManager = require('../services/xmlManager');

router.get('/', async (req, res) => {
    try {
        const datos = await xmlManager.obtenerDatos();
        let html = '<h1>Catálogo de Alumnos</h1><table border="1"><tr><th>Matrícula</th><th>Nombre</th><th>Total Materias</th></tr>';

        datos.estudiantes.forEach(est => {
            const totalMaterias = est.materias ? est.materias.length : 0;
            html += `<tr><td>${est.matricula}</td><td>${est.nombre}</td><td>${totalMaterias}</td></tr>`;
        });

        html += '</table><br><a href="/alumnos/nuevo">Registrar nuevo alumno</a>';
        res.send(html);
    } catch (error) {
        res.status(500).send('Error al leer el XML');
    }
});

router.get('/nuevo', (req, res) => {
    const html = `
        <h1>Nuevo Alumno</h1>
        <form action="/alumnos" method="POST">
            <label>Matrícula:</label>
            <input type="text" name="matricula" required><br><br>
            <label>Nombre:</label>
            <input type="text" name="nombre" required><br><br>
            <button type="submit">Guardar</button>
        </form>
        <a href="/alumnos">Regresar</a>
    `;
    res.send(html);
});

router.post('/', async (req, res) => {
    try {
        const { matricula, nombre } = req.body;
        const datos = await xmlManager.obtenerDatos();

        const matriculaRepetida = datos.estudiantes.some(est => est.matricula === matricula);
        if (matriculaRepetida) {
            return res.send('La matrícula ya existe. <a href="/alumnos/nuevo">Intentar otra vez</a>');
        }

        datos.estudiantes.push({
            matricula: matricula,
            nombre: nombre,
            materias: []
        });

        await xmlManager.guardarDatos(datos);
        res.redirect('/alumnos');
    } catch (error) {
        res.status(500).send('Error al guardar: ' + error.message);
    }
});

module.exports = router;