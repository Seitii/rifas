import { Outlet, Link } from 'react-router-dom';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="container-app">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl">🎟️</span>
              <span className="text-xl font-bold text-primary-700">Rifa Online</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                to="/"
                className="text-sm font-medium text-gray-600 hover:text-primary-600 transition-colors"
              >
                Rifas
              </Link>
              <Link
                to="/admin/login"
                className="btn-sm btn-outline text-sm"
              >
                Admin
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-gray-100 py-6 mt-12">
        <div className="container-app text-center">
          <p className="text-sm text-gray-500">
            🎟️ Rifa Online — Participe e concorra a prêmios incríveis!
          </p>
        </div>
      </footer>
    </div>
  );
}
