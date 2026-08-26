const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middlewares para procesar JSON, form-data y habilitar CORS
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión / Creación de la base de datos SQLite
const db = new sqlite3.Database('./students.sqlite', (err) => {
  if (err) {
    console.error('Error al conectar con SQLite:', err.message);
  } else {
    console.log('Base de datos SQLite (students.sqlite) conectada con éxito.');
  }
});

// Inicialización de la tabla students
db.run(`CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  gender TEXT,
  age INTEGER
)`);

// 1. GET /students - Obtener todos los estudiantes
app.get('/students', (req, res) => {
  const sql = 'SELECT * FROM students';
  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).json(rows);
  });
});

// 2. GET /student/:id - Obtener un estudiante por ID
app.get('/student/:id', (req, res) => {
  const sql = 'SELECT * FROM students WHERE id = ?';
  db.get(sql, [req.params.id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    res.status(200).json(row);
  });
});

// 3. POST /students - Crear un nuevo estudiante
app.post('/students', (req, res) => {
  const { firstname, lastname, gender, age } = req.body;

  if (!firstname || !lastname) {
    return res.status(400).json({ error: 'Nombre y apellido son requeridos' });
  }

  const sql = 'INSERT INTO students (firstname, lastname, gender, age) VALUES (?, ?, ?, ?)';
  const params = [firstname, lastname, gender, age];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(200).send(`Student with id: ${this.lastID} created successfully`);
  });
});

// 4. PUT /student/:id - Modificar un estudiante existente
app.put('/student/:id', (req, res) => {
  const { firstname, lastname, gender, age } = req.body;
  const { id } = req.params;

  const sql = `UPDATE students SET 
                firstname = COALESCE(?, firstname), 
                lastname = COALESCE(?, lastname), 
                gender = COALESCE(?, gender), 
                age = COALESCE(?, age) 
              WHERE id = ?`;
  const params = [firstname, lastname, gender, age, id];

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado para actualizar' });
    }

    // Retorna el objeto actualizado
    db.get('SELECT * FROM students WHERE id = ?', [id], (err, row) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(row);
    });
  });
});

// 5. DELETE /student/:id - Eliminar un estudiante
app.delete('/student/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM students WHERE id = ?';

  db.run(sql, [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Estudiante no encontrado' });
    }
    res.status(200).send(`The Student with id: ${id} has been deleted.`);
  });
});

// Escuchar en 0.0.0.0 para aceptar conexiones externas a la Máquina Virtual
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor API REST Node.js corriendo en el puerto ${PORT}`);
});