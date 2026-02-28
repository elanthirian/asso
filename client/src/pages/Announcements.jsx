import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import { Megaphone, Plus, Pin, Calendar, Clock, MapPin, Edit, Trash2, X } from 'lucide-react';

export default function Announcements() {
  const { isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: 'general', event_date: '', event_time: '', location: '', is_pinned: false });

  useEffect(() => { fetchAnnouncements(); }, [category]);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements', { params: { category: category || undefined } });
      setAnnouncements(res.data.announcements);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/announcements/${editItem.id}`, form);
      } else {
        await api.post('/announcements', form);
      }
      setShowForm(false);
      setEditItem(null);
      setForm({ title: '', description: '', category: 'general', event_date: '', event_time: '', location: '', is_pinned: false });
      fetchAnnouncements();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to save announcement.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try { await api.delete(`/announcements/${id}`); fetchAnnouncements(); } catch (err) { alert('Delete failed.'); }
  };

  const startEdit = (item) => {
    setEditItem(item);
    setForm({ title: item.title, description: item.description, category: item.category, event_date: item.event_date?.split('T')[0] || '', event_time: item.event_time || '', location: item.location || '', is_pinned: !!item.is_pinned });
    setShowForm(true);
  };

  const categories = ['general', 'event', 'notice', 'emergency', 'festival', 'fitness'];
  const categoryColors = { general: 'gray', event: 'blue', notice: 'amber', emergency: 'red', festival: 'purple', fitness: 'green' };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Announcements & Events</h1>
          <p className="page-subtitle">Stay updated with community news and upcoming events</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ title: '', description: '', category: 'general', event_date: '', event_time: '', location: '', is_pinned: false }); setShowForm(true); }}>
            <Plus size={18} /> New Announcement
          </button>
        )}
      </div>

      <div className="filter-bar">
        <button className={`btn btn-sm ${!category ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCategory('')}>All</button>
        {categories.map(c => (
          <button key={c} className={`btn btn-sm ${category === c ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setCategory(c)}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {announcements.length === 0 ? (
        <div className="empty-state">
          <Megaphone size={64} />
          <h3>No announcements yet</h3>
          <p>Check back later for community updates.</p>
        </div>
      ) : (
        announcements.map(a => (
          <div key={a.id} className={`announcement-card ${a.is_pinned ? 'pinned' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  {a.is_pinned && <Pin size={14} color="#f59e0b" />}
                  <span className={`badge badge-${categoryColors[a.category] || 'gray'}`}>{a.category}</span>
                </div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '8px' }}>{a.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-light)', lineHeight: 1.7 }}>{a.description}</p>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '4px', marginLeft: '12px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(a)}><Edit size={16} /></button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(a.id)} style={{ color: 'var(--danger)' }}><Trash2 size={16} /></button>
                </div>
              )}
            </div>
            <div className="announcement-meta">
              {a.event_date && <span><Calendar size={14} /> {format(new Date(a.event_date), 'MMM d, yyyy')}</span>}
              {a.event_time && <span><Clock size={14} /> {a.event_time}</span>}
              {a.location && <span><MapPin size={14} /> {a.location}</span>}
              <span><Clock size={14} /> Posted {format(new Date(a.created_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
        ))
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editItem ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Event Date</label>
                    <input type="date" className="form-input" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Event Time</label>
                    <input className="form-input" placeholder="e.g., 6:00 PM - 8:00 PM" value={form.event_time} onChange={e => setForm({...form, event_time: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-input" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                  </div>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={form.is_pinned} onChange={e => setForm({...form, is_pinned: e.target.checked})} />
                  Pin this announcement
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
