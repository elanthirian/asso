import { useState, useEffect } from 'react';
import api from '../utils/api';
import { FileText, Plus, X, Clock, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function Requests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'maintenance', subject: '', description: '', preferred_date: '', preferred_time: '' });

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests/my');
      setRequests(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/requests', form);
      setShowForm(false);
      setForm({ type: 'maintenance', subject: '', description: '', preferred_date: '', preferred_time: '' });
      fetchRequests();
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  const types = [
    { value: 'maintenance', label: 'Maintenance Request' },
    { value: 'vehicle_sticker', label: 'Vehicle Sticker' },
    { value: 'hall_booking', label: 'Hall Booking' },
    { value: 'noc', label: 'NOC Request' },
    { value: 'intercom', label: 'Intercom Setup' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'other', label: 'Other' }
  ];

  const statusConfig = {
    pending: { icon: <Clock size={14} />, class: 'badge-yellow', label: 'Pending' },
    in_progress: { icon: <AlertCircle size={14} />, class: 'badge-blue', label: 'In Progress' },
    approved: { icon: <CheckCircle2 size={14} />, class: 'badge-green', label: 'Approved' },
    rejected: { icon: <AlertCircle size={14} />, class: 'badge-red', label: 'Rejected' },
    completed: { icon: <CheckCircle2 size={14} />, class: 'badge-green', label: 'Completed' }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Requests</h1>
          <p className="page-subtitle">Submit and track your service requests</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={18} /> New Request
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <FileText size={64} />
          <h3>No requests yet</h3>
          <p>Submit a request for maintenance, vehicle sticker, hall booking, etc.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Submit Request</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.map(r => {
            const sc = statusConfig[r.status] || statusConfig.pending;
            return (
              <div key={r.id} className="card" style={{ padding: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px' }}>{r.subject}</h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="badge badge-blue">{types.find(t => t.value === r.type)?.label || r.type}</span>
                      <span className={`badge ${sc.class}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {sc.icon} {sc.label}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                    {format(new Date(r.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>
                <p style={{ margin: '10px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{r.description}</p>
                {(r.preferred_date || r.preferred_time) && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                    Preferred: {r.preferred_date && format(new Date(r.preferred_date), 'MMM dd, yyyy')} {r.preferred_time || ''}
                  </div>
                )}
                {r.admin_notes && (
                  <div style={{ marginTop: '10px', padding: '10px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.83rem' }}>
                    <strong style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                      <MessageSquare size={13} /> Admin Response:
                    </strong>
                    {r.admin_notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Request</h2>
              <button className="btn btn-ghost" onClick={() => setShowForm(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Request Type *</label>
                  <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <input className="form-input" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} required placeholder="Brief description of your request" />
                </div>
                <div className="form-group">
                  <label className="form-label">Details *</label>
                  <textarea className="form-textarea" rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} required placeholder="Provide details about your request..." />
                </div>
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Preferred Date</label>
                    <input className="form-input" type="date" value={form.preferred_date} onChange={e => setForm({...form, preferred_date: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Preferred Time</label>
                    <input className="form-input" type="time" value={form.preferred_time} onChange={e => setForm({...form, preferred_time: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
