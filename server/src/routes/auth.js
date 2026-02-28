const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'ssfowa_default_secret';

// POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { email, password, full_name, phone, flat_number, block, role } = req.body;
    if (!email || !password || !full_name) {
      return res.status(400).json({ error: 'Email, password, and full name are required.' });
    }

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const userRole = ['member', 'tenant', 'vendor'].includes(role) ? role : 'member';

    const stmt = db.prepare(
      'INSERT INTO users (email, password, full_name, phone, flat_number, block, role) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(email, hashedPassword, full_name, phone || null, flat_number || null, block || null, userRole);

    const user = db.prepare('SELECT id, email, full_name, phone, flat_number, block, role FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated. Contact admin.' });
    }

    const validPassword = bcrypt.compareSync(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  try {
    const user = db.prepare('SELECT id, email, full_name, phone, flat_number, block, role, avatar, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user.' });
  }
});

// PUT /api/auth/profile
router.put('/profile', authenticate, (req, res) => {
  try {
    const { full_name, phone, flat_number, block } = req.body;
    db.prepare('UPDATE users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone), flat_number = COALESCE(?, flat_number), block = COALESCE(?, block), updated_at = CURRENT_TIMESTAMP WHERE id = ?')
      .run(full_name, phone, flat_number, block, req.user.id);
    const user = db.prepare('SELECT id, email, full_name, phone, flat_number, block, role, avatar FROM users WHERE id = ?').get(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Profile update failed.' });
  }
});

// PUT /api/auth/change-password
router.put('/change-password', authenticate, (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = db.prepare('SELECT password FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(current_password, user.password)) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }
    const salt = bcrypt.genSaltSync(10);
    const hashed = bcrypt.hashSync(new_password, salt);
    db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(hashed, req.user.id);
    res.json({ message: 'Password changed successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Password change failed.' });
  }
});

// GET /api/auth/users (admin only)
router.get('/users', authenticate, authorize('admin'), (req, res) => {
  try {
    const { role, search } = req.query;
    let query = 'SELECT id, email, full_name, phone, flat_number, block, role, is_active, created_at FROM users WHERE 1=1';
    const params = [];
    if (role) { query += ' AND role = ?'; params.push(role); }
    if (search) { query += ' AND (full_name LIKE ? OR email LIKE ? OR flat_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    query += ' ORDER BY created_at DESC';
    const users = db.prepare(query).all(...params);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// PUT /api/auth/users/:id/role (admin only)
router.put('/users/:id/role', authenticate, authorize('admin'), (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'member', 'tenant', 'vendor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role.' });
    }
    db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(role, req.params.id);
    res.json({ message: 'Role updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Role update failed.' });
  }
});

// PUT /api/auth/users/:id/status (admin only)
router.put('/users/:id/status', authenticate, authorize('admin'), (req, res) => {
  try {
    const { is_active } = req.body;
    db.prepare('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(is_active ? 1 : 0, req.params.id);
    res.json({ message: 'User status updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Status update failed.' });
  }
});

module.exports = router;
