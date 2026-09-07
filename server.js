const express = require('express');
const app = express();
const PORT = 3000;

const rutasAlumnos = require('./routes/alumnos');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use('/alumnos', rutasAlumnos);

app.get('/', (req, res) => {
  res.send('Servidor base funcionando correctamente');
});

app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});