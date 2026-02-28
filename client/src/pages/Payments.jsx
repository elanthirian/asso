import { useState, useEffect } from 'react';
import api from '../utils/api';
import { CreditCard, IndianRupee, Download, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [dues, setDues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dues');

  useEffect(() => {
    Promise.all([
      api.get('/payments/my').then(r => setPayments(r.data)),
      api.get('/payments/dues').then(r => setDues(r.data))
    ]).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handlePay = async (due) => {
    try {
      const res = await api.post('/payments/initiate', {
        due_id: due.id,
        amount: due.amount,
        payment_method: 'online'
      });
      // In production, integrate Razorpay here
      // For now, simulate payment confirmation
      await api.post('/payments/confirm', {
        payment_id: res.data.payment_id,
        transaction_id: 'TXN_' + Date.now(),
        payment_method: 'online'
      });
      alert('Payment successful!');
      // Refresh
      const [p, d] = await Promise.all([api.get('/payments/my'), api.get('/payments/dues')]);
      setPayments(p.data);
      setDues(d.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Payment failed');
    }
  };

  const statusIcon = (s) => {
    if (s === 'completed') return <CheckCircle2 size={14} color="#16a34a" />;
    if (s === 'pending') return <Clock size={14} color="#d97706" />;
    return <AlertCircle size={14} color="#dc2626" />;
  };

  const statusBadge = (s) => {
    const cls = s === 'completed' ? 'badge-green' : s === 'pending' ? 'badge-yellow' : 'badge-red';
    return <span className={`badge ${cls}`}>{s}</span>;
  };

  const pendingDues = dues.filter(d => d.status !== 'paid');
  const totalPending = pendingDues.reduce((sum, d) => sum + d.amount, 0);

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-subtitle">Manage your maintenance dues and payment history</p>
        </div>
      </div>

      {pendingDues.length > 0 && (
        <div className="card" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #f59e0b', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, color: '#92400e' }}>Pending Balance</h3>
              <p style={{ fontSize: '1.8rem', fontWeight: 700, color: '#78350f', margin: '4px 0 0' }}>₹{totalPending.toLocaleString()}</p>
            </div>
            <IndianRupee size={40} color="#92400e" style={{ opacity: 0.5 }} />
          </div>
        </div>
      )}

      <div className="tabs">
        <button className={`tab ${tab === 'dues' ? 'active' : ''}`} onClick={() => setTab('dues')}>
          Pending Dues ({pendingDues.length})
        </button>
        <button className={`tab ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
          Payment History ({payments.length})
        </button>
      </div>

      {tab === 'dues' && (
        pendingDues.length === 0 ? (
          <div className="empty-state"><CheckCircle2 size={64} color="#16a34a" /><h3>All dues cleared!</h3><p>You're up to date with all payments</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingDues.map(d => (
              <div key={d.id} className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h4 style={{ margin: 0 }}>{d.description || 'Maintenance Due'}</h4>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '0.8rem', color: 'var(--text-light)' }}>
                    <span>Period: {d.month}/{d.year}</span>
                    <span>Due: {d.due_date ? format(new Date(d.due_date), 'MMM dd, yyyy') : 'N/A'}</span>
                  </div>
                  {d.due_date && new Date(d.due_date) < new Date() && (
                    <span className="badge badge-red" style={{ marginTop: '4px' }}>Overdue</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>₹{d.amount.toLocaleString()}</span>
                  <button className="btn btn-primary" onClick={() => handlePay(d)}>
                    <CreditCard size={16} /> Pay Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'history' && (
        payments.length === 0 ? (
          <div className="empty-state"><CreditCard size={64} /><h3>No payment history</h3></div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Transaction ID</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td>{format(new Date(p.payment_date || p.created_at), 'MMM dd, yyyy')}</td>
                    <td>{p.description || `Maintenance - ${p.month}/${p.year}`}</td>
                    <td style={{ fontWeight: 600 }}>₹{p.amount.toLocaleString()}</td>
                    <td><span className="badge">{p.payment_method || 'online'}</span></td>
                    <td>{statusBadge(p.status)}</td>
                    <td style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{p.transaction_id || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
