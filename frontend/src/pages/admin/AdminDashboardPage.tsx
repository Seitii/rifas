import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { raffleApi, purchaseApi } from '../../services/raffle.service';
import { Raffle, Purchase } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils';

interface DashboardStats {
  totalRaffles: number;
  activeRaffles: number;
  totalPurchases: number;
  totalRevenue: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRaffles: 0, activeRaffles: 0, totalPurchases: 0, totalRevenue: 0,
  });
  const [recentRaffles, setRecentRaffles] = useState<Raffle[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<Purchase[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rafflesRes, purchasesRes] = await Promise.all([
          raffleApi.getAll({ limit: 100 }),
          purchaseApi.getAll({ limit: 5 }),
        ]);

        if (rafflesRes.success && rafflesRes.data) {
          const raffles = rafflesRes.data.data;
          setRecentRaffles(raffles.slice(0, 5));
          setStats(prev => ({
            ...prev,
            totalRaffles: rafflesRes.data!.total,
            activeRaffles: raffles.filter(r => r.status === 'active').length,
          }));
        }

        if (purchasesRes.success && purchasesRes.data) {
          const purchases = purchasesRes.data.data;
          setRecentPurchases(purchases);
          const revenue = purchases
            .filter(p => p.status === 'confirmed')
            .reduce((sum, p) => sum + Number(p.total_amount), 0);
          setStats(prev => ({
            ...prev,
            totalPurchases: purchasesRes.data!.total,
            totalRevenue: revenue,
          }));
        }
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Rifas Ativas', value: stats.activeRaffles, icon: '🎟️', color: 'bg-primary-50 text-primary-700' },
    { label: 'Total de Rifas', value: stats.totalRaffles, icon: '📋', color: 'bg-blue-50 text-blue-700' },
    { label: 'Total de Compras', value: stats.totalPurchases, icon: '🛒', color: 'bg-green-50 text-green-700' },
    { label: 'Receita Total', value: formatCurrency(stats.totalRevenue), icon: '💰', color: 'bg-yellow-50 text-yellow-700', isText: true },
  ];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Visão geral do sistema</p>
        </div>
        <Link to="/admin/rifas/criar" className="btn-primary">
          + Nova Rifa
        </Link>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="card p-5">
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-lg mb-3 ${card.color}`}>
              <span className="text-xl">{card.icon}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {card.isText ? card.value : Number(card.value).toLocaleString('pt-BR')}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rifas recentes */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Rifas Recentes</h2>
            <Link to="/admin/rifas" className="text-sm text-primary-600 hover:underline">Ver todas</Link>
          </div>
          {recentRaffles.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">🎟️</p>
              <p className="text-sm">Nenhuma rifa criada ainda</p>
              <Link to="/admin/rifas/criar" className="text-primary-600 text-sm hover:underline mt-2 inline-block">
                Criar primeira rifa
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentRaffles.map(raffle => (
                <Link
                  key={raffle.id}
                  to={`/admin/rifas/${raffle.id}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg shrink-0">🎟️</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{raffle.title}</p>
                    <p className="text-xs text-gray-500">{raffle.total_numbers.toLocaleString()} números</p>
                  </div>
                  <span className={`badge text-xs shrink-0 ${
                    raffle.status === 'active' ? 'badge-active' :
                    raffle.status === 'drawn' ? 'badge-drawn' : 'badge-closed'
                  }`}>
                    {raffle.status === 'active' ? 'Ativa' : raffle.status === 'drawn' ? 'Sorteada' : 'Encerrada'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Compras recentes */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Compras Recentes</h2>
            <Link to="/admin/compras" className="text-sm text-primary-600 hover:underline">Ver todas</Link>
          </div>
          {recentPurchases.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-3xl mb-2">🛒</p>
              <p className="text-sm">Nenhuma compra ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPurchases.map(purchase => (
                <div key={purchase.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg shrink-0">
                    {(purchase as any).raffle_title ? '🛒' : '🛒'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{purchase.buyer_name}</p>
                    <p className="text-xs text-gray-500">
                      {purchase.numbers.length} número(s) • {formatDateTime(purchase.created_at)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-green-700">{formatCurrency(Number(purchase.total_amount))}</p>
                    <span className={`badge text-xs ${
                      purchase.status === 'confirmed' ? 'badge-active' :
                      purchase.status === 'cancelled' ? 'badge-purchased' : 'badge-reserved'
                    }`}>
                      {purchase.status === 'confirmed' ? 'Confirmado' : purchase.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="card p-5">
        <h2 className="font-bold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="flex flex-wrap gap-3">
          <Link to="/admin/rifas/criar" className="btn-primary">🎟️ Criar Nova Rifa</Link>
          <Link to="/admin/rifas" className="btn-secondary">📋 Gerenciar Rifas</Link>
          <Link to="/admin/compras" className="btn-secondary">🛒 Ver Compras</Link>
          <Link to="/" target="_blank" className="btn-secondary">🌐 Ver Site</Link>
        </div>
      </div>
    </div>
  );
}
