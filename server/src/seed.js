require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./database');

console.log('Seeding SSFOWA database...');

const salt = bcrypt.genSaltSync(10);

// Seed admin user
const adminPassword = bcrypt.hashSync('admin123', salt);
db.prepare(`INSERT OR IGNORE INTO users (email, password, full_name, phone, flat_number, block, role) 
  VALUES (?, ?, ?, ?, ?, ?, ?)`).run('admin@ssfowa.org', adminPassword, 'Association Admin', '9876543210', 'A-101', 'A', 'admin');

// Seed sample members
const memberPassword = bcrypt.hashSync('member123', salt);
const members = [
  ['rajesh@email.com', 'Rajesh Kumar', '9876543211', 'A-102', 'A', 'member'],
  ['priya@email.com', 'Priya Sharma', '9876543212', 'A-201', 'A', 'member'],
  ['suresh@email.com', 'Suresh Iyer', '9876543213', 'B-101', 'B', 'member'],
  ['lakshmi@email.com', 'Lakshmi Narayan', '9876543214', 'B-202', 'B', 'member'],
  ['arun@email.com', 'Arun Prasad', '9876543215', 'C-301', 'C', 'member'],
  ['deepa@email.com', 'Deepa Venkatesh', '9876543216', 'C-102', 'C', 'tenant'],
];
const memberStmt = db.prepare('INSERT OR IGNORE INTO users (email, password, full_name, phone, flat_number, block, role) VALUES (?, ?, ?, ?, ?, ?, ?)');
for (const m of members) {
  memberStmt.run(m[0], memberPassword, m[1], m[2], m[3], m[4], m[5]);
}

// Seed panel members 
const panelMembers = [
  [1, 'President', 'Leading the association with dedication since 2024', '2024-04-01', '2026-03-31', 1],
  [2, 'Secretary', 'Managing all correspondence and records', '2024-04-01', '2026-03-31', 2],
  [3, 'Treasurer', 'Overseeing financial management and accounts', '2024-04-01', '2026-03-31', 3],
  [4, 'Joint Secretary', 'Assisting in daily administrative tasks', '2024-04-01', '2026-03-31', 4],
  [5, 'Committee Member', 'Active contributor to community well-being', '2024-04-01', '2026-03-31', 5],
];
const panelStmt = db.prepare('INSERT OR IGNORE INTO panel_members (user_id, position, description, tenure_start, tenure_end, sort_order) VALUES (?, ?, ?, ?, ?, ?)');
for (const p of panelMembers) {
  panelStmt.run(...p);
}

// Seed announcements
const announcements = [
  ['Community Fitness Bootcamp', 'Join us for a morning fitness bootcamp every Saturday! Open to all ages. Trainers provided.', 'fitness', '2026-03-07', '6:00 AM - 7:30 AM', 'Amphitheater Ground', 1],
  ['Holi Festival Celebration', 'Grand Holi celebration with organic colors, music, and refreshments. All residents welcome!', 'festival', '2026-03-14', '10:00 AM - 2:00 PM', 'Community Hall & Garden', 1],
  ['Monthly Maintenance Due Reminder', 'Monthly maintenance of ₹3,500 is due by 5th of every month. Please pay on time to avoid late fees.', 'notice', null, null, null, 0],
  ['Community Stall - Weekend Market', 'Homemade food stalls, handicrafts, and more! Residents can book stalls. Contact admin.', 'event', '2026-03-21', '4:00 PM - 8:00 PM', 'Clubhouse Lawn', 0],
  ['Fire Safety Drill', 'Mandatory fire safety drill for all blocks. Please participate. Fire extinguisher demo included.', 'emergency', '2026-03-10', '11:00 AM - 12:30 PM', 'Assembly Point - Main Gate', 0],
];
const annStmt = db.prepare('INSERT OR IGNORE INTO announcements (title, description, category, event_date, event_time, location, is_pinned, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, 1)');
for (const a of announcements) {
  annStmt.run(...a);
}

// Seed emergency contacts
const emergencyContacts = [
  ['Community Security Office', 'security', '044-2345-6789', '9876500001', 'Main Gate Security Room', 1, 'Available 24/7', 1],
  ['Nearest Hospital - Apollo', 'medical', '044-2345-9999', '108', '21, Greams Lane, Chennai', 1, 'Emergency ward available 24/7', 2],
  ['Fire Station', 'fire', '101', '044-2345-1010', 'Local Fire Station, Anna Nagar', 1, null, 3],
  ['Police Station', 'police', '100', '044-2345-1000', 'Local Police Station', 1, null, 4],
  ['Ambulance Service', 'ambulance', '108', '044-2345-1080', null, 1, 'Free ambulance service', 5],
  ['TANGEDCO (Electricity)', 'utility', '044-2345-7777', '1912', null, 0, 'Power outage complaints', 6],
  ['Metro Water', 'utility', '044-2345-8888', '044-2345-8889', null, 0, 'Water supply issues', 7],
];
const emStmt = db.prepare('INSERT OR IGNORE INTO emergency_contacts (name, category, phone, alternate_phone, address, is_available_24x7, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
for (const e of emergencyContacts) {
  emStmt.run(...e);
}

// Seed vendors
const vendors = [
  ['Kumar Plumbing Services', 'plumber', '9876500010', null, null, 'Near Block A Gate', 'Mon-Sat 8AM-6PM', 1, 'Reliable plumbing services'],
  ['Ravi Electricals', 'electrician', '9876500011', null, null, 'Shop 5, Commercial Complex', 'Mon-Sat 9AM-7PM', 1, 'Licensed electrician'],
  ['Fix-It Carpentry', 'carpenter', '9876500012', null, null, null, 'Mon-Fri 10AM-5PM', 0, 'Custom furniture and repairs'],
  ['Sri Lakshmi Grocery', 'grocery', '9876500013', null, null, 'Block D Ground Floor', 'Daily 7AM-10PM', 1, 'Daily essentials and groceries'],
  ['MedPlus Pharmacy', 'pharmacy', '9876500014', null, null, 'Opposite Main Gate', 'Daily 8AM-11PM', 1, 'All medicines and health products'],
  ['Clean Home Pest Control', 'pest_control', '9876500015', null, null, null, 'By appointment', 1, 'Eco-friendly pest control'],
  ['QuickFix Appliance Repair', 'appliance_repair', '9876500016', null, null, null, 'Mon-Sat 9AM-6PM', 0, 'AC, washing machine, fridge repair'],
];
const vendorStmt = db.prepare('INSERT OR IGNORE INTO vendors (name, category, phone, alternate_phone, email, address, availability, is_verified, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
for (const v of vendors) {
  vendorStmt.run(...v);
}

// Seed amenities
const amenities = [
  ['Swimming Pool', 'Olympic-size swimming pool with separate kids pool. Lifeguard on duty.', 'fitness', '6:00 AM - 9:00 AM, 4:00 PM - 8:00 PM', 'Mandatory swim cap. No food near pool. Children under 12 must be accompanied.', 40, 0, 0],
  ['Gymnasium', 'Fully equipped gym with cardio and weight training sections. Personal trainer available.', 'fitness', '5:30 AM - 10:00 PM', 'Wear proper shoes. Wipe equipment after use. No loud music.', 25, 0, 0],
  ['Community Hall', 'Air-conditioned hall for events, meetings, and celebrations. Capacity: 200 people.', 'community', '8:00 AM - 10:00 PM', 'Book 7 days in advance. Clean after use. No fireworks inside.', 200, 1, 2500],
  ['Children\'s Playground', 'Safe playground with swings, slides, and climbing frames. Soft flooring for safety.', 'children', '6:00 AM - 8:00 PM', 'Children under 5 must be supervised. No glass items allowed.', 30, 0, 0],
  ['Amphitheater', 'Open-air amphitheater for cultural events and community gatherings.', 'community', '6:00 AM - 9:00 PM', 'Book for events 15 days in advance. Max 500 people.', 500, 1, 5000],
  ['Senior Citizens Corner', 'Dedicated area with seating, indoor games, and reading materials for senior residents.', 'senior', '6:00 AM - 9:00 PM', 'Priority for residents above 60. Maintain quiet hours before 8 AM.', 20, 0, 0],
  ['Badminton Court', 'Standard badminton court with floodlights for evening play.', 'recreation', '6:00 AM - 9:00 PM', 'Book 1-hour slots. Non-marking shoes only.', 4, 1, 200],
  ['Jogging Track', '400m jogging track around the garden area. Well-lit for morning and evening use.', 'fitness', 'Open 24 hours', 'Cyclists not allowed. Keep to the left.', null, 0, 0],
  ['Clubhouse Terrace', 'Rooftop space with panoramic views. Perfect for private parties and BBQ nights.', 'recreation', '10:00 AM - 10:00 PM', 'Book 10 days in advance. Max 50 people. No loud music after 9 PM.', 50, 1, 3500],
];
const amenityStmt = db.prepare('INSERT OR IGNORE INTO amenities (name, description, category, timings, rules, capacity, is_bookable, booking_fee) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
for (const a of amenities) {
  amenityStmt.run(...a);
}

// Seed guidelines
const guidelines = [
  ['Pet Ownership Guidelines', 'All pet owners must register their pets with the association office. Dogs must be leashed in common areas at all times. Pet owners are responsible for cleaning up after their pets. Pets are not allowed in the swimming pool, gymnasium, or community hall. Vaccination certificates must be submitted annually. Barking/noise complaints will be addressed per the noise policy. Maximum 2 pets per household.', 'pet', 1],
  ['Lift Usage Etiquette', 'Do not overcrowd lifts beyond the stated capacity. Give priority to senior citizens, pregnant women, and differently-abled residents. Do not hold the lift doors open for extended periods. Keep the lift clean - no spitting, littering, or sticking gum. In case of emergency, use the emergency button and intercom. Shifting materials and heavy goods should use the service lift only. Children under 8 should be accompanied by adults.', 'lift', 2],
  ['Clubhouse Usage Rules', 'Clubhouse must be booked 7 days in advance through the online portal. A refundable security deposit of ₹5,000 is required for private bookings. Maximum capacity is 200 persons. Events must end by 10:00 PM. The booker is responsible for any damages. No smoking or alcohol consumption inside. Clean-up must be completed within 2 hours of event end.', 'clubhouse', 3],
  ['Parking Regulations', 'Each flat is allotted designated parking spaces as per the sale agreement. Visitor parking is available near the main gate. Do not park in fire lanes, driveways, or other residents\' spots. Two-wheelers must be parked in designated two-wheeler zones. Vehicle stickers are mandatory for all resident vehicles. Unauthorized vehicles may be towed at the owner\'s expense.', 'parking', 4],
  ['Noise Regulations', 'Quiet hours: 10:00 PM to 6:00 AM on all days. Construction/renovation work hours: 9:00 AM to 5:00 PM (weekdays only). Musical instruments and loudspeakers require prior permission. Party music to be kept at moderate levels. Repeated noise complaints may result in penalties.', 'noise', 5],
  ['Renovation Guidelines', 'Written approval from the association is mandatory before starting any renovation. Renovation hours: 9:00 AM to 5:00 PM on weekdays. No structural changes without consulting a structural engineer. A renovation deposit of ₹10,000 is required. All debris must be cleared within 24 hours. Workers must use the service lift and entrance. Renovation must be completed within the approved timeline.', 'renovation', 6],
  ['Common Area Guidelines', 'All common areas must be treated with respect. No personal belongings to be left in common areas. Report any damages immediately to the security office. Common area lights and fans to be switched off when not in use. Garden areas should not be walked upon - use pathways. Feeding stray animals in common areas is not permitted.', 'general', 7],
  ['Waste Management Policy', 'Segregate waste into wet and dry categories. Dispose waste only during designated collection hours (7:00 AM - 9:00 AM and 5:00 PM - 7:00 PM). E-waste should be submitted to the office for proper disposal. Composting units are available in the garden area. Do not dump waste in common areas, corridors, or staircases.', 'waste', 8],
];
const guidelineStmt = db.prepare('INSERT OR IGNORE INTO guidelines (title, content, category, sort_order, created_by) VALUES (?, ?, ?, ?, 1)');
for (const g of guidelines) {
  guidelineStmt.run(...g);
}

// Seed activities
const activities = [
  ['Monthly Committee Meeting - February 2026', 'Regular monthly meeting of the association committee to discuss ongoing projects and upcoming events.', 'Agenda: 1. Water supply improvement 2. Garden maintenance 3. Diwali preparation 4. Vendor review 5. Budget discussion', 'committee', '2026-02-15'],
  ['Meeting with Builder - Phase 2 Handover', 'Discussion on Phase 2 common area handover including swimming pool, amphitheater, and commercial block.', 'Minutes: Builder agreed to complete pending work by March 2026. Defect liability period extended by 6 months. Waterproofing work for terraces scheduled for next month.', 'builder_meeting', '2026-02-10'],
  ['Resident General Meeting Q4 2025', 'Quarterly general meeting with all residents to discuss association updates, financials, and upcoming plans.', 'Attendance: 85 out of 120 flats represented. Budget for FY 2026-27 presented and approved. New maintenance charges effective April 2026. Community garden project approved.', 'resident_meeting', '2026-01-25'],
  ['Annual General Meeting 2025', 'Annual general meeting with election of new committee members and annual financial report presentation.', 'Election results: New committee elected for 2024-2026 term. Annual report presented with surplus of ₹2,50,000. Major projects approved: Solar panels, EV charging stations, CCTV upgrade.', 'agm', '2025-12-20'],
  ['Community Green Initiative', 'Initiative to make the community more eco-friendly with solar panels, rainwater harvesting, and organic garden.', 'Phase 1: Solar panels on clubhouse roof - Completed. Phase 2: Rainwater harvesting system - In progress. Phase 3: Organic community garden - Planning stage.', 'committee', '2026-02-01'],
];
const actStmt = db.prepare('INSERT OR IGNORE INTO activities (title, description, content, category, meeting_date, is_published, created_by) VALUES (?, ?, ?, ?, ?, 1, 1)');
for (const a of activities) {
  actStmt.run(...a);
}

console.log('Database seeded successfully!');
console.log('Admin login: admin@ssfowa.org / admin123');
console.log('Member login: rajesh@email.com / member123');
process.exit(0);
