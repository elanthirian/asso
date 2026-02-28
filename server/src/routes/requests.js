const express = require('express');
const db = require('../database');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/requests - user's requests
router.get('/', authenticate, (req, res) => {
  try {
    const { status, type, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT r.*, a.name as amenity_name FROM requests r LEFT JOIN amenities a ON r.amenity_id = a.id WHERE r.user_id = ?';
    const params = [req.user.id];
    if (status) { query += ' AND r.status = ?'; params.push(status); }
    if (type) { query += ' AND r.request_type = ?'; params.push(type); }
    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const requests = db.prepare(query).all(...params);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests.' });
  }
});

// POST /api/requests
router.post('/', authenticate, upload.single('attachment'), (req, res) => {
  try {
    const { request_type, title, description, booking_date, booking_start_time, booking_end_time, amenity_id, vehicle_number, vehicle_type } = req.body;
    if (!request_type || !title) return res.status(400).json({ error: 'Request type and title required.' });

    // Check for booking conflicts
    if (amenity_id && booking_date && booking_start_time) {
      const conflict = db.prepare(
        `SELECT id FROM requests WHERE amenity_id = ? AND booking_date = ? AND status IN ('pending','approved')
         AND ((booking_start_time <= ? AND booking_end_time > ?) OR (booking_start_time < ? AND booking_end_time >= ?))`
      ).get(amenity_id, booking_date, booking_start_time, booking_start_time, booking_end_time, booking_end_time);
      if (conflict) {
        return res.status(409).json({ error: 'Time slot already booked. Please choose another time.' });
      }
    }

    const attachment = req.file ? `/uploads/${req.file.filename}` : null;
    const stmt = db.prepare(
      `INSERT INTO requests (user_id, request_type, title, description, booking_date, booking_start_time, booking_end_time, amenity_id, vehicle_number, vehicle_type, attachment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const result = stmt.run(
      req.user.id, request_type, title, description || null,
      booking_date || null, booking_start_time || null, booking_end_time || null,
      amenity_id || null, vehicle_number || null, vehicle_type || null, attachment
    );

    // Notify admins
    const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
    const notifStmt = db.prepare('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)');
    for (const admin of admins) {
      notifStmt.run(admin.id, 'New Request', `${title} - from ${req.user.email}`, 'info', '/admin/requests');
    }

    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(request);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create request.' });
  }
});

// GET /api/requests/all (admin only)
router.get('/all', authenticate, authorize('admin'), (req, res) => {
  try {
    const { status, type, search, limit = 100, offset = 0 } = req.query;
    let query = `SELECT r.*, u.full_name, u.flat_number, u.block, a.name as amenity_name 
                 FROM requests r JOIN users u ON r.user_id = u.id 
                 LEFT JOIN amenities a ON r.amenity_id = a.id WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND r.status = ?'; params.push(status); }
    if (type) { query += ' AND r.request_type = ?'; params.push(type); }
    if (search) { query += ' AND (u.full_name LIKE ? OR r.title LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const requests = db.prepare(query).all(...params);
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch requests.' });
  }
});

// PUT /api/requests/:id/status (admin only)
router.put('/:id/status', authenticate, authorize('admin'), (req, res) => {
  try {
    const { status, admin_notes } = req.body;
    if (!['pending', 'approved', 'rejected', 'in_progress', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }

    const request = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found.' });

    db.prepare('UPDATE requests SET status=?, admin_notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run(status, admin_notes || null, req.params.id);

    // Notify the user
    const statusMessages = {
      approved: 'Your request has been approved!',
      rejected: 'Your request has been rejected.',
      in_progress: 'Your request is being processed.',
      completed: 'Your request has been completed.'
    };
    if (statusMessages[status]) {
      db.prepare('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)')
        .run(request.user_id, 'Request Update', `${request.title}: ${statusMessages[status]}`, status === 'approved' ? 'success' : 'info', '/requests');
    }

    const updated = db.prepare('SELECT * FROM requests WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update request.' });
  }
});

module.exports = router;
