const express = require('express');
const db = require('../database');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// ===== EMERGENCY CONTACTS =====

// GET /api/contacts/emergency
router.get('/emergency', optionalAuth, (req, res) => {
  try {
    const { category } = req.query;
    let query = 'SELECT * FROM emergency_contacts WHERE 1=1';
    const params = [];
    if (category) { query += ' AND category = ?'; params.push(category); }
    query += ' ORDER BY sort_order ASC, name ASC';
    const contacts = db.prepare(query).all(...params);
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch emergency contacts.' });
  }
});

// POST /api/contacts/emergency (admin only)
router.post('/emergency', authenticate, authorize('admin'), (req, res) => {
  try {
    const { name, category, phone, alternate_phone, address, is_available_24x7, notes, sort_order } = req.body;
    if (!name || !category || !phone) return res.status(400).json({ error: 'Name, category, and phone required.' });
    const stmt = db.prepare(
      'INSERT INTO emergency_contacts (name, category, phone, alternate_phone, address, is_available_24x7, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(name, category, phone, alternate_phone || null, address || null, is_available_24x7 ? 1 : 0, notes || null, sort_order || 0);
    const contact = db.prepare('SELECT * FROM emergency_contacts WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create emergency contact.' });
  }
});

// PUT /api/contacts/emergency/:id (admin only)
router.put('/emergency/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const fields = req.body;
    const existing = db.prepare('SELECT * FROM emergency_contacts WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Contact not found.' });

    db.prepare(
      `UPDATE emergency_contacts SET name=?, category=?, phone=?, alternate_phone=?, address=?, is_available_24x7=?, notes=?, sort_order=? WHERE id=?`
    ).run(
      fields.name || existing.name, fields.category || existing.category, fields.phone || existing.phone,
      fields.alternate_phone ?? existing.alternate_phone, fields.address ?? existing.address,
      fields.is_available_24x7 !== undefined ? (fields.is_available_24x7 ? 1 : 0) : existing.is_available_24x7,
      fields.notes ?? existing.notes, fields.sort_order ?? existing.sort_order, req.params.id
    );
    const contact = db.prepare('SELECT * FROM emergency_contacts WHERE id = ?').get(req.params.id);
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update contact.' });
  }
});

// DELETE /api/contacts/emergency/:id (admin only)
router.delete('/emergency/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const result = db.prepare('DELETE FROM emergency_contacts WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Contact not found.' });
    res.json({ message: 'Contact deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete contact.' });
  }
});

// ===== VENDOR DIRECTORY =====

// GET /api/contacts/vendors
router.get('/vendors', optionalAuth, (req, res) => {
  try {
    const { category, search } = req.query;
    let query = 'SELECT * FROM vendors WHERE 1=1';
    const params = [];
    if (category) { query += ' AND category = ?'; params.push(category); }
    if (search) { query += ' AND (name LIKE ? OR notes LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY is_verified DESC, rating DESC, name ASC';
    const vendors = db.prepare(query).all(...params);
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendors.' });
  }
});

// POST /api/contacts/vendors (admin only)
router.post('/vendors', authenticate, authorize('admin'), (req, res) => {
  try {
    const { name, category, phone, alternate_phone, email, address, availability, is_verified, notes } = req.body;
    if (!name || !category || !phone) return res.status(400).json({ error: 'Name, category, and phone required.' });
    const stmt = db.prepare(
      'INSERT INTO vendors (name, category, phone, alternate_phone, email, address, availability, is_verified, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    const result = stmt.run(name, category, phone, alternate_phone || null, email || null, address || null, availability || null, is_verified ? 1 : 0, notes || null);
    const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(vendor);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create vendor.' });
  }
});

// PUT /api/contacts/vendors/:id (admin only)
router.put('/vendors/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const fields = req.body;
    const existing = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Vendor not found.' });

    db.prepare(
      `UPDATE vendors SET name=?, category=?, phone=?, alternate_phone=?, email=?, address=?, availability=?, is_verified=?, notes=? WHERE id=?`
    ).run(
      fields.name || existing.name, fields.category || existing.category, fields.phone || existing.phone,
      fields.alternate_phone ?? existing.alternate_phone, fields.email ?? existing.email,
      fields.address ?? existing.address, fields.availability ?? existing.availability,
      fields.is_verified !== undefined ? (fields.is_verified ? 1 : 0) : existing.is_verified,
      fields.notes ?? existing.notes, req.params.id
    );
    const vendor = db.prepare('SELECT * FROM vendors WHERE id = ?').get(req.params.id);
    res.json(vendor);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update vendor.' });
  }
});

// DELETE /api/contacts/vendors/:id (admin only)
router.delete('/vendors/:id', authenticate, authorize('admin'), (req, res) => {
  try {
    const result = db.prepare('DELETE FROM vendors WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Vendor not found.' });
    res.json({ message: 'Vendor deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete vendor.' });
  }
});

module.exports = router;
