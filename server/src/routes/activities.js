const express = require('express');
const db = require('../database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/activities
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, limit = 30, offset = 0 } = req.query;
    let query = `SELECT a.*, u.full_name as author_name FROM activities a 
                 LEFT JOIN users u ON a.created_by = u.id WHERE a.is_published = 1`;
    const params = [];
    if (category) { query += ' AND a.category = ?'; params.push(category); }
    query += ' ORDER BY a.meeting_date DESC, a.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const activities = db.prepare(query).all(...params);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activities.' });
  }
});

// GET /api/activities/:id
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const activity = db.prepare(
      `SELECT a.*, u.full_name as author_name FROM activities a 
       LEFT JOIN users u ON a.created_by = u.id WHERE a.id = ?`
    ).get(req.params.id);
    if (!activity) return res.status(404).json({ error: 'Activity not found.' });
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch activity.' });
  }
});

// POST /api/activities (admin only)
router.post('/', authenticate, authorize('admin'), upload.single('attachment'), (req, res) => {
  try {
    const { title, description, content, category, meeting_date, is_published } = req.body;
    if (!title || !category) return res.status(400).json({ error: 'Title and category required.' });

    const attachment = req.file ? `/uploads/${req.file.filename}` : null;
    const stmt = db.prepare(
      'INSERT INTO activities (title, description, content, category, meeting_date, attachment, is_published, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(title, description || null, content || null, category, meeting_date || null, attachment, is_published !== undefined ? (is_published ? 1 : 0) : 1, req.user.id);
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create activity.' });
  }
});

// PUT /api/activities/:id (admin only)
router.put('/:id', authenticate, authorize('admin'), upload.single('attachment'), (req, res) => {
  try {
    const fields = req.body;
    const existing = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Activity not found.' });

    const attachment = req.file ? `/uploads/${req.file.filename}` : existing.attachment;
    db.prepare(
      'UPDATE activities SET title=?, description=?, content=?, category=?, meeting_date=?, attachment=?, is_published=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
    ).run(
      fields.title || existing.title, fields.description ?? existing.description,
      fields.content ?? existing.content, fields.category || existing.category,
      fields.meeting_date ?? existing.meeting_date, attachment,
      fields.is_published !== undefined ? (fields.is_published ? 1 : 0) : existing.is_published,
      req.params.id
    );
    const activity = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
    res.json(activity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update activity.' });
  }
});

// DELETE /api/activities/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const result = db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Activity not found.' });
    res.json({ message: 'Activity deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete activity.' });
  }
});

module.exports = router;
