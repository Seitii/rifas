import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

export default function ProtectedRoute() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
