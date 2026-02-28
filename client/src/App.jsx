import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import PublicHome from './pages/PublicHome';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Announcements from './pages/Announcements';
import Gallery from './pages/Gallery';
import EmergencyContacts from './pages/EmergencyContacts';
import VendorDirectory from './pages/VendorDirectory';
import Amenities from './pages/Amenities';
import PanelDirectory from './pages/PanelDirectory';
import Payments from './pages/Payments';
import Requests from './pages/Requests';
import Guidelines from './pages/Guidelines';
import Activities from './pages/Activities';
import AdminUsers from './pages/AdminUsers';
import AdminRequests from './pages/AdminRequests';
import AdminPayments from './pages/AdminPayments';
import Profile from './pages/Profile';
import SearchResults from './pages/SearchResults';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth();
  if (loading) return <div className="loading"><div className="spinner"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/announcements" element={<Announcements />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/emergency-contacts" element={<EmergencyContacts />} />
        <Route path="/vendors" element={<VendorDirectory />} />
        <Route path="/amenities" element={<Amenities />} />
        <Route path="/panel" element={<PanelDirectory />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/requests" element={<Requests />} />
        <Route path="/guidelines" element={<Guidelines />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/search" element={<SearchResults />} />

        {/* Admin routes */}
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/requests" element={<AdminRoute><AdminRequests /></AdminRoute>} />
        <Route path="/admin/payments" element={<AdminRoute><AdminPayments /></AdminRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
