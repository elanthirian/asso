import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { User, Lock, Save, CheckCircle } from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    flat_number: user?.flat_number || '',
    block: user?.block || ''
  });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [msg, setMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [tab, setTab] = useState('profile');

  const handleProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg('');
    try {
      const res = await api.put('/auth/profile', form);
      if (setUser) setUser(res.data.user || { ...user, ...form });
      setMsg('Profile updated successfully!');
    } catch (err) { setMsg(err.response?.data?.error || 'Failed to update.'); }
    setSaving(false);
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) { setPwMsg('Passwords do not match.'); return; }
    if (pwForm.new_password.length < 6) { setPwMsg('Password must be at least 6 characters.'); return; }
    setChangingPw(true); setPwMsg('');
    try {
      await api.put('/auth/change-password', { current_password: pwForm.current_password, new_password: pwForm.new_password });
      setPwMsg('Password changed successfully!');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) { setPwMsg(err.response?.data?.error || 'Failed to change password.'); }
    setChangingPw(false);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">Manage your account settings</p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
          <User size={16} /> Profile Info
        </button>
        <button className={`tab ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>
          <Lock size={16} /> Change Password
        </button>
      </div>

      {tab === 'profile' && (
        <div className="card" style={{ maxWidth: '600px', padding: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '1.5rem' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'var(--primary)', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', fontWeight: 700
            }}>
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 style={{ margin: 0 }}>{user?.name}</h3>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-light)' }}>{user?.email}</p>
              <span className="badge badge-blue" style={{ marginTop: '4px' }}>{user?.role}</span>
            </div>
          </div>

          <form onSubmit={handleProfile}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={user?.email || ''} disabled style={{ background: 'var(--bg-light)' }} />
              <small style={{ color: 'var(--text-light)' }}>Email cannot be changed</small>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Flat Number</label>
                <input className="form-input" value={form.flat_number} onChange={e => setForm({...form, flat_number: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Block</label>
                <input className="form-input" value={form.block} onChange={e => setForm({...form, block: e.target.value})} />
              </div>
            </div>
            {msg && (
              <div style={{ padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem',
                background: msg.includes('success') ? '#f0fdf4' : '#fef2f2',
                color: msg.includes('success') ? '#16a34a' : '#dc2626',
                border: `1px solid ${msg.includes('success') ? '#bbf7d0' : '#fecaca'}` }}>
                {msg}
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {tab === 'password' && (
        <div className="card" style={{ maxWidth: '500px', padding: '2rem' }}>
          <form onSubmit={handlePassword}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" value={pwForm.current_password} onChange={e => setPwForm({...pwForm, current_password: e.target.value})} required />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={pwForm.new_password} onChange={e => setPwForm({...pwForm, new_password: e.target.value})} required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" value={pwForm.confirm_password} onChange={e => setPwForm({...pwForm, confirm_password: e.target.value})} required />
            </div>
            {pwMsg && (
              <div style={{ padding: '10px', borderRadius: '6px', marginBottom: '12px', fontSize: '0.85rem',
                background: pwMsg.includes('success') ? '#f0fdf4' : '#fef2f2',
                color: pwMsg.includes('success') ? '#16a34a' : '#dc2626',
                border: `1px solid ${pwMsg.includes('success') ? '#bbf7d0' : '#fecaca'}` }}>
                {pwMsg}
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={changingPw}>
              <Lock size={16} /> {changingPw ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
