import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { ClipboardList, Plus, Edit, Trash2, X, Calendar, Users, FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function Activities() {
  const { isAdmin } = useAuth();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: '', type: 'committee_meeting', date: '', description: '', attendees: '', decisions: '', action_items: '' });

  useEffect(() => { fetchActivities(); }, [type]);

  const fetchActivities = async () => {
    try {
      const res = await api.get('/activities', { params: { type: type || undefined } });
      setActivities(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/activities/${editItem.id}`, form);
      } else {
        await api.post('/activities', form);
      }
      setShowForm(false); setEditItem(null);
      setForm({ title: '', type: 'committee_meeting', date: '', description: '', attendees: '', decisions: '', action_items: '' });
      fetchActivities();
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this activity record?')) return;
    try { await api.delete(`/activities/${id}`); fetchActivities(); } catch (err) { alert('Failed.'); }
  };

  const startEdit = (item) => {
    setEditItem(item);
    setForm({ title: item.title, type: item.type, date: item.date ? item.date.split('T')[0] : '', description: item.description || '', attendees: item.attendees || '', decisions: item.decisions || '', action_items: item.action_items || '' });
    setShowForm(true);
  };

  const types = [
    { value: 'committee_meeting', label: 'Committee Meeting', icon: '🏛️' },
    { value: 'builder_meeting', label: 'Builder Meeting', icon: '🏗️' },
    { value: 'resident_meeting', label: 'Resident Meeting', icon: '👥' },
    { value: 'agm', label: 'AGM', icon: '📊' },
    { value: 'event', label: 'Community Event', icon: '🎉' },
    { value: 'maintenance', label: 'Maintenance Activity', icon: '🔧' },
    { value: 'audit', label: 'Audit', icon: '📋' },
    { value: 'other', label: 'Other', icon: '📝' }
  ];

  const getTypeInfo = (t) => types.find(x => x.value === t) || { label: t, icon: '📝' };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Activities & Reports</h1>
          <p className="page-subtitle">Meeting minutes, events, and activity records</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ title: '', type: 'committee_meeting', date: '', description: '', attendees: '', decisions: '', action_items: '' }); setShowForm(true); }}>
            <Plus size={18} /> Add Activity
          </button>
        )}
      </div>

      <div className="tabs" style={{ marginBottom: '1rem' }}>
        <button className={`tab ${type === '' ? 'active' : ''}`} onClick={() => setType('')}>All</button>
        {types.map(t => (
          <button key={t.value} className={`tab ${type === t.value ? 'active' : ''}`} onClick={() => setType(t.value)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activities.length === 0 ? (
        <div className="empty-state"><ClipboardList size={64} /><h3>No activities found</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {activities.map(a => {
            const ti = getTypeInfo(a.type);
            return (
              <div key={a.id} className="card" style={{ padding: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.5rem' }}>{ti.icon}</span>
                    <div>
                      <h3 style={{ margin: '0 0 4px' }}>{a.title}</h3>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span className="badge badge-blue">{ti.label}</span>
                        {a.date && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                            <Calendar size={13} /> {format(new Date(a.date), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(a)}><Edit size={14} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(a.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>

                {a.description && <p style={{ margin: '10px 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{a.description}</p>}

                {a.attendees && (
                  <div style={{ padding: '8px 12px', background: 'var(--bg-light)', borderRadius: '6px', marginTop: '8px', fontSize: '0.82rem' }}>
                    <strong><Users size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />Attendees:</strong> {a.attendees}
                  </div>
                )}

                {a.decisions && (
                  <div style={{ padding: '8px 12px', background: '#eff6ff', borderRadius: '6px', marginTop: '8px', fontSize: '0.82rem', border: '1px solid #bfdbfe' }}>
                    <strong>📋 Decisions:</strong>
                    <div style={{ whiteSpace: 'pre-wrap', marginTop: '4px' }}>{a.decisions}</div>
                  </div>
                )}

                {a.action_items && (
                  <div style={{ padding: '8px 12px', background: '#fefce8', borderRadius: '6px', marginTop: '8px', fontSize: '0.82rem', border: '1px solid #fde68a' }}>
                    <strong>⚡ Action Items:</strong>
                    <div style={{ whiteSpace: 'pre-wrap', marginTop: '4px' }}>{a.action_items}</div>
                  </div>
                )}

                {a.created_by_name && (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '10px' }}>
                    Recorded by {a.created_by_name} on {format(new Date(a.created_at), 'MMM dd, yyyy')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h2>{editItem ? 'Edit Activity' : 'Add Activity'}</h2>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Type *</label>
                    <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                      {types.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date *</label>
                    <input className="form-input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Attendees</label>
                  <input className="form-input" placeholder="List attendee names" value={form.attendees} onChange={e => setForm({...form, attendees: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Decisions</label>
                  <textarea className="form-textarea" rows={3} value={form.decisions} onChange={e => setForm({...form, decisions: e.target.value})} placeholder="Key decisions made..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Action Items</label>
                  <textarea className="form-textarea" rows={3} value={form.action_items} onChange={e => setForm({...form, action_items: e.target.value})} placeholder="Follow-up tasks..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
