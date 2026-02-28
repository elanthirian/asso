import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Building, Plus, Edit, Trash2, X, Clock, MapPin, Users, Calendar } from 'lucide-react';

export default function Amenities() {
  const { isAdmin } = useAuth();
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', location: '', capacity: '', timings: '', rules: '', booking_required: false, booking_fee: '' });

  useEffect(() => { fetchAmenities(); }, []);

  const fetchAmenities = async () => {
    try {
      const res = await api.get('/amenities');
      setAmenities(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form, capacity: form.capacity ? parseInt(form.capacity) : null, booking_fee: form.booking_fee ? parseFloat(form.booking_fee) : null };
      if (editItem) {
        await api.put(`/amenities/${editItem.id}`, data);
      } else {
        await api.post('/amenities', data);
      }
      setShowForm(false); setEditItem(null);
      setForm({ name: '', description: '', location: '', capacity: '', timings: '', rules: '', booking_required: false, booking_fee: '' });
      fetchAmenities();
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this amenity?')) return;
    try { await api.delete(`/amenities/${id}`); fetchAmenities(); } catch (err) { alert('Failed.'); }
  };

  const startEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, description: item.description || '', location: item.location || '', capacity: item.capacity || '', timings: item.timings || '', rules: item.rules || '', booking_required: !!item.booking_required, booking_fee: item.booking_fee || '' });
    setShowForm(true);
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Community Facilities</h1>
          <p className="page-subtitle">Amenities and common areas available for residents</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ name: '', description: '', location: '', capacity: '', timings: '', rules: '', booking_required: false, booking_fee: '' }); setShowForm(true); }}>
            <Plus size={18} /> Add Amenity
          </button>
        )}
      </div>

      {amenities.length === 0 ? (
        <div className="empty-state"><Building size={64} /><h3>No amenities listed</h3></div>
      ) : (
        <div className="grid-3">
          {amenities.map(a => (
            <div key={a.id} className="card" style={{ overflow: 'hidden' }}>
              {a.image_url ? (
                <img src={a.image_url} alt={a.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '160px', background: 'linear-gradient(135deg, var(--primary-light), var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building size={48} color="white" />
                </div>
              )}
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{a.name}</h3>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(a)}><Edit size={14} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(a.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
                {a.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: '8px 0' }}>{a.description}</p>}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                  {a.location && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-light)' }}><MapPin size={14} /> {a.location}</div>}
                  {a.capacity && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-light)' }}><Users size={14} /> Capacity: {a.capacity}</div>}
                  {a.timings && <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-light)' }}><Clock size={14} /> {a.timings}</div>}
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                  {a.booking_required ? (
                    <span className="badge badge-yellow">Booking Required</span>
                  ) : (
                    <span className="badge badge-green">Open Access</span>
                  )}
                  {a.booking_fee > 0 && <span className="badge badge-blue">₹{a.booking_fee}/use</span>}
                </div>
                {a.rules && (
                  <div style={{ marginTop: '10px', padding: '8px', background: 'var(--bg-light)', borderRadius: '6px', fontSize: '0.78rem', color: 'var(--text-light)' }}>
                    <strong>Rules:</strong> {a.rules.length > 100 ? a.rules.substring(0, 100) + '...' : a.rules}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editItem ? 'Edit Amenity' : 'Add Amenity'}</h2>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-input" placeholder="e.g., Ground Floor, Block A" value={form.location} onChange={e => setForm({...form, location: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Capacity</label>
                    <input className="form-input" type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Timings</label>
                    <input className="form-input" placeholder="e.g., 6AM - 10PM" value={form.timings} onChange={e => setForm({...form, timings: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Booking Fee (₹)</label>
                    <input className="form-input" type="number" step="0.01" value={form.booking_fee} onChange={e => setForm({...form, booking_fee: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Rules</label>
                  <textarea className="form-textarea" rows={3} value={form.rules} onChange={e => setForm({...form, rules: e.target.value})} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={form.booking_required} onChange={e => setForm({...form, booking_required: e.target.checked})} />
                  Booking required before use
                </label>
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
