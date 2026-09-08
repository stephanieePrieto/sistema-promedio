'use strict';

/**
 * @fileoverview Servidor principal Express para el sistema de control escolar y gestión académica.
 * Orquesta middlewares, hojas de estilo estáticas y rutas modulares de cada integrante.
 * @module server
 */

const express = require('express');
const path = require('path');
const app = express();

/**
 * Puerto de escucha de la aplicación web.
 * @constant {number}
 */
const PORT = 3000;

// Middlewares para procesar formularios URL-encoded, cargas JSON y servir el archivo style.css
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Enrutadores modulares ordenados para evitar colisiones en rutas paramétricas
app.use('/alumnos', require('./routes/materias'));
app.use('/', require('./routes/calificaciones'));
app.use('/', require('./routes/reportes'));
app.use('/alumnos', require('./routes/alumnos'));

/**
 * Procesa la matrícula ingresada en el inicio y redirige al panel interactivo del estudiante.
 * @name POST/login
 * @function
 * @param {express.Request} req - Petición con cuerpo { matricula: string }.
 * @param {express.Response} res - Redirección a /alumnos/:matricula/panel.
 */
app.post('/login', (req, res) => {
  const { matricula } = req.body;
  if (!matricula) return res.redirect('/');
  res.redirect(`/alumnos/${encodeURIComponent(matricula.trim().toUpperCase())}/panel`);
});

/**
 * Sirve la pantalla de inicio principal para consulta por matrícula o navegación al catálogo.
 * @name GET/
 * @function
 * @param {express.Request} req - Petición HTTP del navegador.
 * @param {express.Response} res - Documento HTML con diseño basado en style.css.
 */
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Portal de Control Escolar</title>
      <link rel="stylesheet" href="/style.css">
    </head>
    <body>
      <div class="card">
        <h1>Sistema de Gestión Académica</h1>
        <form action="/login" method="POST" class="generador">
          <label for="inputMatricula">Iniciar Sesión con Matrícula:</label>
          <input type="text" id="inputMatricula" name="matricula" placeholder="Ej. S24013375" style="width: 220px;" required />
          <button type="submit" class="btn btn-generar">Ingresar</button>
          <a href="/alumnos" class="btn" style="text-decoration:none;">Ver Catálogo</a>
        </form>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});