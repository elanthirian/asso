const express = require('express');
const db = require('../database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/gallery
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, file_type, limit = 30, offset = 0 } = req.query;
    let query = `SELECT g.*, u.full_name as uploaded_by_name FROM gallery g 
                 LEFT JOIN users u ON g.uploaded_by = u.id WHERE 1=1`;
    const params = [];
    if (category) { query += ' AND g.category = ?'; params.push(category); }
    if (file_type) { query += ' AND g.file_type = ?'; params.push(file_type); }
    query += ' ORDER BY g.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const items = db.prepare(query).all(...params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch gallery.' });
  }
});

// POST /api/gallery (admin only)
router.post('/', authenticate, authorize('admin'), upload.single('file'), (req, res) => {
  try {
    const { title, description, category, file_type } = req.body;
    if (!title || !req.file) return res.status(400).json({ error: 'Title and file are required.' });

    const file_path = `/uploads/${req.file.filename}`;
    const detectedType = req.file.mimetype.startsWith('image/') ? 'image' : 'pdf';
    const stmt = db.prepare(
      'INSERT INTO gallery (title, description, category, file_path, file_type, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(title, description || null, category || 'general', file_path, file_type || detectedType, req.user.id);
    const item = db.prepare('SELECT * FROM gallery WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload gallery item.' });
  }
});

// DELETE /api/gallery/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const result = db.prepare('DELETE FROM gallery WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Gallery item not found.' });
    res.json({ message: 'Gallery item deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete gallery item.' });
  }
});

module.exports = router;
