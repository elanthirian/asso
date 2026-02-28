import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, Phone, Mail, Calendar } from 'lucide-react';

export default function PanelDirectory() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/panel').then(res => setMembers(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  const positionOrder = { president: 1, vice_president: 2, secretary: 3, joint_secretary: 4, treasurer: 5, member: 6 };
  const sorted = [...members].sort((a, b) => (positionOrder[a.position] || 99) - (positionOrder[b.position] || 99));

  const positionLabel = (p) => p.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  const positionColor = (p) => {
    if (p === 'president') return '#dc2626';
    if (p === 'vice_president') return '#ea580c';
    if (p === 'secretary') return '#2563eb';
    if (p === 'treasurer') return '#16a34a';
    return '#6b7280';
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Association Panel</h1>
          <p className="page-subtitle">Meet the committee members managing our community</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state"><Users size={64} /><h3>No panel members listed</h3></div>
      ) : (
        <div className="grid-3">
          {sorted.map(m => (
            <div key={m.id} className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
              <div style={{
                width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 12px',
                background: m.photo_url ? `url(${m.photo_url}) center/cover` : `linear-gradient(135deg, ${positionColor(m.position)}, ${positionColor(m.position)}dd)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '1.5rem', fontWeight: 700,
                border: `3px solid ${positionColor(m.position)}`
              }}>
                {!m.photo_url && (m.user_name || m.name || '?').charAt(0).toUpperCase()}
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem' }}>{m.user_name || m.name}</h3>
              <span style={{
                display: 'inline-block', padding: '3px 12px', borderRadius: '12px', fontSize: '0.75rem',
                fontWeight: 600, color: 'white', background: positionColor(m.position)
              }}>
                {positionLabel(m.position)}
              </span>
              {m.flat_number && <p style={{ fontSize: '0.8rem', color: 'var(--text-light)', margin: '8px 0 4px' }}>Flat: {m.flat_number}{m.block ? `, Block ${m.block}` : ''}</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '10px', fontSize: '0.8rem' }}>
                {(m.phone || m.user_phone) && (
                  <a href={`tel:${m.phone || m.user_phone}`} style={{ color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Phone size={13} /> {m.phone || m.user_phone}
                  </a>
                )}
                {(m.email || m.user_email) && (
                  <a href={`mailto:${m.email || m.user_email}`} style={{ color: 'var(--text-light)', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Mail size={13} /> {m.email || m.user_email}
                  </a>
                )}
              </div>
              {(m.tenure_start || m.tenure_end) && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-light)' }}>
                  <Calendar size={12} />
                  {m.tenure_start && new Date(m.tenure_start).getFullYear()} - {m.tenure_end ? new Date(m.tenure_end).getFullYear() : 'Present'}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
