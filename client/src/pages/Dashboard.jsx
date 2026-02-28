import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import {
  Users, CreditCard, FileText, Megaphone, Calendar,
  TrendingUp, Clock, AlertCircle, IndianRupee, Bell
} from 'lucide-react';

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(res => { setStats(res.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome, {user?.full_name?.split(' ')[0]}! 👋</h1>
          <p className="page-subtitle">
            {isAdmin ? 'Association management overview' : 'Your community dashboard'}
          </p>
        </div>
      </div>

      {isAdmin ? (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue"><Users size={24} /></div>
              <div className="stat-info">
                <h3>Total Members</h3>
                <div className="stat-value">{stats?.total_users || 0}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green"><IndianRupee size={24} /></div>
              <div className="stat-info">
                <h3>Total Collected</h3>
                <div className="stat-value">₹{(stats?.total_collected || 0).toLocaleString()}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon amber"><FileText size={24} /></div>
              <div className="stat-info">
                <h3>Pending Requests</h3>
                <div className="stat-value">{stats?.pending_requests || 0}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple"><Calendar size={24} /></div>
              <div className="stat-info">
                <h3>Upcoming Events</h3>
                <div className="stat-value">{stats?.upcoming_events || 0}</div>
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Announcements</h3>
                <Link to="/announcements" className="btn btn-sm btn-secondary">View All</Link>
              </div>
              {stats?.recent_announcements?.length > 0 ? (
                stats.recent_announcements.map(a => (
                  <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge badge-${a.category === 'emergency' ? 'red' : a.category === 'event' ? 'blue' : a.category === 'festival' ? 'purple' : 'gray'}`}>{a.category}</span>
                      <strong style={{ fontSize: '0.85rem' }}>{a.title}</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{a.description?.substring(0, 100)}...</p>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No announcements yet.</p>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Requests</h3>
                <Link to="/admin/requests" className="btn btn-sm btn-secondary">View All</Link>
              </div>
              {stats?.recent_requests?.length > 0 ? (
                stats.recent_requests.map(r => (
                  <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <strong style={{ fontSize: '0.85rem' }}>{r.title}</strong>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.full_name} - {r.flat_number}</p>
                      </div>
                      <span className={`badge badge-${r.status === 'pending' ? 'amber' : r.status === 'approved' ? 'green' : r.status === 'rejected' ? 'red' : 'blue'}`}>{r.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent requests.</p>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon amber"><FileText size={24} /></div>
              <div className="stat-info">
                <h3>My Pending Requests</h3>
                <div className="stat-value">{stats?.my_pending_requests || 0}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon red"><CreditCard size={24} /></div>
              <div className="stat-info">
                <h3>Pending Payments</h3>
                <div className="stat-value">{stats?.my_pending_payments || 0}</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><Bell size={24} /></div>
              <div className="stat-info">
                <h3>Unread Notifications</h3>
                <div className="stat-value">{stats?.unread_notifications || 0}</div>
              </div>
            </div>
          </div>

          <div className="grid-2">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Upcoming Events</h3>
                <Link to="/announcements" className="btn btn-sm btn-secondary">View All</Link>
              </div>
              {stats?.upcoming_events?.length > 0 ? (
                stats.upcoming_events.map(e => (
                  <div key={e.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={16} color="var(--primary)" />
                      <strong style={{ fontSize: '0.85rem' }}>{e.title}</strong>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {e.event_date && format(new Date(e.event_date), 'MMM d, yyyy')} {e.event_time && `• ${e.event_time}`} {e.location && `• ${e.location}`}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No upcoming events.</p>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Announcements</h3>
              </div>
              {stats?.recent_announcements?.length > 0 ? (
                stats.recent_announcements.map(a => (
                  <div key={a.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                    <span className={`badge badge-${a.category === 'emergency' ? 'red' : a.category === 'festival' ? 'purple' : 'gray'}`}>{a.category}</span>
                    <strong style={{ fontSize: '0.85rem', marginLeft: '8px' }}>{a.title}</strong>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{a.description?.substring(0, 80)}...</p>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No announcements.</p>
              )}
            </div>
          </div>

          <div className="mt-6">
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Link to="/payments" className="btn btn-primary"><CreditCard size={16} /> Pay Maintenance</Link>
              <Link to="/requests" className="btn btn-secondary"><FileText size={16} /> Submit Request</Link>
              <Link to="/emergency-contacts" className="btn btn-secondary"><AlertCircle size={16} /> Emergency Contacts</Link>
              <Link to="/amenities" className="btn btn-secondary"><Calendar size={16} /> Book Amenity</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
