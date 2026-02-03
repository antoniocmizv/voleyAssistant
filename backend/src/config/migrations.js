/**
 * Sistema de migraciones para la base de datos
 * Permite actualizar el esquema sin perder datos existentes
 */

const runMigrations = (db) => {
  // Crear tabla de control de migraciones si no existe
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const migrations = [
    {
      name: '001_add_user_id_to_players',
      up: (db) => {
        // Verificar si la columna ya existe
        const columns = db.prepare("PRAGMA table_info(players)").all();
        const hasUserId = columns.some(col => col.name === 'user_id');
        
        if (!hasUserId) {
          // Añadir columna user_id a players
          db.exec('ALTER TABLE players ADD COLUMN user_id INTEGER REFERENCES users(id)');
          
          // Obtener el ID del primer admin para asignar los datos existentes
          const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1").get();
          if (admin) {
            db.prepare('UPDATE players SET user_id = ? WHERE user_id IS NULL').run(admin.id);
          }
          
          console.log('✅ Migración 001: user_id añadido a players');
        }
      }
    },
    {
      name: '002_add_user_id_to_trainings',
      up: (db) => {
        const columns = db.prepare("PRAGMA table_info(trainings)").all();
        const hasUserId = columns.some(col => col.name === 'user_id');
        
        if (!hasUserId) {
          db.exec('ALTER TABLE trainings ADD COLUMN user_id INTEGER REFERENCES users(id)');
          
          const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1").get();
          if (admin) {
            db.prepare('UPDATE trainings SET user_id = ? WHERE user_id IS NULL').run(admin.id);
          }
          
          console.log('✅ Migración 002: user_id añadido a trainings');
        }
      }
    },
    {
      name: '003_add_user_id_to_training_sessions',
      up: (db) => {
        const columns = db.prepare("PRAGMA table_info(training_sessions)").all();
        const hasUserId = columns.some(col => col.name === 'user_id');
        
        if (!hasUserId) {
          db.exec('ALTER TABLE training_sessions ADD COLUMN user_id INTEGER REFERENCES users(id)');
          
          const admin = db.prepare("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1").get();
          if (admin) {
            db.prepare('UPDATE training_sessions SET user_id = ? WHERE user_id IS NULL').run(admin.id);
          }
          
          console.log('✅ Migración 003: user_id añadido a training_sessions');
        }
      }
    },
    {
      name: '004_create_user_id_indexes',
      up: (db) => {
        try {
          db.exec(`
            CREATE INDEX IF NOT EXISTS idx_players_user ON players(user_id);
            CREATE INDEX IF NOT EXISTS idx_trainings_user ON trainings(user_id);
            CREATE INDEX IF NOT EXISTS idx_sessions_user ON training_sessions(user_id);
          `);
          console.log('✅ Migración 004: índices de user_id creados');
        } catch (error) {
          // Los índices ya pueden existir
          console.log('⚠️ Migración 004: índices ya existentes');
        }
      }
    }
  ];

  // Ejecutar migraciones pendientes
  const executedMigrations = db.prepare('SELECT name FROM migrations').all().map(m => m.name);
  
  for (const migration of migrations) {
    if (!executedMigrations.includes(migration.name)) {
      try {
        migration.up(db);
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(migration.name);
        console.log(`📦 Migración ejecutada: ${migration.name}`);
      } catch (error) {
        console.error(`❌ Error en migración ${migration.name}:`, error.message);
      }
    }
  }
};

module.exports = { runMigrations };
