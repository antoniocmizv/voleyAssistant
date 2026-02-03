const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Obtener todos los entrenamientos configurados (filtrados por usuario)
router.get('/', (req, res) => {
  const db = getDb();
  const { active } = req.query;
  const userId = req.user.id;

  let query = 'SELECT * FROM trainings WHERE user_id = ?';
  const params = [userId];

  if (active !== undefined) {
    query += ' AND active = ?';
    params.push(active === 'true' ? 1 : 0);
  }

  query += ' ORDER BY day_of_week, start_time';

  const trainings = db.prepare(query).all(...params);
  
  // Añadir nombre del día
  const result = trainings.map(t => ({
    ...t,
    day_name: DAYS_OF_WEEK[t.day_of_week]
  }));

  res.json(result);
});

// Obtener un entrenamiento por ID (verificar pertenencia al usuario)
router.get('/:id', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const training = db.prepare('SELECT * FROM trainings WHERE id = ? AND user_id = ?').get(req.params.id, userId);

  if (!training) {
    return res.status(404).json({ error: 'Entrenamiento no encontrado' });
  }

  res.json({
    ...training,
    day_name: DAYS_OF_WEEK[training.day_of_week]
  });
});

// Crear entrenamiento (asignar al usuario actual)
router.post('/', [
  body('day_of_week').isInt({ min: 0, max: 6 }).withMessage('Día de la semana inválido (0-6)'),
  body('start_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora de inicio inválida'),
  body('end_time').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora de fin inválida'),
  body('name').optional().trim()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { day_of_week, start_time, end_time, name } = req.body;
  const userId = req.user.id;
  const db = getDb();

  try {
    const trainingName = name || DAYS_OF_WEEK[day_of_week];
    const result = db.prepare(`
      INSERT INTO trainings (day_of_week, start_time, end_time, name, user_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(day_of_week, start_time, end_time, trainingName, userId);

    const training = db.prepare('SELECT * FROM trainings WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({
      ...training,
      day_name: DAYS_OF_WEEK[training.day_of_week]
    });
  } catch (error) {
    console.error('Error al crear entrenamiento:', error);
    res.status(500).json({ error: 'Error al crear el entrenamiento' });
  }
});

// Actualizar entrenamiento (verificar pertenencia al usuario)
router.put('/:id', [
  body('day_of_week').optional().isInt({ min: 0, max: 6 }).withMessage('Día de la semana inválido'),
  body('start_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora de inicio inválida'),
  body('end_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Hora de fin inválida')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const db = getDb();
  const userId = req.user.id;
  const training = db.prepare('SELECT * FROM trainings WHERE id = ? AND user_id = ?').get(req.params.id, userId);

  if (!training) {
    return res.status(404).json({ error: 'Entrenamiento no encontrado' });
  }

  const { day_of_week, start_time, end_time, name, active } = req.body;

  try {
    db.prepare(`
      UPDATE trainings SET
        day_of_week = COALESCE(?, day_of_week),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        name = COALESCE(?, name),
        active = COALESCE(?, active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(day_of_week, start_time, end_time, name, active, req.params.id);

    const updatedTraining = db.prepare('SELECT * FROM trainings WHERE id = ?').get(req.params.id);
    res.json({
      ...updatedTraining,
      day_name: DAYS_OF_WEEK[updatedTraining.day_of_week]
    });
  } catch (error) {
    console.error('Error al actualizar entrenamiento:', error);
    res.status(500).json({ error: 'Error al actualizar el entrenamiento' });
  }
});

// Eliminar entrenamiento (verificar pertenencia al usuario)
router.delete('/:id', (req, res) => {
  const db = getDb();
  const userId = req.user.id;
  const training = db.prepare('SELECT * FROM trainings WHERE id = ? AND user_id = ?').get(req.params.id, userId);

  if (!training) {
    return res.status(404).json({ error: 'Entrenamiento no encontrado' });
  }

  try {
    db.prepare('DELETE FROM trainings WHERE id = ?').run(req.params.id);
    res.json({ message: 'Entrenamiento eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar entrenamiento:', error);
    res.status(500).json({ error: 'Error al eliminar el entrenamiento' });
  }
});

module.exports = router;
