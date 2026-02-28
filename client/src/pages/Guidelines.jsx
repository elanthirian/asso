import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { BookOpen, Plus, Edit, Trash2, X, Search, FileText, Download } from 'lucide-react';
import { format } from 'date-fns';

export default function Guidelines() {
  const { isAdmin } = useAuth();
  const [guidelines, setGuidelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ title: '', category: 'general', content: '', effective_date: '' });

  useEffect(() => { fetchGuidelines(); }, [category, search]);

  const fetchGuidelines = async () => {
    try {
      const res = await api.get('/guidelines', { params: { category: category || undefined, search: search || undefined } });
      setGuidelines(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/guidelines/${editItem.id}`, form);
      } else {
        await api.post('/guidelines', form);
      }
      setShowForm(false); setEditItem(null);
      setForm({ title: '', category: 'general', content: '', effective_date: '' });
      fetchGuidelines();
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this guideline?')) return;
    try { await api.delete(`/guidelines/${id}`); fetchGuidelines(); } catch (err) { alert('Failed.'); }
  };

  const startEdit = (item) => {
    setEditItem(item);
    setForm({ title: item.title, category: item.category, content: item.content, effective_date: item.effective_date || '' });
    setShowForm(true);
  };

  const categories = ['general', 'parking', 'pets', 'noise', 'renovation', 'security', 'waste_management', 'water', 'electricity', 'common_areas', 'rental', 'other'];

  const categoryIcons = {
    general: '📋', parking: '🅿️', pets: '🐾', noise: '🔇', renovation: '🔨',
    security: '🔒', waste_management: '♻️', water: '💧', electricity: '⚡',
    common_areas: '🏢', rental: '🏠', other: '📌'
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Guidelines & Policies</h1>
          <p className="page-subtitle">Rules and regulations for our community</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setForm({ title: '', category: 'general', content: '', effective_date: '' }); setShowForm(true); }}>
            <Plus size={18} /> Add Guideline
          </button>
        )}
      </div>

      <div className="filter-bar">
        <div style={{ position: 'relative', maxWidth: '250px' }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search guidelines..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '34px' }}
          />
        </div>
        <select className="form-select" value={category} onChange={e => setCategory(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{categoryIcons[c] || '📌'} {c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
        </select>
      </div>

      {guidelines.length === 0 ? (
        <div className="empty-state"><BookOpen size={64} /><h3>No guidelines found</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {guidelines.map(g => (
            <div key={g.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{ padding: '1rem 1.2rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                onClick={() => setExpanded(expanded === g.id ? null : g.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.3rem' }}>{categoryIcons[g.category] || '📌'}</span>
                  <div>
                    <h4 style={{ margin: 0 }}>{g.title}</h4>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-light)' }}>
                      <span className="badge">{g.category.replace('_', ' ')}</span>
                      {g.effective_date && <span>Effective: {format(new Date(g.effective_date), 'MMM dd, yyyy')}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {isAdmin && (
                    <>
                      <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); startEdit(g); }}><Edit size={14} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); handleDelete(g.id); }} style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                    </>
                  )}
                  <span style={{ transform: expanded === g.id ? 'rotate(180deg)' : '', transition: '0.2s', fontSize: '1.2rem' }}>▾</span>
                </div>
              </div>
              {expanded === g.id && (
                <div style={{ padding: '0 1.2rem 1.2rem', borderTop: '1px solid var(--border)' }}>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.88rem', lineHeight: 1.7, padding: '1rem 0', color: 'var(--text-secondary)' }}>
                    {g.content}
                  </div>
                  {g.attachment_url && (
                    <a href={g.attachment_url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                      <Download size={14} /> Download Attachment
                    </a>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '8px' }}>
                    Last updated: {format(new Date(g.updated_at || g.created_at), 'MMM dd, yyyy')}
                    {g.created_by_name && ` by ${g.created_by_name}`}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editItem ? 'Edit Guideline' : 'Add Guideline'}</h2>
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
                    <label className="form-label">Category *</label>
                    <select className="form-select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                      {categories.map(c => <option key={c} value={c}>{c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Effective Date</label>
                    <input className="form-input" type="date" value={form.effective_date} onChange={e => setForm({...form, effective_date: e.target.value})} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Content *</label>
                  <textarea className="form-textarea" rows={10} value={form.content} onChange={e => setForm({...form, content: e.target.value})} required placeholder="Write the guideline content here..." />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editItem ? 'Update' : 'Publish'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
