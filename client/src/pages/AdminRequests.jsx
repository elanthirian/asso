import { useState, useEffect } from 'react';
import api from '../utils/api';
import { FileText, CheckCircle, XCircle, Clock, MessageSquare, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [respondingTo, setRespondingTo] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => { fetchRequests(); }, [statusFilter, typeFilter]);

  const fetchRequests = async () => {
    try {
      const res = await api.get('/requests', { params: { status: statusFilter || undefined, type: typeFilter || undefined } });
      setRequests(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const updateRequest = async (id, status, notes) => {
    try {
      await api.put(`/requests/${id}/status`, { status, admin_notes: notes || adminNotes });
      setRespondingTo(null);
      setAdminNotes('');
      fetchRequests();
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  const types = [
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'vehicle_sticker', label: 'Vehicle Sticker' },
    { value: 'hall_booking', label: 'Hall Booking' },
    { value: 'noc', label: 'NOC' },
    { value: 'intercom', label: 'Intercom' },
    { value: 'complaint', label: 'Complaint' },
    { value: 'suggestion', label: 'Suggestion' },
    { value: 'other', label: 'Other' }
  ];

  const statusConfig = {
    pending: { class: 'badge-yellow', label: 'Pending' },
    in_progress: { class: 'badge-blue', label: 'In Progress' },
    approved: { class: 'badge-green', label: 'Approved' },
    rejected: { class: 'badge-red', label: 'Rejected' },
    completed: { class: 'badge-green', label: 'Completed' }
  };

  const counts = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    in_progress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed' || r.status === 'approved').length
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Manage Requests</h1>
          <p className="page-subtitle">Review and respond to resident requests</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-number">{counts.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #f59e0b' }}>
          <div className="stat-number" style={{ color: '#f59e0b' }}>{counts.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #3b82f6' }}>
          <div className="stat-number" style={{ color: '#3b82f6' }}>{counts.in_progress}</div>
          <div className="stat-label">In Progress</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #16a34a' }}>
          <div className="stat-number" style={{ color: '#16a34a' }}>{counts.completed}</div>
          <div className="stat-label">Resolved</div>
        </div>
      </div>

      <div className="filter-bar">
        <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
        <select className="form-select" value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All Types</option>
          {types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state"><FileText size={64} /><h3>No requests found</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {requests.map(r => {
            const sc = statusConfig[r.status] || statusConfig.pending;
            return (
              <div key={r.id} className="card" style={{ padding: '1.2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px' }}>{r.subject}</h4>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.8rem' }}>
                      <span className="badge badge-blue">{types.find(t => t.value === r.type)?.label || r.type}</span>
                      <span className={`badge ${sc.class}`}>{sc.label}</span>
                      <span style={{ color: 'var(--text-light)' }}>by {r.user_name || 'Unknown'}</span>
                      {r.flat_number && <span style={{ color: 'var(--text-light)' }}>• Flat {r.flat_number}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                    {format(new Date(r.created_at), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>

                <p style={{ margin: '10px 0', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{r.description}</p>

                {(r.preferred_date || r.preferred_time) && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', marginBottom: '8px' }}>
                    📅 Preferred: {r.preferred_date && format(new Date(r.preferred_date), 'MMM dd, yyyy')} {r.preferred_time || ''}
                  </div>
                )}

                {r.admin_notes && (
                  <div style={{ padding: '8px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', fontSize: '0.83rem', marginBottom: '8px' }}>
                    <strong>Admin Notes:</strong> {r.admin_notes}
                  </div>
                )}

                {respondingTo === r.id ? (
                  <div style={{ padding: '12px', background: 'var(--bg-light)', borderRadius: '8px', marginTop: '8px' }}>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="Add a note (optional)..."
                      value={adminNotes}
                      onChange={e => setAdminNotes(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => updateRequest(r.id, 'approved')}>
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button className="btn btn-sm" style={{ background: '#3b82f6', color: 'white' }} onClick={() => updateRequest(r.id, 'in_progress')}>
                        <Clock size={14} /> In Progress
                      </button>
                      <button className="btn btn-sm" style={{ background: '#16a34a', color: 'white' }} onClick={() => updateRequest(r.id, 'completed')}>
                        <CheckCircle size={14} /> Complete
                      </button>
                      <button className="btn btn-sm" style={{ background: '#dc2626', color: 'white' }} onClick={() => updateRequest(r.id, 'rejected')}>
                        <XCircle size={14} /> Reject
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setRespondingTo(null); setAdminNotes(''); }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => setRespondingTo(r.id)}>
                      <MessageSquare size={14} /> Respond
                    </button>
                    {r.status === 'pending' && (
                      <>
                        <button className="btn btn-primary btn-sm" onClick={() => updateRequest(r.id, 'approved', '')}>
                          <CheckCircle size={14} /> Quick Approve
                        </button>
                        <button className="btn btn-sm" style={{ background: '#dc2626', color: 'white' }} onClick={() => updateRequest(r.id, 'rejected', '')}>
                          <XCircle size={14} /> Reject
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
