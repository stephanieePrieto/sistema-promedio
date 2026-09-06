const express = require('express');
const router = express.Router();
const xmlManager = require('../services/xmlManager');

//Mostrar formulario leyendo el xml
// Ruta: GET /alumnos/:matricula/calificaciones
router.get('/:matricula/calificaciones', async (req, res) => {
    try {
        const matricula = req.params.matricula;
        
        //Obtener los datos del xml
        const datos = await xmlManager.obtenerDatos();
        
        //Buscar al alumno 
        const estudiante = datos.estudiantes.find(e => e.matricula === matricula);
        if (!estudiante) {
            return res.status(404).send("Estudiante no encontrado en el sistema.");
        }

        //Hacer el formulario HTML
        //El html y css eran solo para probarlos
        let html = `<h2>Asignación de Notas - ${estudiante.nombre} (${estudiante.matricula})</h2>`;
        html += `<form action="/alumnos/${matricula}/calificaciones" method="POST">`;
        
        estudiante.materias.forEach(materia => {
            // Mostrar calificación si ya existe
            const valorActual = materia.calificacion !== null && materia.calificacion !== undefined 
                ? `value="${materia.calificacion}"` 
                : '';
            
            html += `
                <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ccc;">
                    <label style="display:inline-block; width: 250px;">
                        <strong>${materia.nombre}</strong> (Créditos: ${materia.creditos})
                    </label>
                    
                    <input type="number" name="calificacion_${materia.id}" min="0" max="100" step="0.1" ${valorActual}>
                    
                    <button type="submit" 
                            formaction="/alumnos/${matricula}/materias/${materia.id}/quitar-calificacion" 
                            formmethod="POST" 
                            style="margin-left: 10px; color: red;">
                        Quitar nota
                    </button>
                </div>
            `;
        });

        html += `<br><button type="submit" style="padding: 10px; background-color: blue; color: white;">Guardar Calificaciones</button>`;
        html += `</form>`;

        res.send(html);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al leer el archivo XML.");
    }
});

//Recibir formulario y guardar en el xml
// Ruta: POST /alumnos/:matricula/calificaciones
router.post('/:matricula/calificaciones', async (req, res) => {
    try {
        const matricula = req.params.matricula;
        const body = req.body; 
        
        const datos = await xmlManager.obtenerDatos();
        const estudiante = datos.estudiantes.find(e => e.matricula === matricula);
        
        if (!estudiante) {
            return res.status(404).send("Estudiante no encontrado.");
        }
        //Ciclo por las materias e inyectar la calificación enviada en el body
        estudiante.materias.forEach(materia => {
            // El input es 'calificacion_1', 'calificacion_2', etc.
            const notaInput = body[`calificacion_${materia.id}`];
            
            if (notaInput !== undefined && notaInput !== '') {
                materia.calificacion = parseFloat(notaInput);
            }
        });

        // Sobrescribir el xml con los nuevos datos
        await xmlManager.guardarDatos(datos);

        res.send(`
            <h3>¡Calificaciones actualizadas con éxito!</h3>
            <a href="/alumnos/${matricula}/calificaciones">Volver al formulario</a>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al guardar en el XML: " + error.message);
    }
});

//Limpiar calificación de una materia
// Ruta: POST /alumnos/:matricula/materias/:idMateria/quitar-calificacion

router.post('/:matricula/materias/:idMateria/quitar-calificacion', async (req, res) => {
    try {
        const matricula = req.params.matricula;
        const idMateria = parseInt(req.params.idMateria, 10);

        const datos = await xmlManager.obtenerDatos();
        const estudiante = datos.estudiantes.find(e => e.matricula === matricula);

        if (!estudiante) {
            return res.status(404).send("Estudiante no encontrado.");
        }

        // Buscar la materia específica y quitar el nodo de calificación
        const materia = estudiante.materias.find(m => m.id === idMateria);
        if (materia) {
            materia.calificacion = null; 
        }

        // Actualizar el archivo xml con los cambios
        await xmlManager.guardarDatos(datos);

        res.send(`
            <h3>Calificación removida</h3>
            <p>La materia está pendiente de calificar.</p>
            <a href="/alumnos/${matricula}/calificaciones">Volver al formulario</a>
        `);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error al remover la nota: " + error.message);
    }
});

module.exports = router;