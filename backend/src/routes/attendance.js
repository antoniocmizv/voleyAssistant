const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Obtener sesiones de entrenamiento (con filtros opcionales)
router.get('/sessions', (req, res) => {
  const db = getDb();
  const { from, to, training_id } = req.query;

  let query = `
    SELECT ts.*, t.day_of_week, t.start_time, t.end_time, t.name as training_name
    FROM training_sessions ts
    LEFT JOIN trainings t ON ts.training_id = t.id
    WHERE 1=1
  `;
  const params = [];

  if (from) {
    query += ' AND ts.date >= ?';
    params.push(from);
  }

  if (to) {
    query += ' AND ts.date <= ?';
    params.push(to);
  }

  if (training_id) {
    query += ' AND ts.training_id = ?';
    params.push(training_id);
  }

  query += ' ORDER BY ts.date DESC';

  const sessions = db.prepare(query).all(...params);
  res.json(sessions);
});

// Obtener o crear sesión para una fecha específica
router.post('/sessions', [
  body('date').isISO8601().withMessage('Fecha inválida'),
  body('training_id').optional().isInt().withMessage('ID de entrenamiento inválido')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { date, training_id, notes } = req.body;
  const db = getDb();

  try {
    // Verificar si ya existe una sesión para esa fecha
    let session = db.prepare(`
      SELECT * FROM training_sessions 
      WHERE date = ? ${training_id ? 'AND training_id = ?' : ''}
    `).get(training_id ? [date, training_id] : [date]);

    if (!session) {
      // Crear nueva sesión
      const result = db.prepare(`
        INSERT INTO training_sessions (date, training_id, notes)
        VALUES (?, ?, ?)
      `).run(date, training_id || null, notes || null);

      session = db.prepare('SELECT * FROM training_sessions WHERE id = ?').get(result.lastInsertRowid);
    }

    res.json(session);
  } catch (error) {
    console.error('Error al crear sesión:', error);
    res.status(500).json({ error: 'Error al crear la sesión' });
  }
});

// Obtener asistencia de una sesión
router.get('/sessions/:sessionId', (req, res) => {
  const db = getDb();
  const { sessionId } = req.params;

  const session = db.prepare(`
    SELECT ts.*, t.name as training_name, t.start_time, t.end_time
    FROM training_sessions ts
    LEFT JOIN trainings t ON ts.training_id = t.id
    WHERE ts.id = ?
  `).get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Sesión no encontrada' });
  }

  // Obtener asistencia con datos de jugadores
  const attendance = db.prepare(`
    SELECT 
      a.*,
      p.name, p.last_name, p.category, p.position
    FROM attendance a
    JOIN players p ON a.player_id = p.id
    WHERE a.session_id = ?
    ORDER BY p.last_name, p.name
  `).all(sessionId);

  // Obtener jugadores activos sin registro de asistencia para esta sesión
  const playersWithoutAttendance = db.prepare(`
    SELECT p.*
    FROM players p
    WHERE p.active = 1
    AND p.id NOT IN (SELECT player_id FROM attendance WHERE session_id = ?)
    ORDER BY p.last_name, p.name
  `).all(sessionId);

  res.json({
    session,
    attendance,
    pendingPlayers: playersWithoutAttendance
  });
});

// Registrar asistencia individual
router.post('/', [
  body('session_id').isInt().withMessage('ID de sesión requerido'),
  body('player_id').isInt().withMessage('ID de jugador requerido'),
  body('attended').isBoolean().withMessage('Estado de asistencia requerido'),
  body('absence_reason').optional().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { session_id, player_id, attended, absence_reason } = req.body;
  const db = getDb();

  try {
    // Upsert: insertar o actualizar
    db.prepare(`
      INSERT INTO attendance (session_id, player_id, attended, absence_reason)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(session_id, player_id) DO UPDATE SET
        attended = excluded.attended,
        absence_reason = excluded.absence_reason,
        updated_at = CURRENT_TIMESTAMP
    `).run(session_id, player_id, attended ? 1 : 0, attended ? null : absence_reason);

    const record = db.prepare(`
      SELECT a.*, p.name, p.last_name
      FROM attendance a
      JOIN players p ON a.player_id = p.id
      WHERE a.session_id = ? AND a.player_id = ?
    `).get(session_id, player_id);

    res.json(record);
  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    res.status(500).json({ error: 'Error al registrar la asistencia' });
  }
});

// Registrar asistencia masiva
router.post('/bulk', [
  body('session_id').isInt().withMessage('ID de sesión requerido'),
  body('attendance').isArray().withMessage('Lista de asistencia requerida')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { session_id, attendance } = req.body;
  const db = getDb();

  try {
    const insertStmt = db.prepare(`
      INSERT INTO attendance (session_id, player_id, attended, absence_reason)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(session_id, player_id) DO UPDATE SET
        attended = excluded.attended,
        absence_reason = excluded.absence_reason,
        updated_at = CURRENT_TIMESTAMP
    `);

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insertStmt.run(
          session_id,
          item.player_id,
          item.attended ? 1 : 0,
          item.attended ? null : (item.absence_reason || null)
        );
      }
    });

    insertMany(attendance);

    res.json({ message: 'Asistencia registrada correctamente', count: attendance.length });
  } catch (error) {
    console.error('Error al registrar asistencia masiva:', error);
    res.status(500).json({ error: 'Error al registrar la asistencia' });
  }
});

// Actualizar registro de asistencia
router.put('/:id', [
  body('attended').optional().isBoolean(),
  body('absence_reason').optional().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const db = getDb();
  const { attended, absence_reason } = req.body;

  try {
    db.prepare(`
      UPDATE attendance SET
        attended = COALESCE(?, attended),
        absence_reason = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(attended !== undefined ? (attended ? 1 : 0) : null, absence_reason, req.params.id);

    const record = db.prepare(`
      SELECT a.*, p.name, p.last_name
      FROM attendance a
      JOIN players p ON a.player_id = p.id
      WHERE a.id = ?
    `).get(req.params.id);

    res.json(record);
  } catch (error) {
    console.error('Error al actualizar asistencia:', error);
    res.status(500).json({ error: 'Error al actualizar la asistencia' });
  }
});

// Eliminar registro de asistencia
router.delete('/:id', (req, res) => {
  const db = getDb();

  try {
    db.prepare('DELETE FROM attendance WHERE id = ?').run(req.params.id);
    res.json({ message: 'Registro eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar asistencia:', error);
    res.status(500).json({ error: 'Error al eliminar el registro' });
  }
});

// Estadísticas de asistencia por jugador
router.get('/stats/player/:playerId', (req, res) => {
  const db = getDb();
  const { playerId } = req.params;
  const { from, to } = req.query;

  let dateFilter = '';
  const params = [playerId];

  if (from && to) {
    dateFilter = 'AND ts.date BETWEEN ? AND ?';
    params.push(from, to);
  }

  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_sessions,
      SUM(CASE WHEN a.attended = 1 THEN 1 ELSE 0 END) as attended,
      SUM(CASE WHEN a.attended = 0 THEN 1 ELSE 0 END) as missed
    FROM attendance a
    JOIN training_sessions ts ON a.session_id = ts.id
    WHERE a.player_id = ? ${dateFilter}
  `).get(...params);

  const absences = db.prepare(`
    SELECT ts.date, a.absence_reason
    FROM attendance a
    JOIN training_sessions ts ON a.session_id = ts.id
    WHERE a.player_id = ? AND a.attended = 0 ${dateFilter}
    ORDER BY ts.date DESC
  `).all(...params);

  res.json({
    ...stats,
    attendance_rate: stats.total_sessions > 0 
      ? ((stats.attended / stats.total_sessions) * 100).toFixed(1) 
      : 0,
    absences
  });
});

module.exports = router;
