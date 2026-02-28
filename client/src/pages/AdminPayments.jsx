import { useState, useEffect } from 'react';
import api from '../utils/api';
import { IndianRupee, Download, Calendar, TrendingUp, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ total_collected: 0, pending_amount: 0, total_payments: 0 });
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);
  const [genForm, setGenForm] = useState({ amount: 3000, month: new Date().getMonth() + 1, year: new Date().getFullYear(), due_date: '', description: '' });

  useEffect(() => { fetchPayments(); }, []);

  const fetchPayments = async () => {
    try {
      const res = await api.get('/payments/all');
      setPayments(res.data.payments || []);
      setStats(res.data.stats || {});
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const generateDues = async (e) => {
    e.preventDefault();
    if (!confirm(`Generate maintenance dues of ₹${genForm.amount} for ${genForm.month}/${genForm.year} for all flats?`)) return;
    try {
      const res = await api.post('/payments/generate-dues', genForm);
      alert(res.data.message || 'Dues generated!');
      setGenerating(false);
      fetchPayments();
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payment Management</h1>
          <p className="page-subtitle">Track and manage maintenance collections</p>
        </div>
        <button className="btn btn-primary" onClick={() => setGenerating(!generating)}>
          <IndianRupee size={18} /> Generate Dues
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card" style={{ borderLeft: '3px solid #16a34a' }}>
          <div className="stat-number" style={{ color: '#16a34a' }}>₹{(stats.total_collected || 0).toLocaleString()}</div>
          <div className="stat-label">Total Collected</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #f59e0b' }}>
          <div className="stat-number" style={{ color: '#f59e0b' }}>₹{(stats.pending_amount || 0).toLocaleString()}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #3b82f6' }}>
          <div className="stat-number" style={{ color: '#3b82f6' }}>{stats.total_payments || 0}</div>
          <div className="stat-label">Total Transactions</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #8b5cf6' }}>
          <div className="stat-number" style={{ color: '#8b5cf6' }}>
            {stats.total_collected && stats.pending_amount
              ? Math.round((stats.total_collected / (stats.total_collected + stats.pending_amount)) * 100)
              : 0}%
          </div>
          <div className="stat-label">Collection Rate</div>
        </div>
      </div>

      {generating && (
        <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '2px solid var(--primary)' }}>
          <h3 style={{ margin: '0 0 1rem' }}>Generate Monthly Dues</h3>
          <form onSubmit={generateDues}>
            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Amount per Flat (₹) *</label>
                <input className="form-input" type="number" value={genForm.amount} onChange={e => setGenForm({...genForm, amount: parseInt(e.target.value)})} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <input className="form-input" placeholder="e.g., Monthly Maintenance" value={genForm.description} onChange={e => setGenForm({...genForm, description: e.target.value})} />
              </div>
            </div>
            <div className="grid-2" style={{ gap: '1rem', marginTop: '8px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Month *</label>
                  <select className="form-select" value={genForm.month} onChange={e => setGenForm({...genForm, month: parseInt(e.target.value)})}>
                    {Array.from({length: 12}, (_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('default', {month: 'long'})}</option>)}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Year *</label>
                  <input className="form-input" type="number" value={genForm.year} onChange={e => setGenForm({...genForm, year: parseInt(e.target.value)})} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date *</label>
                <input className="form-input" type="date" value={genForm.due_date} onChange={e => setGenForm({...genForm, due_date: e.target.value})} required />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button type="submit" className="btn btn-primary">Generate for All Flats</button>
              <button type="button" className="btn btn-secondary" onClick={() => setGenerating(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      <h3 style={{ margin: '0 0 1rem' }}>Recent Payments</h3>
      {payments.length === 0 ? (
        <div className="empty-state"><IndianRupee size={64} /><h3>No payments recorded</h3></div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Flat</th>
                <th>Amount</th>
                <th>Period</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
                <th>Transaction ID</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.user_name || 'N/A'}</td>
                  <td>{p.flat_number || '-'}</td>
                  <td style={{ fontWeight: 600 }}>₹{p.amount.toLocaleString()}</td>
                  <td>{p.month}/{p.year}</td>
                  <td><span className="badge">{p.payment_method || 'online'}</span></td>
                  <td>
                    <span className={`badge ${p.status === 'completed' ? 'badge-green' : p.status === 'pending' ? 'badge-yellow' : 'badge-red'}`}>
                      {p.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem' }}>{p.payment_date ? format(new Date(p.payment_date), 'MMM dd, yyyy') : '-'}</td>
                  <td style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>{p.transaction_id || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
