import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UserLogin from './pages/UserLogin';
import AdminLogin from './pages/AdminLogin';
import BookingPage from './pages/BookingPage';
import AdminDashboard from './pages/AdminDashboard';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

const RouteFallback = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const path = window.location.pathname;

  if (token) {
    return <Navigate to={role === 'ADMIN' ? '/admin/dashboard' : '/booking'} replace />;
  }
  
  if (path.startsWith('/admin')) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<UserLogin />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        
        {/* User Routes */}
        <Route element={<ProtectedRoute allowedRole="USER"><UserLayout /></ProtectedRoute>}>
          <Route path="/booking" element={<BookingPage />} />
        </Route>

        {/* Admin Routes */}
        <Route element={<ProtectedRoute allowedRole="ADMIN"><AdminLayout /></ProtectedRoute>}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* Placeholders for future admin pages */}
          <Route path="/admin/assets" element={<div className="text-gray-500 text-center py-20 font-medium">Asset Management Coming Soon</div>} />
          <Route path="/admin/audits" element={<div className="text-gray-500 text-center py-20 font-medium">Audit Logs Coming Soon</div>} />
        </Route>

        {/* Dynamic redirects */}
        <Route path="/" element={<RouteFallback />} />
        <Route path="*" element={<RouteFallback />} />
      </Routes>
    </Router>
  );
}

export default App;
