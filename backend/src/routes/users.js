const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { getDb } = require('../config/database');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Obtener todos los usuarios (solo admin)
router.get('/', adminMiddleware, (req, res) => {
  const db = getDb();
  const users = db.prepare('SELECT id, email, name, role, active, created_at FROM users ORDER BY name').all();
  res.json(users);
});

// Crear usuario (solo admin)
router.post('/', adminMiddleware, [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('name').trim().notEmpty().withMessage('Nombre requerido'),
  body('role').isIn(['admin', 'user']).withMessage('Rol inválido')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, name, role } = req.body;
  const db = getDb();

  try {
    // Verificar si el email ya existe
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = db.prepare(`
      INSERT INTO users (email, password, name, role)
      VALUES (?, ?, ?, ?)
    `).run(email, hashedPassword, name, role);

    const user = db.prepare('SELECT id, email, name, role, active, created_at FROM users WHERE id = ?')
      .get(result.lastInsertRowid);

    res.status(201).json(user);
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
});

// Actualizar usuario (solo admin)
router.put('/:id', adminMiddleware, [
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('name').optional().trim().notEmpty().withMessage('Nombre no puede estar vacío'),
  body('role').optional().isIn(['admin', 'user']).withMessage('Rol inválido')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  const { email, password, name, role, active } = req.body;

  try {
    let hashedPassword = null;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    db.prepare(`
      UPDATE users SET
        email = COALESCE(?, email),
        password = COALESCE(?, password),
        name = COALESCE(?, name),
        role = COALESCE(?, role),
        active = COALESCE(?, active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(email, hashedPassword, name, role, active, req.params.id);

    const updatedUser = db.prepare('SELECT id, email, name, role, active, created_at FROM users WHERE id = ?')
      .get(req.params.id);

    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
});

// Eliminar usuario (solo admin)
router.delete('/:id', adminMiddleware, (req, res) => {
  const db = getDb();

  // No permitir eliminar el propio usuario
  if (parseInt(req.params.id) === req.user.id) {
    return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);

  if (!user) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
});

module.exports = router;
