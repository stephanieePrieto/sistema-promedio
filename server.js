const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. Materias y Calificaciones PRIMERO para que no las atrape /:matricula
app.use('/alumnos', require('./routes/materias'));
app.use('/', require('./routes/calificaciones'));
app.use('/', require('./routes/reportes'));

// 2. Alumnos después
app.use('/alumnos', require('./routes/alumnos'));

// Procesar login
app.post('/login', (req, res) => {
  const { matricula } = req.body;
  if (!matricula) return res.redirect('/');
  res.redirect(`/alumnos/${encodeURIComponent(matricula.trim().toUpperCase())}/panel`);
});

// Vista principal
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