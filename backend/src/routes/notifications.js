const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications
router.get('/', authenticate, async (req, res, next) => {
  try {
    const email = req.user.email;
    const role = req.user.role;

    const result = await db.query(`
      SELECT id, receiver, message, type, read, created_at as "createdAt"
      FROM notifications
      WHERE receiver = $1 OR receiver = $2
      ORDER BY created_at DESC
      LIMIT 20
    `, [email, role]);

    res.json({ notifications: result.rows });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    await db.query('UPDATE notifications SET read = true WHERE id = $1', [id]);
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
