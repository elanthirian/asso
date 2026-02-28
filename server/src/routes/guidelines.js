const express = require('express');
const db = require('../database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/guidelines
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT g.*, u.full_name as author_name FROM guidelines g LEFT JOIN users u ON g.created_by = u.id WHERE g.is_published = 1';
    const params = [];
    if (category) { query += ' AND g.category = ?'; params.push(category); }
    if (search) { query += ' AND (g.title LIKE ? OR g.content LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY g.sort_order ASC, g.title ASC';
    const guidelines = db.prepare(query).all(...params);
    res.json(guidelines);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch guidelines.' });
  }
});

// GET /api/guidelines/:id
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const guideline = db.prepare(
      'SELECT g.*, u.full_name as author_name FROM guidelines g LEFT JOIN users u ON g.created_by = u.id WHERE g.id = ?'
    ).get(req.params.id);
    if (!guideline) return res.status(404).json({ error: 'Guideline not found.' });
    res.json(guideline);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch guideline.' });
  }
});

// POST /api/guidelines (admin only)
router.post('/', authenticate, authorize('admin'), upload.single('attachment'), (req, res) => {
  try {
    const { title, content, category, sort_order, is_published } = req.body;
    if (!title || !content || !category) return res.status(400).json({ error: 'Title, content, and category required.' });

    const attachment = req.file ? `/uploads/${req.file.filename}` : null;
    const stmt = db.prepare(
      'INSERT INTO guidelines (title, content, category, attachment, is_published, sort_order, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(title, content, category, attachment, is_published !== undefined ? (is_published ? 1 : 0) : 1, sort_order || 0, req.user.id);
    const guideline = db.prepare('SELECT * FROM guidelines WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(guideline);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create guideline.' });
  }
});

// PUT /api/guidelines/:id (admin only)
router.put('/:id', authenticate, authorize('admin'), upload.single('attachment'), (req, res) => {
  try {
    const fields = req.body;
    const existing = db.prepare('SELECT * FROM guidelines WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Guideline not found.' });

    const attachment = req.file ? `/uploads/${req.file.filename}` : existing.attachment;
    db.prepare(
      'UPDATE guidelines SET title=?, content=?, category=?, attachment=?, is_published=?, sort_order=?, updated_at=CURRENT_TIMESTAMP WHERE id=?'
    ).run(
      fields.title || existing.title, fields.content || existing.content,
      fields.category || existing.category, attachment,
      fields.is_published !== undefined ? (fields.is_published ? 1 : 0) : existing.is_published,
      fields.sort_order ?? existing.sort_order, req.params.id
    );
    const guideline = db.prepare('SELECT * FROM guidelines WHERE id = ?').get(req.params.id);
    res.json(guideline);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update guideline.' });
  }
});

// DELETE /api/guidelines/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const result = db.prepare('DELETE FROM guidelines WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Guideline not found.' });
    res.json({ message: 'Guideline deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete guideline.' });
  }
});

module.exports = router;
