const express = require('express');
const db = require('../database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/panel
router.get('/', optionalAuth, (req, res) => {
  try {
    const { current } = req.query;
    let query = `SELECT pm.*, u.full_name, u.email, u.phone, u.avatar 
                 FROM panel_members pm LEFT JOIN users u ON pm.user_id = u.id WHERE 1=1`;
    const params = [];
    if (current !== 'false') { query += ' AND pm.is_current = 1'; }
    query += ' ORDER BY pm.sort_order ASC';
    const members = db.prepare(query).all(...params);
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch panel members.' });
  }
});

// POST /api/panel (admin only)
router.post('/', authenticate, authorize('admin'), upload.single('photo'), (req, res) => {
  try {
    const { user_id, position, description, tenure_start, tenure_end, sort_order } = req.body;
    if (!position) return res.status(400).json({ error: 'Position is required.' });

    const photo = req.file ? `/uploads/${req.file.filename}` : null;
    const stmt = db.prepare(
      'INSERT INTO panel_members (user_id, position, description, photo, tenure_start, tenure_end, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(user_id || null, position, description || null, photo, tenure_start || null, tenure_end || null, sort_order || 0);
    const member = db.prepare(
      `SELECT pm.*, u.full_name, u.email, u.phone FROM panel_members pm 
       LEFT JOIN users u ON pm.user_id = u.id WHERE pm.id = ?`
    ).get(result.lastInsertRowid);
    res.status(201).json(member);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create panel member.' });
  }
});

// PUT /api/panel/:id (admin only)
router.put('/:id', authenticate, authorize('admin'), upload.single('photo'), (req, res) => {
  try {
    const fields = req.body;
    const existing = db.prepare('SELECT * FROM panel_members WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Panel member not found.' });

    const photo = req.file ? `/uploads/${req.file.filename}` : existing.photo;
    db.prepare(
      'UPDATE panel_members SET user_id=?, position=?, description=?, photo=?, tenure_start=?, tenure_end=?, is_current=?, sort_order=? WHERE id=?'
    ).run(
      fields.user_id ?? existing.user_id, fields.position || existing.position,
      fields.description ?? existing.description, photo,
      fields.tenure_start ?? existing.tenure_start, fields.tenure_end ?? existing.tenure_end,
      fields.is_current !== undefined ? (fields.is_current ? 1 : 0) : existing.is_current,
      fields.sort_order ?? existing.sort_order, req.params.id
    );
    const member = db.prepare(
      `SELECT pm.*, u.full_name, u.email, u.phone FROM panel_members pm 
       LEFT JOIN users u ON pm.user_id = u.id WHERE pm.id = ?`
    ).get(req.params.id);
    res.json(member);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update panel member.' });
  }
});

// DELETE /api/panel/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const result = db.prepare('DELETE FROM panel_members WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Panel member not found.' });
    res.json({ message: 'Panel member removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete panel member.' });
  }
});

module.exports = router;
