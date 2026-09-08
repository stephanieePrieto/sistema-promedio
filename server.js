const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Servidor base funcionando correctamente');
});

app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});
// enlazar modulo de rutas int 5
const rutasMaterias = require('./routes/materias');
// activar rutas 
app.use('/alumnos', rutasMaterias);