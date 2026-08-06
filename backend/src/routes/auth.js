const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['customer', 'owner', 'delivery_partner']).default('customer')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const validated = registerSchema.parse(req.body);

    const checkUser = await db.query('SELECT id FROM users WHERE email = $1', [validated.email.toLowerCase()]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(validated.password, saltRounds);

    const result = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [validated.name, validated.email.toLowerCase(), passwordHash, validated.role]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id, id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'orderpilot_secret_jwt_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account registered successfully',
      token,
      user: {
        userId: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const validated = loginSchema.parse(req.body);

    const result = await db.query('SELECT * FROM users WHERE email = $1', [validated.email.toLowerCase()]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(validated.password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'orderpilot_secret_jwt_key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        userId: user.id,
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    next(error);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const userId = req.user.userId || req.user.id;
    const result = await db.query(
      'SELECT id as "userId", id, name, email, role, created_at as "createdAt" FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/partners - List active delivery partners
router.get('/partners', authenticate, async (req, res, next) => {
  try {
    const result = await db.query(
      "SELECT id as \"userId\", id, name, email, role, created_at as \"createdAt\" FROM users WHERE role = 'delivery_partner' ORDER BY name ASC"
    );
    res.json({ partners: result.rows });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
