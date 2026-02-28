import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserPlus } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', confirm_password: '', full_name: '', phone: '', flat_number: '', block: '', role: 'member' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '500px' }}>
        <div className="logo-text">🏠 SSFOWA</div>
        <h1>Create Account</h1>
        <p className="subtitle">Join the Shriram Shankari community</p>

        {error && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input type="text" name="full_name" className="form-input" value={form.full_name} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input type="email" name="email" className="form-input" value={form.email} onChange={handleChange} required />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input type="password" name="password" className="form-input" value={form.password} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input type="password" name="confirm_password" className="form-input" value={form.confirm_password} onChange={handleChange} required />
            </div>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="tel" name="phone" className="form-input" value={form.phone} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label className="form-label">I am a</label>
              <select name="role" className="form-select" value={form.role} onChange={handleChange}>
                <option value="member">Flat Owner</option>
                <option value="tenant">Tenant</option>
                <option value="vendor">Vendor</option>
              </select>
            </div>
          </div>

          {form.role !== 'vendor' && (
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Flat Number</label>
                <input type="text" name="flat_number" className="form-input" placeholder="e.g., A-101" value={form.flat_number} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Block</label>
                <input type="text" name="block" className="form-input" placeholder="e.g., A" value={form.block} onChange={handleChange} />
              </div>
            </div>
          )}

          <button type="submit" className="btn btn-primary w-full" style={{ justifyContent: 'center', marginTop: '8px' }} disabled={loading}>
            <UserPlus size={18} />
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: '#64748b' }}>
          Already have an account? <Link to="/login" style={{ color: '#2563eb', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
