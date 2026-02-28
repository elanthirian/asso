import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import { Image, Plus, Download, Trash2, X, FileText } from 'lucide-react';

export default function Gallery() {
  const { isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', category: 'general', file: null });

  useEffect(() => { fetchGallery(); }, [category]);

  const fetchGallery = async () => {
    try {
      const res = await api.get('/gallery', { params: { category: category || undefined } });
      setItems(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append('title', form.title);
    data.append('description', form.description);
    data.append('category', form.category);
    if (form.file) data.append('file', form.file);
    try {
      await api.post('/gallery', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setShowForm(false);
      setForm({ title: '', description: '', category: 'general', file: null });
      fetchGallery();
    } catch (err) {
      alert(err.response?.data?.error || 'Upload failed.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try { await api.delete(`/gallery/${id}`); fetchGallery(); } catch (err) { alert('Delete failed.'); }
  };

  const categories = ['general', 'achievement', 'newsletter', 'timetable', 'event'];

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Gallery & Media</h1>
          <p className="page-subtitle">Community photos, newsletters, and documents</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={18} /> Upload
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

      {items.length === 0 ? (
        <div className="empty-state"><Image size={64} /><h3>No gallery items yet</h3></div>
      ) : (
        <div className="grid-3">
          {items.map(item => (
            <div key={item.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {item.file_type === 'image' ? (
                <div style={{ height: '180px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  <img src={item.file_path} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div style="padding:20px;text-align:center;color:#94a3b8"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg></div>'; }} />
                </div>
              ) : (
                <div style={{ height: '180px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <FileText size={40} />
                  <span style={{ fontSize: '0.8rem', marginTop: '8px' }}>PDF Document</span>
                </div>
              )}
              <div style={{ padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <span className="badge badge-blue" style={{ marginBottom: '6px' }}>{item.category}</span>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.title}</h4>
                    {item.description && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{item.description}</p>}
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>{format(new Date(item.created_at), 'MMM d, yyyy')}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <a href={item.file_path} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm"><Download size={14} /></a>
                    {isAdmin && <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(item.id)} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload to Gallery</h2>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" rows={3} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">File *</label>
                  <input type="file" className="form-input" accept="image/*,.pdf" onChange={e => setForm({...form, file: e.target.files[0]})} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
