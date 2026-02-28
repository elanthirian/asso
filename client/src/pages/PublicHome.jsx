import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LogIn, Megaphone, BookOpen, Calendar, ChevronRight, Shield,
  Users, Building, Phone, ArrowRight, Clock, Pin
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../utils/api';

export default function PublicHome() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [activities, setActivities] = useState([]);
  const [guidelines, setGuidelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('announcements');

  useEffect(() => {
    Promise.all([
      api.get('/announcements').then(r => setAnnouncements(r.data.announcements || [])).catch(() => {}),
      api.get('/activities').then(r => setActivities(Array.isArray(r.data) ? r.data : [])).catch(() => {}),
      api.get('/guidelines').then(r => setGuidelines(Array.isArray(r.data) ? r.data : [])).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  const categoryIcons = {
    general: '📋', maintenance: '🔧', event: '🎉', urgent: '🚨', meeting: '🏛️', financial: '💰',
    parking: '🅿️', pets: '🐾', noise: '🔇', renovation: '🔨', security: '🔒',
    waste_management: '♻️', water: '💧', electricity: '⚡', common_areas: '🏢', rental: '🏠', other: '📌'
  };

  const activityTypeLabels = {
    committee: 'Committee Meeting', builder_meeting: 'Builder Meeting',
    resident_meeting: 'Resident Meeting', agm: 'AGM', monthly_report: 'Monthly Report',
    special: 'Special', event: 'Community Event', maintenance: 'Maintenance',
    audit: 'Audit', other: 'Other'
  };

  return (
    <div className="public-home">
      {/* ---- Top Navigation Bar ---- */}
      <header className="public-header">
        <div className="public-header-inner">
          <Link to="/" className="public-logo">
            <span className="public-logo-icon">🏠</span>
            <div>
              <span className="public-logo-name">SSFOWA</span>
              <span className="public-logo-sub">Shriram Shankari Flat Owners Welfare Association</span>
            </div>
          </Link>
          <nav className="public-nav">
            <a href="#announcements" className="public-nav-link">Announcements</a>
            <a href="#activities" className="public-nav-link">Activities</a>
            <a href="#policies" className="public-nav-link">Policies</a>
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm public-login-btn">
                Go to Dashboard <ArrowRight size={15} />
              </Link>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm public-login-btn">
                <LogIn size={15} /> Member Login
              </Link>
            )}
          </nav>
          {/* Mobile nav */}
          <div className="public-nav-mobile">
            {user ? (
              <Link to="/dashboard" className="btn btn-primary btn-sm">Dashboard</Link>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm"><LogIn size={15} /> Login</Link>
            )}
          </div>
        </div>
      </header>

      {/* ---- Hero Banner ---- */}
      <section className="public-hero">
        <div className="public-hero-content">
          <h1>Welcome to SSFOWA</h1>
          <p>Shriram Shankari Flat Owners Welfare Association</p>
          <p className="public-hero-sub">
            Stay informed with the latest community announcements, activities, and policies — open to all residents.
          </p>
          <div className="public-hero-actions">
            <a href="#announcements" className="btn btn-primary">
              <Megaphone size={18} /> View Announcements
            </a>
            <a href="#policies" className="btn btn-secondary">
              <BookOpen size={18} /> Read Policies
            </a>
          </div>
        </div>
        <div className="public-hero-stats">
          <div className="public-stat">
            <Megaphone size={22} />
            <span className="public-stat-num">{announcements.length}</span>
            <span className="public-stat-lbl">Announcements</span>
          </div>
          <div className="public-stat">
            <Calendar size={22} />
            <span className="public-stat-num">{activities.length}</span>
            <span className="public-stat-lbl">Activities</span>
          </div>
          <div className="public-stat">
            <Shield size={22} />
            <span className="public-stat-num">{guidelines.length}</span>
            <span className="public-stat-lbl">Policies</span>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="loading"><div className="spinner"></div></div>
      ) : (
        <>
          {/* ---- Announcements Section ---- */}
          <section id="announcements" className="public-section">
            <div className="public-section-header">
              <h2><Megaphone size={24} /> Announcements</h2>
              <p>Latest updates from the association management</p>
            </div>
            {announcements.length === 0 ? (
              <div className="public-empty">No announcements at the moment.</div>
            ) : (
              <div className="public-card-grid">
                {announcements.map(a => (
                  <article key={a.id} className="public-card">
                    {a.image_url && (
                      <img src={a.image_url} alt={a.title} className="public-card-img" />
                    )}
                    <div className="public-card-body">
                      <div className="public-card-meta">
                        <span className="badge badge-blue">{a.category || 'general'}</span>
                        {a.is_pinned ? <span className="badge badge-yellow"><Pin size={10} /> Pinned</span> : null}
                        <span className="public-card-date">
                          <Clock size={12} /> {format(new Date(a.created_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <h3>{a.title}</h3>
                      <p className="public-card-desc">
                        {a.content && a.content.length > 220 ? a.content.substring(0, 220) + '...' : a.content}
                      </p>
                      {a.event_date && (
                        <div className="public-card-event">
                          <Calendar size={13} /> Event: {format(new Date(a.event_date), 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* ---- Activities Section ---- */}
          <section id="activities" className="public-section public-section-alt">
            <div className="public-section-header">
              <h2><Calendar size={24} /> Activities &amp; Meetings</h2>
              <p>Community events, meetings, and activity records</p>
            </div>
            {activities.length === 0 ? (
              <div className="public-empty">No activities recorded yet.</div>
            ) : (
              <div className="public-timeline">
                {activities.slice(0, 10).map(a => (
                  <div key={a.id} className="public-timeline-item">
                    <div className="public-timeline-dot"></div>
                    <div className="public-timeline-card">
                      <div className="public-card-meta">
                        <span className="badge badge-blue">{activityTypeLabels[a.category] || a.category}</span>
                        {a.meeting_date && (
                          <span className="public-card-date">
                            <Calendar size={12} /> {format(new Date(a.meeting_date), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>
                      <h4>{a.title}</h4>
                      {a.description && (
                        <p className="public-card-desc">
                          {a.description.length > 200 ? a.description.substring(0, 200) + '...' : a.description}
                        </p>
                      )}
                      {a.decisions && (
                        <div className="public-decisions">
                          <strong>📋 Key Decisions:</strong>
                          <p>{a.decisions.length > 150 ? a.decisions.substring(0, 150) + '...' : a.decisions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ---- Guidelines / Policies Section ---- */}
          <section id="policies" className="public-section">
            <div className="public-section-header">
              <h2><Shield size={24} /> Guidelines &amp; Policies</h2>
              <p>Rules and regulations for our community</p>
            </div>
            {guidelines.length === 0 ? (
              <div className="public-empty">No guidelines published yet.</div>
            ) : (
              <div className="public-policies-grid">
                {guidelines.map(g => (
                  <div key={g.id} className="public-policy-card">
                    <span className="public-policy-icon">{categoryIcons[g.category] || '📌'}</span>
                    <div>
                      <h4>{g.title}</h4>
                      <span className="badge">{(g.category || 'general').replace('_', ' ')}</span>
                      {g.effective_date && (
                        <span className="public-card-date" style={{ marginLeft: 8 }}>
                          Effective: {format(new Date(g.effective_date), 'MMM dd, yyyy')}
                        </span>
                      )}
                      <p className="public-card-desc" style={{ marginTop: 6 }}>
                        {g.content && g.content.length > 180 ? g.content.substring(0, 180) + '...' : g.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {/* ---- Footer ---- */}
      <footer className="public-footer">
        <div className="public-footer-inner">
          <div>
            <div className="public-logo" style={{ marginBottom: 8 }}>
              <span className="public-logo-icon">🏠</span>
              <div>
                <span className="public-logo-name">SSFOWA</span>
                <span className="public-logo-sub">Shriram Shankari Flat Owners Welfare Association</span>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-light)', maxWidth: 400, marginTop: 8 }}>
              Serving our community with transparency and collaboration. Members can log in to access the full member portal.
            </p>
          </div>
          <div className="public-footer-links">
            <h4>Quick Links</h4>
            <a href="#announcements">Announcements</a>
            <a href="#activities">Activities</a>
            <a href="#policies">Guidelines</a>
            <Link to="/login">Member Login</Link>
          </div>
        </div>
        <div className="public-footer-bottom">
          &copy; {new Date().getFullYear()} SSFOWA. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
