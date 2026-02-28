import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import {
  LayoutDashboard, Megaphone, Image, Phone, Store, Building2,
  Users, CreditCard, FileText, BookOpen, ClipboardList, Shield,
  Bell, Search, Menu, X, LogOut, User, Settings, ChevronDown,
  Home, AlertTriangle, Calendar
} from 'lucide-react';

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=20');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unread_count);
    } catch (err) { /* silent */ }
  };

  const markRead = async (id) => {
    await api.put(`/notifications/${id}/read`);
    fetchNotifications();
  };

  const markAllRead = async () => {
    await api.put('/notifications/read-all');
    fetchNotifications();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { section: 'Main' },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/announcements', icon: Megaphone, label: 'Announcements' },
    { to: '/gallery', icon: Image, label: 'Gallery & Media' },
    { section: 'Community' },
    { to: '/amenities', icon: Building2, label: 'Facilities' },
    { to: '/panel', icon: Users, label: 'Panel Directory' },
    { to: '/guidelines', icon: BookOpen, label: 'Guidelines' },
    { to: '/activities', icon: ClipboardList, label: 'Activities & Reports' },
    { section: 'Services' },
    { to: '/emergency-contacts', icon: AlertTriangle, label: 'Emergency Contacts' },
    { to: '/vendors', icon: Store, label: 'Vendor Directory' },
    { to: '/payments', icon: CreditCard, label: 'Payments' },
    { to: '/requests', icon: FileText, label: 'Requests & Bookings' },
  ];

  const adminItems = [
    { section: 'Administration' },
    { to: '/admin/users', icon: Shield, label: 'Manage Users' },
    { to: '/admin/requests', icon: FileText, label: 'Manage Requests' },
    { to: '/admin/payments', icon: CreditCard, label: 'Manage Payments' },
  ];

  return (
    <div className="app-layout">
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1>SSFOWA</h1>
            <button className="menu-toggle" onClick={() => setSidebarOpen(false)} style={{ color: '#94a3b8', display: sidebarOpen ? 'block' : 'none' }}>
              <X size={20} />
            </button>
          </div>
          <p>Shriram Shankari Flat Owners<br />Welfare Association</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item, i) =>
            item.section ? (
              <div key={i} className="sidebar-section">{item.section}</div>
            ) : (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <item.icon size={18} />
                {item.label}
              </NavLink>
            )
          )}
          {isAdmin && adminItems.map((item, i) =>
            item.section ? (
              <div key={`admin-${i}`} className="sidebar-section">{item.section}</div>
            ) : (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <item.icon size={18} />
                {item.label}
              </NavLink>
            )
          )}
        </nav>
      </aside>

      <div className="main-content">
        <header className="top-header">
          <div className="header-left">
            <button className="menu-toggle" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <form onSubmit={handleSearch} className="search-bar">
              <Search size={16} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search announcements, guidelines, vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          <div className="header-right">
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button className="notification-btn" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {showNotifications && (
                <div className="notifications-dropdown">
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.9rem' }}>Notifications</strong>
                    {unreadCount > 0 && (
                      <button className="btn btn-ghost btn-sm" onClick={markAllRead}>Mark all read</button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No notifications</div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`notification-item ${!n.is_read ? 'unread' : ''}`}
                        onClick={() => { markRead(n.id); if (n.link) navigate(n.link); setShowNotifications(false); }}
                      >
                        <div className="title">{n.title}</div>
                        <div className="message">{n.message}</div>
                        <div className="time">{format(new Date(n.created_at), 'MMM d, yyyy h:mm a')}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div style={{ position: 'relative' }} ref={userMenuRef}>
              <div className="user-menu" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="user-avatar">
                  {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="user-info">
                  <span className="name">{user?.full_name}</span>
                  <span className="role">{user?.role}</span>
                </div>
                <ChevronDown size={14} color="#94a3b8" />
              </div>
              {showUserMenu && (
                <div className="notifications-dropdown" style={{ width: '200px', right: 0 }}>
                  <NavLink to="/profile" className="notification-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: 'inherit' }} onClick={() => setShowUserMenu(false)}>
                    <User size={16} /> Profile
                  </NavLink>
                  <div className="notification-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }} onClick={handleLogout}>
                    <LogOut size={16} /> Sign Out
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
