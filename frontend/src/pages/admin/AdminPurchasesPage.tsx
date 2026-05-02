import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { purchaseApi } from '../../services/raffle.service';
import { Purchase } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils';
import toast from 'react-hot-toast';

export default function AdminPurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchPurchases = async () => {
    setIsLoading(true);
    try {
      const params: any = { page, limit: 20 };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await purchaseApi.getAll(params);
      if (res.success && res.data) {
        setPurchases(res.data.data);
        setTotalPages(res.data.totalPages);
        setTotal(res.data.total);
      }
    } catch { toast.error('Erro ao carregar compras'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { setPage(1); }, [statusFilter]);
  useEffect(() => { fetchPurchases(); }, [page, statusFilter]);

  const handleCancel = async (purchaseId: string) => {
    if (!window.confirm('Cancelar esta compra?')) return;
    try {
      const res = await purchaseApi.cancel(purchaseId);
      if (res.success) {
        toast.success('Compra cancelada');
        setPurchases(prev => prev.map(p => p.id === purchaseId ? { ...p, status: 'cancelled' as any } : p));
      }
    } catch { toast.error('Erro ao cancelar compra'); }
  };

  const filteredPurchases = purchases.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.buyer_name.toLowerCase().includes(s) || p.buyer_phone.includes(s);
  });

  const totalRevenue = purchases
    .filter(p => p.status === 'confirmed')
    .reduce((sum, p) => sum + Number(p.total_amount), 0);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Compras</h1>
          <p className="text-gray-500 text-sm">{total} compra(s) no total</p>
        </div>
        {totalRevenue > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-2">
            <p className="text-xs text-green-600">Receita confirmada</p>
            <p className="font-bold text-green-700 text-lg">{formatCurrency(totalRevenue)}</p>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input sm:w-64"
        />
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'Todas' },
            { key: 'confirmed', label: 'Confirmadas' },
            { key: 'pending', label: 'Pendentes' },
            { key: 'cancelled', label: 'Canceladas' },
          ].map(f => (
            <button key={f.key} onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${statusFilter === f.key ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : filteredPurchases.length === 0 ? (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🛒</p>
          <p>Nenhuma compra encontrada</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card overflow-hidden hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left p-4 font-semibold text-gray-600">Comprador</th>
                  <th className="text-left p-4 font-semibold text-gray-600">Rifa</th>
                  <th className="text-left p-4 font-semibold text-gray-600">Nºs</th>
                  <th className="text-left p-4 font-semibold text-gray-600">Total</th>
                  <th className="text-left p-4 font-semibold text-gray-600">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-600">Data</th>
                  <th className="text-right p-4 font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPurchases.map(purchase => (
                  <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4">
                      <p className="font-medium text-gray-900">{purchase.buyer_name}</p>
                      <p className="text-xs text-gray-500">{purchase.buyer_phone}</p>
                    </td>
                    <td className="p-4">
                      {(purchase as any).raffle_title ? (
                        <Link to={`/admin/rifas/${purchase.raffle_id}`} className="text-primary-600 hover:underline text-sm">
                          {(purchase as any).raffle_title}
                        </Link>
                      ) : (
                        <Link to={`/admin/rifas/${purchase.raffle_id}`} className="text-primary-600 hover:underline text-sm">
                          Ver rifa
                        </Link>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-0.5 max-w-[150px]">
                        {purchase.numbers.slice(0, 6).map(n => (
                          <span key={n} className="text-xs bg-gray-100 rounded px-1 font-mono">{n}</span>
                        ))}
                        {purchase.numbers.length > 6 && <span className="text-xs text-gray-400">+{purchase.numbers.length - 6}</span>}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-green-700">{formatCurrency(Number(purchase.total_amount))}</td>
                    <td className="p-4">
                      <span className={`badge ${purchase.status === 'confirmed' ? 'badge-active' : purchase.status === 'cancelled' ? 'badge-purchased' : 'badge-reserved'}`}>
                        {purchase.status === 'confirmed' ? 'Confirmada' : purchase.status === 'cancelled' ? 'Cancelada' : 'Pendente'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">{formatDateTime(purchase.created_at)}</td>
                    <td className="p-4 text-right">
                      {purchase.status !== 'cancelled' && (
                        <button onClick={() => handleCancel(purchase.id)} className="btn-sm btn border border-red-200 text-red-500 hover:bg-red-50 text-xs">
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredPurchases.map(purchase => (
              <div key={purchase.id} className="card p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900">{purchase.buyer_name}</p>
                    <p className="text-xs text-gray-500">{purchase.buyer_phone}</p>
                  </div>
                  <span className={`badge ${purchase.status === 'confirmed' ? 'badge-active' : purchase.status === 'cancelled' ? 'badge-purchased' : 'badge-reserved'}`}>
                    {purchase.status === 'confirmed' ? 'Confirmada' : purchase.status === 'cancelled' ? 'Cancelada' : 'Pendente'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">{purchase.numbers.length} número(s)</span>
                  <span className="font-bold text-green-700">{formatCurrency(Number(purchase.total_amount))}</span>
                </div>
                <p className="text-xs text-gray-400">{formatDateTime(purchase.created_at)}</p>
                {purchase.status !== 'cancelled' && (
                  <button onClick={() => handleCancel(purchase.id)} className="w-full btn-sm btn border border-red-200 text-red-500 hover:bg-red-50 text-xs">
                    Cancelar compra
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary btn-sm">← Anterior</button>
              <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary btn-sm">Próxima →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
