import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';

// Páginas públicas
import HomePage from './pages/HomePage';
import RaffleDetailPage from './pages/RaffleDetailPage';

// Páginas admin
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminRafflesPage from './pages/admin/AdminRafflesPage';
import AdminCreateRafflePage from './pages/admin/AdminCreateRafflePage';
import AdminPurchasesPage from './pages/admin/AdminPurchasesPage';
import AdminRaffleDetailPage from './pages/admin/AdminRaffleDetailPage';

// Layout
import PublicLayout from './components/layout/PublicLayout';
import AdminLayout from './components/layout/AdminLayout';
import ProtectedRoute from './components/layout/ProtectedRoute';

export default function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/rifa/:id" element={<RaffleDetailPage />} />
      </Route>

      {/* Admin Login */}
      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Rotas Admin Protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/rifas" element={<AdminRafflesPage />} />
          <Route path="/admin/rifas/criar" element={<AdminCreateRafflePage />} />
          <Route path="/admin/rifas/:id" element={<AdminRaffleDetailPage />} />
          <Route path="/admin/compras" element={<AdminPurchasesPage />} />
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
