import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: 'USER' | 'ADMIN';
}

export default function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to={allowedRole === 'ADMIN' ? '/admin/login' : '/login'} replace />;
  }

  if (role !== allowedRole) {
    // Role mismatch, redirect to corresponding login
    return <Navigate to={allowedRole === 'ADMIN' ? '/admin/login' : '/login'} replace />;
  }

  return <>{children}</>;
}
