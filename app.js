cat << 'EOF' > app.js
const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Conexión / Creación de la base de datos
const db = new Database('./students.sqlite');
console.log('Base de datos SQLite conectada con éxito.');

// Inicialización de la tabla
db.prepare(`CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  gender TEXT,
  age INTEGER
)`).run();

// 1. GET /students
app.get('/students', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM students').all();
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. GET /student/:id
app.get('/student/:id', (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM students WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Estudiante no encontrado' });
    res.status(200).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. POST /students
app.post('/students', (req, res) => {
  const { firstname, lastname, gender, age } = req.body;
  if (!firstname || !lastname) {
    return res.status(400).json({ error: 'Nombre y apellido son requeridos' });
  }
  try {
    const stmt = db.prepare('INSERT INTO students (firstname, lastname, gender, age) VALUES (?, ?, ?, ?)');
    const info = stmt.run(firstname, lastname, gender, age);
    res.status(200).send(`Student with id: ${info.lastInsertRowid} created successfully`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. PUT /student/:id
app.put('/student/:id', (req, res) => {
  const { firstname, lastname, gender, age } = req.body;
  const { id } = req.params;
  try {
    const current = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ error: 'Estudiante no encontrado' });

    db.prepare(`UPDATE students SET 
      firstname = ?, lastname = ?, gender = ?, age = ? 
      WHERE id = ?`).run(
        firstname || current.firstname,
        lastname || current.lastname,
        gender || current.gender,
        age || current.age,
        id
    );
    const updated = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. DELETE /student/:id
app.delete('/student/:id', (req, res) => {
  const { id } = req.params;
  try {
    const info = db.prepare('DELETE FROM students WHERE id = ?').run(id);
    if (info.changes === 0) return res.status(404).json({ error: 'Estudiante no encontrado' });
    res.status(200).send(`The Student with id: ${id} has been deleted.`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor API REST Node.js corriendo en el puerto ${PORT}`);
});
EOF
