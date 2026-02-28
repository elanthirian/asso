const express = require('express');
const db = require('../database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/amenities
router.get('/', optionalAuth, (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM amenities WHERE is_active = 1';
    const params = [];
    if (category) { query += ' AND category = ?'; params.push(category); }
    query += ' ORDER BY name ASC';
    const amenities = db.prepare(query).all(...params);
    res.json(amenities);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch amenities.' });
  }
});

// GET /api/amenities/:id
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const amenity = db.prepare('SELECT * FROM amenities WHERE id = ?').get(req.params.id);
    if (!amenity) return res.status(404).json({ error: 'Amenity not found.' });
    res.json(amenity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch amenity.' });
  }
});

// POST /api/amenities (admin only)
router.post('/', authenticate, authorize('admin'), upload.single('image'), (req, res) => {
  try {
    const { name, description, category, timings, rules, capacity, is_bookable, booking_fee } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required.' });

    const image = req.file ? `/uploads/${req.file.filename}` : null;
    const stmt = db.prepare(
      'INSERT INTO amenities (name, description, category, image, timings, rules, capacity, is_bookable, booking_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(name, description || null, category || 'general', image, timings || null, rules || null, capacity || null, is_bookable ? 1 : 0, booking_fee || 0);
    const amenity = db.prepare('SELECT * FROM amenities WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(amenity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create amenity.' });
  }
});

// PUT /api/amenities/:id (admin only)
router.put('/:id', authenticate, authorize('admin'), upload.single('image'), (req, res) => {
  try {
    const fields = req.body;
    const existing = db.prepare('SELECT * FROM amenities WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Amenity not found.' });

    const image = req.file ? `/uploads/${req.file.filename}` : existing.image;
    db.prepare(
      'UPDATE amenities SET name=?, description=?, category=?, image=?, timings=?, rules=?, capacity=?, is_bookable=?, booking_fee=?, is_active=? WHERE id=?'
    ).run(
      fields.name || existing.name, fields.description ?? existing.description,
      fields.category || existing.category, image, fields.timings ?? existing.timings,
      fields.rules ?? existing.rules, fields.capacity ?? existing.capacity,
      fields.is_bookable !== undefined ? (fields.is_bookable ? 1 : 0) : existing.is_bookable,
      fields.booking_fee ?? existing.booking_fee,
      fields.is_active !== undefined ? (fields.is_active ? 1 : 0) : existing.is_active,
      req.params.id
    );
    const amenity = db.prepare('SELECT * FROM amenities WHERE id = ?').get(req.params.id);
    res.json(amenity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update amenity.' });
  }
});

// DELETE /api/amenities/:id (admin only)
router.delete('/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    db.prepare('UPDATE amenities SET is_active = 0 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Amenity deactivated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete amenity.' });
  }
});

module.exports = router;
