import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Phone, Plus, AlertTriangle, Clock, MapPin, Edit, Trash2, X, Shield, Heart, Flame, Siren } from 'lucide-react';

export default function EmergencyContacts() {
  const { isAdmin } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'security', phone: '', alternate_phone: '', address: '', is_available_24x7: false, notes: '' });

  useEffect(() => { fetchContacts(); }, [category]);

  const fetchContacts = async () => {
    try {
      const res = await api.get('/contacts/emergency', { params: { category: category || undefined } });
      setContacts(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/contacts/emergency/${editItem.id}`, form);
      } else {
        await api.post('/contacts/emergency', form);
      }
      setShowForm(false); setEditItem(null);
      setForm({ name: '', category: 'security', phone: '', alternate_phone: '', address: '', is_available_24x7: false, notes: '' });
      fetchContacts();
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this contact?')) return;
    try { await api.delete(`/contacts/emergency/${id}`); fetchContacts(); } catch (err) { alert('Failed.'); }
  };

  const startEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, category: item.category, phone: item.phone, alternate_phone: item.alternate_phone || '', address: item.address || '', is_available_24x7: !!item.is_available_24x7, notes: item.notes || '' });
    setShowForm(true);
  };

  const categories = ['security', 'medical', 'fire', 'police', 'ambulance', 'utility', 'other'];
  const categoryIcons = { security: Shield, medical: Heart, fire: Flame, police: Siren, ambulance: Heart, utility: Phone, other: Phone };
  const categoryColors = { security: '#2563eb', medical: '#dc2626', fire: '#ea580c', police: '#7c3aed', ambulance: '#dc2626', utility: '#0891b2', other: '#6b7280' };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Emergency Contacts</h1>
          <p className="page-subtitle">Important numbers for emergencies and utilities</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ name: '', category: 'security', phone: '', alternate_phone: '', address: '', is_available_24x7: false, notes: '' }); setShowForm(true); }}>
            <Plus size={18} /> Add Contact
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

      {contacts.length === 0 ? (
        <div className="empty-state"><AlertTriangle size={64} /><h3>No emergency contacts</h3></div>
      ) : (
        <div className="grid-3">
          {contacts.map(c => {
            const Icon = categoryIcons[c.category] || Phone;
            return (
              <div key={c.id} className="contact-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4>
                    <span style={{ width: '32px', height: '32px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: `${categoryColors[c.category]}15`, color: categoryColors[c.category] }}>
                      <Icon size={16} />
                    </span>
                    {c.name}
                  </h4>
                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => startEdit(c)}><Edit size={14} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(c.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
                <div className="phone">
                  <a href={`tel:${c.phone}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>📞 {c.phone}</a>
                </div>
                {c.alternate_phone && <div className="detail"><Phone size={12} /> Alt: {c.alternate_phone}</div>}
                {c.address && <div className="detail"><MapPin size={12} /> {c.address}</div>}
                {c.is_available_24x7 ? <span className="badge badge-green">24/7 Available</span> : null}
                {c.notes && <div className="detail" style={{ fontStyle: 'italic' }}>{c.notes}</div>}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editItem ? 'Edit Contact' : 'Add Emergency Contact'}</h2>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Alternate Phone</label>
                    <input className="form-input" value={form.alternate_phone} onChange={e => setForm({...form, alternate_phone: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Address</label>
                    <input className="form-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input className="form-input" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={form.is_available_24x7} onChange={e => setForm({...form, is_available_24x7: e.target.checked})} />
                  Available 24/7
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
