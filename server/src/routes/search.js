const express = require('express');
const db = require('../database');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

// GET /api/search?q=keyword
router.get('/', optionalAuth, (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.status(400).json({ error: 'Search query must be at least 2 characters.' });

    const term = `%${q}%`;
    const results = {
      announcements: db.prepare('SELECT id, title, description, category, "announcement" as type FROM announcements WHERE title LIKE ? OR description LIKE ? LIMIT 10').all(term, term),
      guidelines: db.prepare('SELECT id, title, content as description, category, "guideline" as type FROM guidelines WHERE is_published=1 AND (title LIKE ? OR content LIKE ?) LIMIT 10').all(term, term),
      activities: db.prepare('SELECT id, title, description, category, "activity" as type FROM activities WHERE is_published=1 AND (title LIKE ? OR description LIKE ? OR content LIKE ?) LIMIT 10').all(term, term, term),
      vendors: db.prepare('SELECT id, name as title, category, notes as description, "vendor" as type FROM vendors WHERE name LIKE ? OR category LIKE ? OR notes LIKE ? LIMIT 10').all(term, term, term),
      amenities: db.prepare('SELECT id, name as title, description, category, "amenity" as type FROM amenities WHERE is_active=1 AND (name LIKE ? OR description LIKE ?) LIMIT 10').all(term, term),
    };

    const total = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
    res.json({ query: q, total, results });
  } catch (err) {
    res.status(500).json({ error: 'Search failed.' });
  }
});

module.exports = router;
