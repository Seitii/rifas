import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { raffleApi, purchaseApi } from '../../services/raffle.service';
import { Raffle, RaffleNumber, RaffleStats, Purchase } from '../../types';
import { formatCurrency, formatDate, formatDateTime, getImageUrl, calculateProgress } from '../../utils';
import toast from 'react-hot-toast';

export default function AdminRaffleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [stats, setStats] = useState<RaffleStats | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'numbers' | 'purchases'>('overview');
  const [numberFilter, setNumberFilter] = useState<'all' | 'available' | 'reserved' | 'purchased'>('all');

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [raffleRes, numbersRes, purchasesRes] = await Promise.all([
          raffleApi.getById(id),
          raffleApi.getNumbers(id),
          purchaseApi.getAll({ raffle_id: id }),
        ]);
        if (raffleRes.success && raffleRes.data) { setRaffle(raffleRes.data); setStats(raffleRes.data.stats || null); }
        if (numbersRes.success && numbersRes.data) setNumbers(numbersRes.data);
        if (purchasesRes.success && purchasesRes.data) setPurchases(purchasesRes.data.data);
      } catch { toast.error('Erro ao carregar dados'); navigate('/admin/rifas'); }
      finally { setIsLoading(false); }
    };
    fetchData();
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!raffle) return;
    try {
      const res = await raffleApi.update(raffle.id, { status: newStatus });
      if (res.success && res.data) { setRaffle(res.data); toast.success('Status atualizado!'); }
    } catch { toast.error('Erro ao atualizar status'); }
  };

  const handleCancelPurchase = async (purchaseId: string) => {
    if (!window.confirm('Cancelar esta compra? Os números serão liberados.')) return;
    try {
      const res = await purchaseApi.cancel(purchaseId);
      if (res.success) {
        toast.success('Compra cancelada');
        setPurchases(prev => prev.map(p => p.id === purchaseId ? { ...p, status: 'cancelled' } : p));
        // Recarregar números
        if (id) {
          const numbersRes = await raffleApi.getNumbers(id);
          if (numbersRes.success && numbersRes.data) setNumbers(numbersRes.data);
          const statsRes = await raffleApi.getStats(id);
          if (statsRes.success && statsRes.data) setStats(statsRes.data);
        }
      }
    } catch { toast.error('Erro ao cancelar compra'); }
  };

  const filteredNumbers = numbers.filter(n => numberFilter === 'all' || n.status === numberFilter);

  if (isLoading) return (
    <div className="p-6 animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/3" />
      <div className="h-48 bg-gray-200 rounded-xl" />
    </div>
  );

  if (!raffle) return null;

  const progress = stats ? calculateProgress(stats) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/rifas')} className="p-2 hover:bg-gray-100 rounded-lg">←</button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{raffle.title}</h1>
            <p className="text-gray-500 text-sm">ID: {raffle.id.slice(0, 8)}...</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to={`/rifa/${raffle.id}`} target="_blank" className="btn-secondary btn-sm">🌐 Ver site</Link>
          <select
            value={raffle.status}
            onChange={e => handleStatusChange(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-400"
          >
            <option value="active">Ativa</option>
            <option value="closed">Encerrada</option>
            <option value="drawn">Sorteada</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Disponíveis', value: stats.available, color: 'text-green-700', bg: 'bg-green-50' },
            { label: 'Reservados', value: stats.reserved, color: 'text-yellow-700', bg: 'bg-yellow-50' },
            { label: 'Vendidos', value: stats.purchased, color: 'text-red-700', bg: 'bg-red-50' },
            { label: 'Receita', value: formatCurrency(stats.revenue), color: 'text-primary-700', bg: 'bg-primary-50', isText: true },
          ].map(s => (
            <div key={s.label} className={`card p-4 ${s.bg}`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.isText ? s.value : s.value.toLocaleString()}</p>
              <p className="text-sm text-gray-600">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Barra de progresso */}
      {stats && (
        <div className="card p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-gray-700">Progresso de vendas</span>
            <span className="font-bold text-primary-600">{progress}%</span>
          </div>
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-4">
          {[
            { key: 'overview', label: '📋 Visão Geral' },
            { key: 'numbers', label: '🔢 Números' },
            { key: 'purchases', label: `🛒 Compras (${purchases.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab: Visão Geral */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5 space-y-4">
            <h3 className="font-semibold text-gray-800">Informações da Rifa</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Data do Sorteio:</span><span className="font-medium">{formatDate(raffle.draw_date)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total de Números:</span><span className="font-medium">{raffle.total_numbers.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Preço por Número:</span><span className="font-bold text-primary-600">{formatCurrency(Number(raffle.price_per_number))}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">WhatsApp:</span><span className="font-medium">{raffle.whatsapp_number}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Criada em:</span><span className="font-medium">{formatDateTime(raffle.created_at)}</span></div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Descrição:</p>
              <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{raffle.description}</p>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Imagem</h3>
            <img src={getImageUrl(raffle.images?.[0] ?? raffle.image_url)} alt={raffle.title} className="w-full rounded-lg object-cover aspect-video"
              onError={e => { (e.target as HTMLImageElement).src = '/placeholder-raffle.svg'; }} />
          </div>
        </div>
      )}

      {/* Tab: Números */}
      {activeTab === 'numbers' && (
        <div className="card p-5">
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { key: 'all', label: 'Todos', count: numbers.length },
              { key: 'available', label: 'Disponíveis', count: numbers.filter(n => n.status === 'available').length },
              { key: 'reserved', label: 'Reservados', count: numbers.filter(n => n.status === 'reserved').length },
              { key: 'purchased', label: 'Vendidos', count: numbers.filter(n => n.status === 'purchased').length },
            ].map(f => (
              <button key={f.key} onClick={() => setNumberFilter(f.key as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${numberFilter === f.key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
                {f.label} ({f.count})
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 font-semibold text-gray-600">Número</th>
                  <th className="text-left p-2 font-semibold text-gray-600">Status</th>
                  <th className="text-left p-2 font-semibold text-gray-600">Comprador</th>
                  <th className="text-left p-2 font-semibold text-gray-600">Telefone</th>
                  <th className="text-left p-2 font-semibold text-gray-600">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredNumbers.slice(0, 200).map(n => (
                  <tr key={n.id} className="hover:bg-gray-50">
                    <td className="p-2 font-mono font-bold">#{String(n.number).padStart(String(raffle.total_numbers).length, '0')}</td>
                    <td className="p-2">
                      <span className={`badge ${n.status === 'available' ? 'badge-available' : n.status === 'reserved' ? 'badge-reserved' : 'badge-purchased'}`}>
                        {n.status === 'available' ? 'Disponível' : n.status === 'reserved' ? 'Reservado' : 'Vendido'}
                      </span>
                    </td>
                    <td className="p-2">{n.buyer_name || '—'}</td>
                    <td className="p-2">{n.buyer_phone || '—'}</td>
                    <td className="p-2 text-gray-500 text-xs">{n.purchased_at ? formatDateTime(n.purchased_at) : n.reserved_at ? `Reservado: ${formatDateTime(n.reserved_at)}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredNumbers.length > 200 && (
              <p className="text-center text-sm text-gray-400 mt-3">Mostrando 200 de {filteredNumbers.length} números</p>
            )}
          </div>
        </div>
      )}

      {/* Tab: Compras */}
      {activeTab === 'purchases' && (
        <div className="card overflow-hidden">
          {purchases.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-4xl mb-3">🛒</p>
              <p>Nenhuma compra registrada ainda</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left p-4 font-semibold text-gray-600">Comprador</th>
                  <th className="text-left p-4 font-semibold text-gray-600">Números</th>
                  <th className="text-left p-4 font-semibold text-gray-600">Total</th>
                  <th className="text-left p-4 font-semibold text-gray-600">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-600">Data</th>
                  <th className="text-right p-4 font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {purchases.map(purchase => (
                  <tr key={purchase.id} className="hover:bg-gray-50">
                    <td className="p-4">
                      <p className="font-medium">{purchase.buyer_name}</p>
                      <p className="text-xs text-gray-500">{purchase.buyer_phone}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-0.5 max-w-[200px]">
                        {purchase.numbers.slice(0, 10).map(n => (
                          <span key={n} className="text-xs bg-gray-100 rounded px-1 font-mono">
                            {String(n).padStart(String(raffle.total_numbers).length, '0')}
                          </span>
                        ))}
                        {purchase.numbers.length > 10 && (
                          <span className="text-xs text-gray-400">+{purchase.numbers.length - 10}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-green-700">{formatCurrency(Number(purchase.total_amount))}</td>
                    <td className="p-4">
                      <span className={`badge ${purchase.status === 'confirmed' ? 'badge-active' : purchase.status === 'cancelled' ? 'badge-purchased' : 'badge-reserved'}`}>
                        {purchase.status === 'confirmed' ? 'Confirmado' : purchase.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">{formatDateTime(purchase.created_at)}</td>
                    <td className="p-4 text-right">
                      {purchase.status !== 'cancelled' && (
                        <button onClick={() => handleCancelPurchase(purchase.id)} className="btn-sm btn border border-red-200 text-red-600 hover:bg-red-50 text-xs">
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
