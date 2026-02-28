const Database = require('better-sqlite3');
const path = require('path');
require('dotenv').config();

const dbPath = path.resolve(process.env.DB_PATH || './ssfowa.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Users table with role-based access
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    flat_number TEXT,
    block TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('admin','member','tenant','vendor')),
    avatar TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Announcements
  CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'general' CHECK(category IN ('event','notice','emergency','festival','fitness','general')),
    event_date DATETIME,
    event_time TEXT,
    location TEXT,
    image TEXT,
    is_pinned INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Gallery
  CREATE TABLE IF NOT EXISTS gallery (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general' CHECK(category IN ('achievement','newsletter','timetable','event','general')),
    file_path TEXT NOT NULL,
    file_type TEXT DEFAULT 'image' CHECK(file_type IN ('image','pdf','document')),
    uploaded_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Emergency Contacts
  CREATE TABLE IF NOT EXISTS emergency_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('security','medical','fire','police','ambulance','utility','other')),
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    address TEXT,
    is_available_24x7 INTEGER DEFAULT 0,
    notes TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Vendor Directory
  CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('plumber','electrician','carpenter','painter','grocery','pharmacy','laundry','pest_control','appliance_repair','cleaning','catering','other')),
    phone TEXT NOT NULL,
    alternate_phone TEXT,
    email TEXT,
    address TEXT,
    availability TEXT,
    rating REAL DEFAULT 0,
    total_reviews INTEGER DEFAULT 0,
    is_verified INTEGER DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Amenities / Facilities
  CREATE TABLE IF NOT EXISTS amenities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'general' CHECK(category IN ('fitness','recreation','community','senior','children','parking','general')),
    image TEXT,
    timings TEXT,
    rules TEXT,
    capacity INTEGER,
    is_bookable INTEGER DEFAULT 0,
    booking_fee REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Panel Members
  CREATE TABLE IF NOT EXISTS panel_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    position TEXT NOT NULL,
    description TEXT,
    photo TEXT,
    tenure_start DATE,
    tenure_end DATE,
    is_current INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Payments
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    amount REAL NOT NULL,
    payment_type TEXT NOT NULL CHECK(payment_type IN ('maintenance','special_assessment','booking','penalty','other')),
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','completed','failed','refunded')),
    payment_method TEXT,
    transaction_id TEXT,
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    receipt_number TEXT,
    due_date DATE,
    paid_at DATETIME,
    month TEXT,
    year INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Maintenance Dues (master schedule)
  CREATE TABLE IF NOT EXISTS maintenance_dues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flat_number TEXT NOT NULL,
    block TEXT,
    amount REAL NOT NULL,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','overdue')),
    payment_id INTEGER REFERENCES payments(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(flat_number, block, month, year)
  );

  -- Service Requests / Booking Forms
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) NOT NULL,
    request_type TEXT NOT NULL CHECK(request_type IN ('vehicle_sticker','adda_access','hall_booking','amenity_booking','general_enquiry','complaint','suggestion')),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','in_progress','completed')),
    admin_notes TEXT,
    booking_date DATE,
    booking_start_time TEXT,
    booking_end_time TEXT,
    amenity_id INTEGER REFERENCES amenities(id),
    vehicle_number TEXT,
    vehicle_type TEXT,
    attachment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Guidelines & Policies
  CREATE TABLE IF NOT EXISTS guidelines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL CHECK(category IN ('pet','lift','clubhouse','play_area','amphitheater','parking','noise','renovation','general','waste','water','security')),
    attachment TEXT,
    is_published INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Activities & Meeting Minutes
  CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    content TEXT,
    category TEXT NOT NULL CHECK(category IN ('committee','builder_meeting','resident_meeting','monthly_report','agm','special')),
    meeting_date DATE,
    attachment TEXT,
    is_published INTEGER DEFAULT 1,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Notifications
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK(type IN ('info','warning','success','error','payment','announcement')),
    is_read INTEGER DEFAULT 0,
    link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
  CREATE INDEX IF NOT EXISTS idx_announcements_category ON announcements(category);
  CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
  CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_id);
  CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
  CREATE INDEX IF NOT EXISTS idx_vendors_category ON vendors(category);
  CREATE INDEX IF NOT EXISTS idx_gallery_category ON gallery(category);
  CREATE INDEX IF NOT EXISTS idx_guidelines_category ON guidelines(category);
  CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category);
`);

module.exports = db;
