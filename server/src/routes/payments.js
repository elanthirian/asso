const express = require('express');
const db = require('../database');
const { authenticate, authorize } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// GET /api/payments - user's payments
router.get('/', authenticate, (req, res) => {
  try {
    const { status, type, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT * FROM payments WHERE user_id = ?';
    const params = [req.user.id];
    if (status) { query += ' AND status = ?'; params.push(status); }
    if (type) { query += ' AND payment_type = ?'; params.push(type); }
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const payments = db.prepare(query).all(...params);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments.' });
  }
});

// GET /api/payments/dues - user's pending dues
router.get('/dues', authenticate, (req, res) => {
  try {
    const user = db.prepare('SELECT flat_number, block FROM users WHERE id = ?').get(req.user.id);
    if (!user || !user.flat_number) return res.json([]);
    const dues = db.prepare(
      'SELECT * FROM maintenance_dues WHERE flat_number = ? AND (block = ? OR block IS NULL) AND status != ? ORDER BY year DESC, month DESC'
    ).all(user.flat_number, user.block, 'paid');
    res.json(dues);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch dues.' });
  }
});

// POST /api/payments/initiate - create a payment order
router.post('/initiate', authenticate, (req, res) => {
  try {
    const { amount, payment_type, description, month, year, due_id } = req.body;
    if (!amount || !payment_type) return res.status(400).json({ error: 'Amount and payment type required.' });

    const receipt = `SSFOWA-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const stmt = db.prepare(
      `INSERT INTO payments (user_id, amount, payment_type, description, status, receipt_number, month, year)
       VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`
    );
    const result = stmt.run(req.user.id, amount, payment_type, description || null, receipt, month || null, year || null);
    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(result.lastInsertRowid);

    // In production, create a Razorpay order here
    // For now, return mock order info
    res.status(201).json({
      payment,
      order: {
        id: `order_${uuidv4().replace(/-/g, '').substring(0, 16)}`,
        amount: amount * 100, // Razorpay expects paise
        currency: 'INR',
        receipt
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to initiate payment.' });
  }
});

// POST /api/payments/confirm - confirm payment
router.post('/confirm', authenticate, (req, res) => {
  try {
    const { payment_id, razorpay_payment_id, razorpay_order_id } = req.body;
    if (!payment_id) return res.status(400).json({ error: 'Payment ID required.' });

    const payment = db.prepare('SELECT * FROM payments WHERE id = ? AND user_id = ?').get(payment_id, req.user.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found.' });

    db.prepare(
      `UPDATE payments SET status='completed', razorpay_payment_id=?, razorpay_order_id=?, 
       payment_method='online', paid_at=CURRENT_TIMESTAMP WHERE id=?`
    ).run(razorpay_payment_id || 'demo_payment', razorpay_order_id || 'demo_order', payment_id);

    // Update maintenance dues if applicable
    if (payment.month && payment.year) {
      const user = db.prepare('SELECT flat_number, block FROM users WHERE id = ?').get(req.user.id);
      if (user?.flat_number) {
        db.prepare(
          'UPDATE maintenance_dues SET status=?, payment_id=? WHERE flat_number=? AND (block=? OR block IS NULL) AND month=? AND year=?'
        ).run('paid', payment_id, user.flat_number, user.block, payment.month, payment.year);
      }
    }

    // Create notification
    db.prepare(
      'INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user.id, 'Payment Successful', `Payment of ₹${payment.amount} confirmed. Receipt: ${payment.receipt_number}`, 'payment', '/payments');

    const updated = db.prepare('SELECT * FROM payments WHERE id = ?').get(payment_id);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to confirm payment.' });
  }
});

// GET /api/payments/all (admin only) - all payments
router.get('/all', authenticate, authorize('admin'), (req, res) => {
  try {
    const { status, type, search, limit = 100, offset = 0 } = req.query;
    let query = `SELECT p.*, u.full_name, u.flat_number, u.block FROM payments p 
                 JOIN users u ON p.user_id = u.id WHERE 1=1`;
    const params = [];
    if (status) { query += ' AND p.status = ?'; params.push(status); }
    if (type) { query += ' AND p.payment_type = ?'; params.push(type); }
    if (search) { query += ' AND (u.full_name LIKE ? OR u.flat_number LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));
    const payments = db.prepare(query).all(...params);

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_payments,
        SUM(CASE WHEN status='completed' THEN amount ELSE 0 END) as total_collected,
        SUM(CASE WHEN status='pending' THEN amount ELSE 0 END) as total_pending,
        COUNT(CASE WHEN status='completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN status='pending' THEN 1 END) as pending_count
      FROM payments
    `).get();
    res.json({ payments, stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payments.' });
  }
});

// POST /api/payments/generate-dues (admin only)
router.post('/generate-dues', authenticate, authorize('admin'), (req, res) => {
  try {
    const { month, year, amount, due_date } = req.body;
    if (!month || !year || !amount || !due_date) {
      return res.status(400).json({ error: 'Month, year, amount, and due date required.' });
    }

    const users = db.prepare("SELECT DISTINCT flat_number, block FROM users WHERE flat_number IS NOT NULL AND role IN ('member','admin')").all();
    const stmt = db.prepare(
      'INSERT OR IGNORE INTO maintenance_dues (flat_number, block, amount, month, year, due_date) VALUES (?, ?, ?, ?, ?, ?)'
    );
    const insertMany = db.transaction((users) => {
      let count = 0;
      for (const u of users) {
        const result = stmt.run(u.flat_number, u.block, amount, month, year, due_date);
        if (result.changes) count++;
      }
      return count;
    });
    const generated = insertMany(users);
    res.json({ message: `Generated ${generated} maintenance dues.` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate dues.' });
  }
});

module.exports = router;
