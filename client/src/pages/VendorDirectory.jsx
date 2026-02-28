import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { Store, Plus, Phone, MapPin, Clock, Star, Edit, Trash2, X, CheckCircle } from 'lucide-react';

export default function VendorDirectory() {
  const { isAdmin } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', category: 'plumber', phone: '', alternate_phone: '', email: '', address: '', availability: '', is_verified: false, notes: '' });

  useEffect(() => { fetchVendors(); }, [category, search]);

  const fetchVendors = async () => {
    try {
      const res = await api.get('/contacts/vendors', { params: { category: category || undefined, search: search || undefined } });
      setVendors(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/contacts/vendors/${editItem.id}`, form);
      } else {
        await api.post('/contacts/vendors', form);
      }
      setShowForm(false); setEditItem(null);
      setForm({ name: '', category: 'plumber', phone: '', alternate_phone: '', email: '', address: '', availability: '', is_verified: false, notes: '' });
      fetchVendors();
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this vendor?')) return;
    try { await api.delete(`/contacts/vendors/${id}`); fetchVendors(); } catch (err) { alert('Failed.'); }
  };

  const startEdit = (item) => {
    setEditItem(item);
    setForm({ name: item.name, category: item.category, phone: item.phone, alternate_phone: item.alternate_phone || '', email: item.email || '', address: item.address || '', availability: item.availability || '', is_verified: !!item.is_verified, notes: item.notes || '' });
    setShowForm(true);
  };

  const categories = ['plumber', 'electrician', 'carpenter', 'painter', 'grocery', 'pharmacy', 'laundry', 'pest_control', 'appliance_repair', 'cleaning', 'catering', 'other'];

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Vendor Directory</h1>
          <p className="page-subtitle">Trusted service providers near our community</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ name: '', category: 'plumber', phone: '', alternate_phone: '', email: '', address: '', availability: '', is_verified: false, notes: '' }); setShowForm(true); }}>
            <Plus size={18} /> Add Vendor
          </button>
        )}
      </div>

      <div className="filter-bar">
        <input
          type="text"
          className="form-input"
          placeholder="Search vendors..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: '250px' }}
        />
        <select className="form-select" value={category} onChange={e => setCategory(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
        </select>
      </div>

      {vendors.length === 0 ? (
        <div className="empty-state"><Store size={64} /><h3>No vendors found</h3></div>
      ) : (
        <div className="grid-3">
          {vendors.map(v => (
            <div key={v.id} className="contact-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {v.name}
                  {v.is_verified && <CheckCircle size={14} color="#16a34a" />}
                </h4>
                {isAdmin && (
                  <div style={{ display: 'flex', gap: '2px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(v)}><Edit size={14} /></button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(v.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
              <span className="badge badge-blue">{v.category.replace('_', ' ')}</span>
              <div className="phone">
                <a href={`tel:${v.phone}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>📞 {v.phone}</a>
              </div>
              {v.alternate_phone && <div className="detail"><Phone size={12} /> Alt: {v.alternate_phone}</div>}
              {v.address && <div className="detail"><MapPin size={12} /> {v.address}</div>}
              {v.availability && <div className="detail"><Clock size={12} /> {v.availability}</div>}
              {v.notes && <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginTop: '4px' }}>{v.notes}</p>}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editItem ? 'Edit Vendor' : 'Add Vendor'}</h2>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      {categories.map(c => <option key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Phone *</label>
                    <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Alternate Phone</label>
                    <input className="form-input" value={form.alternate_phone} onChange={e => setForm({...form, alternate_phone: e.target.value})} />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Availability</label>
                    <input className="form-input" placeholder="e.g., Mon-Sat 9AM-6PM" value={form.availability} onChange={e => setForm({...form, availability: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <input className="form-input" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                  <input type="checkbox" checked={form.is_verified} onChange={e => setForm({...form, is_verified: e.target.checked})} />
                  Verified by Association
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
