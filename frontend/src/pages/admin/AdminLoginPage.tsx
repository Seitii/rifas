import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/admin/dashboard', { replace: true });
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    try {
      await login(email, password);
      toast.success('Login realizado com sucesso!');
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err.message || 'Credenciais inválidas');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-primary-900 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎟️</div>
          <h1 className="text-2xl font-bold text-white">Rifa Online</h1>
          <p className="text-gray-400 text-sm mt-1">Painel Administrativo</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Entrar</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@rifa.com"
                className="input"
                autoComplete="email"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full btn-lg mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2 justify-center">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : 'Entrar'}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-gray-100 text-center">
            <button
              onClick={() => navigate('/')}
              className="text-sm text-gray-500 hover:text-primary-600 transition-colors"
            >
              ← Voltar ao site
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
