import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Users, Search, Shield, Ban, CheckCircle, Edit, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [editingRole, setEditingRole] = useState(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      setUsers(res.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const changeRole = async (userId, newRole) => {
    try {
      await api.put(`/auth/users/${userId}/role`, { role: newRole });
      setEditingRole(null);
      fetchUsers();
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    if (!confirm(`${newStatus === 'inactive' ? 'Deactivate' : 'Activate'} this user?`)) return;
    try {
      await api.put(`/auth/users/${userId}/status`, { status: newStatus });
      fetchUsers();
    } catch (err) { alert(err.response?.data?.error || 'Failed.'); }
  };

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()) || (u.flat_number && u.flat_number.toLowerCase().includes(search.toLowerCase()));
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const roleBadge = (role) => {
    const colors = { admin: 'badge-red', member: 'badge-blue', tenant: 'badge-yellow', vendor: 'badge-green' };
    return <span className={`badge ${colors[role] || ''}`}>{role}</span>;
  };

  if (loading) return <div className="loading"><div className="spinner"></div></div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">{users.length} registered users</p>
        </div>
      </div>

      <div className="filter-bar">
        <div style={{ position: 'relative', maxWidth: '280px', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name, email, flat..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '34px' }}
          />
        </div>
        <select className="form-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: 'auto' }}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="member">Member</option>
          <option value="tenant">Tenant</option>
          <option value="vendor">Vendor</option>
        </select>
      </div>

      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-number">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{users.filter(u => u.status === 'active').length}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{users.filter(u => u.role === 'member').length}</div>
          <div className="stat-label">Members</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{users.filter(u => u.role === 'admin').length}</div>
          <div className="stat-label">Admins</div>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Contact</th>
              <th>Flat</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%',
                      background: 'var(--primary)', color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 600, fontSize: '0.85rem', flexShrink: 0
                    }}>
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 500 }}>{u.name}</span>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.85rem' }}>{u.email}</div>
                  {u.phone && <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>{u.phone}</div>}
                </td>
                <td>
                  {u.flat_number ? `${u.flat_number}${u.block ? `, ${u.block}` : ''}` : '-'}
                </td>
                <td>
                  {editingRole === u.id ? (
                    <select
                      className="form-select"
                      value={u.role}
                      onChange={e => changeRole(u.id, e.target.value)}
                      onBlur={() => setEditingRole(null)}
                      autoFocus
                      style={{ width: 'auto', fontSize: '0.8rem', padding: '4px 8px' }}
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="tenant">Tenant</option>
                      <option value="vendor">Vendor</option>
                    </select>
                  ) : (
                    <span onClick={() => setEditingRole(u.id)} style={{ cursor: 'pointer' }} title="Click to change role">
                      {roleBadge(u.role)}
                    </span>
                  )}
                </td>
                <td>
                  <span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-red'}`}>
                    {u.status}
                  </span>
                </td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                  {format(new Date(u.created_at), 'MMM dd, yyyy')}
                </td>
                <td>
                  <button
                    className={`btn btn-sm ${u.status === 'active' ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => toggleStatus(u.id, u.status)}
                    style={{ fontSize: '0.75rem' }}
                  >
                    {u.status === 'active' ? <><Ban size={12} /> Deactivate</> : <><CheckCircle size={12} /> Activate</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {filtered.length === 0 && <div className="empty-state"><Users size={48} /><h3>No users found</h3></div>}
    </div>
  );
}
