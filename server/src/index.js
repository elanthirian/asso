require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database
require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/gallery', require('./routes/gallery'));
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/amenities', require('./routes/amenities'));
app.use('/api/panel', require('./routes/panel'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/guidelines', require('./routes/guidelines'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/search', require('./routes/search'));

// Dashboard stats (admin)
const { authenticate, authorize } = require('./middleware/auth');
const db = require('./database');

app.get('/api/dashboard', authenticate, (req, res) => {
  try {
    const stats = {};
    if (req.user.role === 'admin') {
      stats.total_users = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
      stats.total_members = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='member'").get().c;
      stats.total_tenants = db.prepare("SELECT COUNT(*) as c FROM users WHERE role='tenant'").get().c;
      stats.pending_requests = db.prepare("SELECT COUNT(*) as c FROM requests WHERE status='pending'").get().c;
      stats.pending_payments = db.prepare("SELECT COUNT(*) as c FROM payments WHERE status='pending'").get().c;
      stats.total_collected = db.prepare("SELECT COALESCE(SUM(amount),0) as c FROM payments WHERE status='completed'").get().c;
      stats.upcoming_events = db.prepare("SELECT COUNT(*) as c FROM announcements WHERE event_date >= date('now')").get().c;
      stats.recent_announcements = db.prepare('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 5').all();
      stats.recent_requests = db.prepare(
        `SELECT r.*, u.full_name, u.flat_number FROM requests r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC LIMIT 5`
      ).all();
    } else {
      stats.my_pending_requests = db.prepare("SELECT COUNT(*) as c FROM requests WHERE user_id=? AND status='pending'").get(req.user.id).c;
      stats.my_pending_payments = db.prepare("SELECT COUNT(*) as c FROM payments WHERE user_id=? AND status='pending'").get(req.user.id).c;
      stats.upcoming_events = db.prepare("SELECT * FROM announcements WHERE event_date >= date('now') ORDER BY event_date ASC LIMIT 5").all();
      stats.recent_announcements = db.prepare('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 5').all();
    }
    const unread = db.prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id=? AND is_read=0').get(req.user.id);
    stats.unread_notifications = unread.c;
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch dashboard.' });
  }
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`SSFOWA Server running on port ${PORT}`);
});

module.exports = app;
