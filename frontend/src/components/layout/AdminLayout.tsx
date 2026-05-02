import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/rifas', label: 'Rifas', icon: '🎟️' },
  { to: '/admin/compras', label: 'Compras', icon: '🛒' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Logout realizado');
    navigate('/admin/login');
  };

  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white transform transition-transform duration-300 lg:relative lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-2 p-6 border-b border-gray-700">
            <span className="text-2xl">🎟️</span>
            <div>
              <p className="font-bold text-white">Rifa Online</p>
              <p className="text-xs text-gray-400">Painel Admin</p>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive(item.to)
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-3 mb-3 px-3">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-red-600/20 hover:text-red-400 transition-colors"
            >
              <span>🚪</span>
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo principal */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header mobile */}
        <header className="bg-white shadow-sm border-b border-gray-100 lg:hidden">
          <div className="flex items-center gap-3 px-4 h-14">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Abrir menu"
            >
              <div className="space-y-1">
                <span className="block w-5 h-0.5 bg-gray-600" />
                <span className="block w-5 h-0.5 bg-gray-600" />
                <span className="block w-5 h-0.5 bg-gray-600" />
              </div>
            </button>
            <span className="font-semibold text-gray-800">Painel Admin</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
