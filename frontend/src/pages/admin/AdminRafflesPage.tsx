import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { raffleApi } from '../../services/raffle.service';
import { Raffle } from '../../types';
import { formatCurrency, formatDate, getImageUrl } from '../../utils';
import toast from 'react-hot-toast';

export default function AdminRafflesPage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchRaffles = async () => {
    setIsLoading(true);
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter, limit: 100 } : { limit: 100 };
      const res = await raffleApi.getAll(params);
      if (res.success && res.data) setRaffles(res.data.data);
    } catch {
      toast.error('Erro ao carregar rifas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRaffles(); }, [statusFilter]);

  const handleDelete = async (raffle: Raffle) => {
    if (!window.confirm(`Excluir a rifa "${raffle.title}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(raffle.id);
    try {
      const res = await raffleApi.delete(raffle.id);
      if (res.success) {
        toast.success('Rifa excluída com sucesso');
        setRaffles(prev => prev.filter(r => r.id !== raffle.id));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao excluir rifa');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (raffle: Raffle, newStatus: string) => {
    try {
      const res = await raffleApi.update(raffle.id, { status: newStatus });
      if (res.success) {
        toast.success('Status atualizado');
        setRaffles(prev => prev.map(r => r.id === raffle.id ? { ...r, status: newStatus as any } : r));
      }
    } catch {
      toast.error('Erro ao atualizar status');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rifas</h1>
          <p className="text-gray-500 text-sm">{raffles.length} rifa(s) encontrada(s)</p>
        </div>
        <Link to="/admin/rifas/criar" className="btn-primary">+ Nova Rifa</Link>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'Todas' },
          { key: 'active', label: 'Ativas' },
          { key: 'closed', label: 'Encerradas' },
          { key: 'drawn', label: 'Sorteadas' },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === f.key
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : raffles.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-5xl mb-4">🎟️</p>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma rifa encontrada</h2>
          <p className="text-gray-500 mb-4">Crie sua primeira rifa para começar</p>
          <Link to="/admin/rifas/criar" className="btn-primary">+ Criar Rifa</Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left p-4 font-semibold text-gray-600">Rifa</th>
                  <th className="text-left p-4 font-semibold text-gray-600">Preço/Nº</th>
                  <th className="text-left p-4 font-semibold text-gray-600">Sorteio</th>
                  <th className="text-left p-4 font-semibold text-gray-600">Status</th>
                  <th className="text-right p-4 font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {raffles.map(raffle => (
                  <tr key={raffle.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                          <img
                            src={getImageUrl(raffle.images?.[0] ?? raffle.image_url)}
                            alt={raffle.title}
                            className="w-full h-full object-cover"
                            onError={e => { (e.target as HTMLImageElement).src = '/placeholder-raffle.svg'; }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 max-w-xs truncate">{raffle.title}</p>
                          <p className="text-xs text-gray-500">{raffle.total_numbers.toLocaleString()} números</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 font-semibold text-primary-600">{formatCurrency(Number(raffle.price_per_number))}</td>
                    <td className="p-4 text-gray-600">{formatDate(raffle.draw_date)}</td>
                    <td className="p-4">
                      <select
                        value={raffle.status}
                        onChange={e => handleStatusChange(raffle, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-primary-400"
                      >
                        <option value="active">Ativa</option>
                        <option value="closed">Encerrada</option>
                        <option value="drawn">Sorteada</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link to={`/admin/rifas/${raffle.id}`} className="btn-sm btn-secondary">Ver</Link>
                        <Link to={`/rifa/${raffle.id}`} target="_blank" className="btn-sm btn border border-gray-200 text-gray-500 hover:bg-gray-50">🌐</Link>
                        <button
                          onClick={() => handleDelete(raffle)}
                          disabled={deletingId === raffle.id}
                          className="btn-sm btn-danger"
                        >
                          {deletingId === raffle.id ? '...' : 'Excluir'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {raffles.map(raffle => (
              <div key={raffle.id} className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                    <img src={getImageUrl(raffle.images?.[0] ?? raffle.image_url)} alt={raffle.title} className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = '/placeholder-raffle.svg'; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{raffle.title}</p>
                    <p className="text-xs text-gray-500">{raffle.total_numbers.toLocaleString()} números • {formatCurrency(Number(raffle.price_per_number))}/nº</p>
                  </div>
                  <span className={`badge ${raffle.status === 'active' ? 'badge-active' : raffle.status === 'drawn' ? 'badge-drawn' : 'badge-closed'}`}>
                    {raffle.status === 'active' ? 'Ativa' : raffle.status === 'drawn' ? 'Sorteada' : 'Encerrada'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Link to={`/admin/rifas/${raffle.id}`} className="btn-secondary btn-sm flex-1 text-center">Ver detalhes</Link>
                  <button onClick={() => handleDelete(raffle)} disabled={deletingId === raffle.id} className="btn-danger btn-sm">
                    {deletingId === raffle.id ? '...' : '🗑️'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
