const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Enlazar las rutas del módulo de alumnos
const rutasAlumnos = require('./routes/alumnos');
app.use('/alumnos', rutasAlumnos);

// Vista inicial con formulario para buscar matrícula
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
        <div class="generador">
          <label for="inputMatricula">Consultar o Iniciar con Matrícula:</label>
          <input type="text" id="inputMatricula" placeholder="Ej. S24013375" style="width: 200px;" />
          <button class="btn btn-generar" onclick="buscar()">Buscar Alumno</button>
        </div>
      </div>

      <script>
        function buscar() {
          const mat = document.getElementById('inputMatricula').value.trim();
          if (mat) {
            window.location.href = '/alumnos/' + encodeURIComponent(mat);
          } else {
            alert('Ingresa una matrícula');
          }
        }
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});