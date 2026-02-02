const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authMiddleware);

// Obtener todos los jugadores
router.get('/', (req, res) => {
  const db = getDb();
  const { active, category } = req.query;

  let query = 'SELECT * FROM players WHERE 1=1';
  const params = [];

  if (active !== undefined) {
    query += ' AND active = ?';
    params.push(active === 'true' ? 1 : 0);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY last_name, name';

  const players = db.prepare(query).all(...params);
  res.json(players);
});

// Obtener un jugador por ID
router.get('/:id', (req, res) => {
  const db = getDb();
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);

  if (!player) {
    return res.status(404).json({ error: 'Jugador no encontrado' });
  }

  res.json(player);
});

// Crear jugador
router.post('/', [
  body('name').trim().notEmpty().withMessage('Nombre requerido'),
  body('last_name').trim().notEmpty().withMessage('Apellidos requeridos'),
  body('category').isIn(['cadete', 'juvenil', 'junior', 'senior']).withMessage('Categoría inválida'),
  body('phone').optional().trim(),
  body('position').optional().trim(),
  body('birth_date').optional().isISO8601().withMessage('Fecha de nacimiento inválida')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, last_name, phone, position, birth_date, category } = req.body;
  const db = getDb();

  try {
    const result = db.prepare(`
      INSERT INTO players (name, last_name, phone, position, birth_date, category)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, last_name, phone || null, position || null, birth_date || null, category);

    const player = db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(player);
  } catch (error) {
    console.error('Error al crear jugador:', error);
    res.status(500).json({ error: 'Error al crear el jugador' });
  }
});

// Actualizar jugador
router.put('/:id', [
  body('name').optional().trim().notEmpty().withMessage('Nombre no puede estar vacío'),
  body('last_name').optional().trim().notEmpty().withMessage('Apellidos no pueden estar vacíos'),
  body('category').optional().isIn(['cadete', 'juvenil', 'junior', 'senior']).withMessage('Categoría inválida'),
  body('birth_date').optional().isISO8601().withMessage('Fecha de nacimiento inválida')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const db = getDb();
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);

  if (!player) {
    return res.status(404).json({ error: 'Jugador no encontrado' });
  }

  const { name, last_name, phone, position, birth_date, category, active } = req.body;

  try {
    db.prepare(`
      UPDATE players SET
        name = COALESCE(?, name),
        last_name = COALESCE(?, last_name),
        phone = COALESCE(?, phone),
        position = COALESCE(?, position),
        birth_date = COALESCE(?, birth_date),
        category = COALESCE(?, category),
        active = COALESCE(?, active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(name, last_name, phone, position, birth_date, category, active, req.params.id);

    const updatedPlayer = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
    res.json(updatedPlayer);
  } catch (error) {
    console.error('Error al actualizar jugador:', error);
    res.status(500).json({ error: 'Error al actualizar el jugador' });
  }
});

// Dar de baja/alta a un jugador
router.patch('/:id/toggle-active', (req, res) => {
  const db = getDb();
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);

  if (!player) {
    return res.status(404).json({ error: 'Jugador no encontrado' });
  }

  const newStatus = player.active ? 0 : 1;
  db.prepare('UPDATE players SET active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run(newStatus, req.params.id);

  const updatedPlayer = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
  res.json(updatedPlayer);
});

// Eliminar jugador (borrado permanente)
router.delete('/:id', (req, res) => {
  const db = getDb();
  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);

  if (!player) {
    return res.status(404).json({ error: 'Jugador no encontrado' });
  }

  try {
    // Eliminar asistencias relacionadas
    db.prepare('DELETE FROM attendance WHERE player_id = ?').run(req.params.id);
    // Eliminar jugador
    db.prepare('DELETE FROM players WHERE id = ?').run(req.params.id);
    res.json({ message: 'Jugador eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar jugador:', error);
    res.status(500).json({ error: 'Error al eliminar el jugador' });
  }
});

module.exports = router;
