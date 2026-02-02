const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = process.env.DATABASE_URL?.replace('file:', '') || 
  path.join(__dirname, '../../data/voleyassistant.db');

let db;

const getDb = () => {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
};

const initDatabase = async () => {
  const database = getDb();

  // Crear tabla de usuarios
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crear tabla de jugadores
  database.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      position TEXT,
      birth_date DATE,
      category TEXT NOT NULL CHECK(category IN ('cadete', 'juvenil', 'junior', 'senior')),
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crear tabla de entrenamientos
  database.exec(`
    CREATE TABLE IF NOT EXISTS trainings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week INTEGER NOT NULL CHECK(day_of_week BETWEEN 0 AND 6),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      name TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Crear tabla de sesiones de entrenamiento (instancias específicas)
  database.exec(`
    CREATE TABLE IF NOT EXISTS training_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      training_id INTEGER,
      date DATE NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (training_id) REFERENCES trainings(id)
    )
  `);

  // Crear tabla de asistencia
  database.exec(`
    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      player_id INTEGER NOT NULL,
      attended INTEGER DEFAULT 0,
      absence_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (session_id) REFERENCES training_sessions(id),
      FOREIGN KEY (player_id) REFERENCES players(id),
      UNIQUE(session_id, player_id)
    )
  `);

  // Crear índices
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_player ON attendance(player_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_date ON training_sessions(date);
    CREATE INDEX IF NOT EXISTS idx_players_category ON players(category);
  `);

  // Crear usuario admin por defecto si no existe
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@voleyassistant.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  const existingAdmin = database.prepare('SELECT id FROM users WHERE email = ?').get(adminEmail);
  
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    database.prepare(`
      INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)
    `).run(adminEmail, hashedPassword, 'Administrador', 'admin');
    console.log('👤 Usuario admin creado:', adminEmail);
  }

  // Crear entrenamientos por defecto si no existen
  const existingTrainings = database.prepare('SELECT COUNT(*) as count FROM trainings').get();
  
  if (existingTrainings.count === 0) {
    const defaultTrainings = [
      { day: 1, start: '19:00', end: '21:00', name: 'Lunes' },      // Lunes
      { day: 3, start: '21:00', end: '23:00', name: 'Miércoles' },  // Miércoles
      { day: 4, start: '20:00', end: '22:00', name: 'Jueves' },     // Jueves
      { day: 5, start: '20:30', end: '22:00', name: 'Viernes' }     // Viernes
    ];

    const insertTraining = database.prepare(`
      INSERT INTO trainings (day_of_week, start_time, end_time, name) VALUES (?, ?, ?, ?)
    `);

    for (const t of defaultTrainings) {
      insertTraining.run(t.day, t.start, t.end, t.name);
    }
    console.log('📅 Entrenamientos por defecto creados');
  }

  return database;
};

module.exports = { getDb, initDatabase };
