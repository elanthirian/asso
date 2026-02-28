const express = require('express');
const db = require('../database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/announcements
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category, limit = 20, offset = 0 } = req.query;
    let query = `SELECT a.*, u.full_name as author_name FROM announcements a 
                 LEFT JOIN users u ON a.created_by = u.id WHERE 1=1`;
    const params = [];
    if (category) { query += ' AND a.category = ?'; params.push(category); }
    query += ' ORDER BY a.is_pinned DESC, a.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const announcements = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM announcements' + (category ? ' WHERE category = ?' : '')).get(...(category ? [category] : []));
    res.json({ announcements, total: total.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch announcements.' });
  }
});

// GET /api/announcements/:id
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const announcement = db.prepare(
      `SELECT a.*, u.full_name as author_name FROM announcements a 
       LEFT JOIN users u ON a.created_by = u.id WHERE a.id = ?`
    ).get(req.params.id);
    if (!announcement) return res.status(404).json({ error: 'Announcement not found.' });
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch announcement.' });
  }
});

// POST /api/announcements (admin only)
router.post('/', authenticate, authorize('admin'), upload.single('image'), (req, res) => {
  try {
    const { title, description, category, event_date, event_time, location, is_pinned } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'Title and description required.' });

    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const stmt = db.prepare(
      `INSERT INTO announcements (title, description, category, event_date, event_time, location, image, is_pinned, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(title, description, category || 'general', event_date || null, event_time || null, location || null, image, is_pinned ? 1 : 0, req.user.id);

    // Create notification for all users
    const users = db.prepare('SELECT id FROM users WHERE is_active = 1').all();
    const notifStmt = db.prepare('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)');
    const insertMany = db.transaction((users) => {
      for (const u of users) {
        notifStmt.run(u.id, 'New Announcement', title, 'announcement', `/announcements/${result.lastInsertRowid}`);
      }
    });
    insertMany(users);

    const announcement = db.prepare('SELECT * FROM announcements WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(announcement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create announcement.' });
  }
});

// PUT /api/announcements/:id (admin only)
router.put('/:id', authenticate, authorize('admin'), upload.single('image'), (req, res) => {
  try {
    const { title, description, category, event_date, event_time, location, is_pinned } = req.body;
    const existing = db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Announcement not found.' });

    const image = req.file ? `/uploads/${req.file.filename}` : existing.image;
    db.prepare(
      `UPDATE announcements SET title=?, description=?, category=?, event_date=?, event_time=?, location=?, image=?, is_pinned=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`
    ).run(title || existing.title, description || existing.description, category || existing.category, event_date || existing.event_date, event_time || existing.event_time, location || existing.location, image, is_pinned !== undefined ? (is_pinned ? 1 : 0) : existing.is_pinned, req.params.id);

    const announcement = db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update announcement.' });
  }
});

// DELETE /api/announcements/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const result = db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Announcement not found.' });
    res.json({ message: 'Announcement deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete announcement.' });
  }
});

module.exports = router;
