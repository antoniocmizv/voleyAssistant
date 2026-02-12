const express = require('express');
const { getDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

// Estadísticas generales para el dashboard
router.get('/dashboard', (req, res) => {
  const db = getDb();
  const userId = req.user.id;

  try {
    // 1. Total jugadores activos
    const totalPlayers = db.prepare('SELECT COUNT(*) as count FROM players WHERE user_id = ? AND active = 1').get(userId).count;

    // 2. Asistencia promedio de los últimos 30 días
    const avgAttendance = db.prepare(`
      SELECT AVG(attended_count.present / CAST(attended_count.total AS FLOAT)) * 100 as avg
      FROM (
        SELECT 
          ts.id,
          (SELECT COUNT(*) FROM attendance a WHERE a.session_id = ts.id AND a.attended = 1) as present,
          (SELECT COUNT(*) FROM attendance a WHERE a.session_id = ts.id) as total
        FROM training_sessions ts
        WHERE ts.user_id = ? AND ts.date >= date('now', '-30 days')
      ) as attended_count
      WHERE attended_count.total > 0
    `).get(userId).avg || 0;

    // 3. Próximos entrenamientos (pendientes de hoy o mañana)
    const upcomingTrainings = db.prepare(`
      SELECT t.*, 
        (SELECT COUNT(*) FROM players p WHERE p.category = 'senior' AND p.user_id = t.user_id) as senior_count
      FROM trainings t
      WHERE t.user_id = ? AND t.active = 1
    `).all(userId);

    // 4. Asistencia por categoría (últimos 3 meses)
    const trends = db.prepare(`
      SELECT 
        p.category,
        date(ts.date, 'start of month') as month,
        AVG(CASE WHEN a.attended = 1 THEN 1 ELSE 0 END) * 100 as rate
      FROM attendance a
      JOIN players p ON a.player_id = p.id
      JOIN training_sessions ts ON a.session_id = ts.id
      WHERE ts.user_id = ? AND ts.date >= date('now', '-90 days')
      GROUP BY p.category, month
      ORDER BY month ASC
    `).all(userId);



    res.json({
      totalPlayers,
      avgAttendance: parseFloat(avgAttendance.toFixed(1)),
      trends,
      upcomingTrainings
    });
  } catch (error) {
    console.error('Error al obtener analíticas:', error);
    res.status(500).json({ error: 'Error al obtener las analíticas' });
  }
});

module.exports = router;
