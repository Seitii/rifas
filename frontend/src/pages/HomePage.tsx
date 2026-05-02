import { useEffect, useState } from 'react';
import { raffleApi } from '../services/raffle.service';
import { Raffle } from '../types';
import RaffleCard from '../components/raffle/RaffleCard';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all');

  const fetchRaffles = async () => {
    setIsLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : undefined;
      const response = await raffleApi.getAll({ ...params, limit: 50 });
      if (response.success && response.data) {
        setRaffles(response.data.data);
      }
    } catch (err) {
      toast.error('Erro ao carregar rifas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRaffles();
  }, [filter]);

  const activeRaffles = raffles.filter(r => r.status === 'active');
  const otherRaffles = raffles.filter(r => r.status !== 'active');

  return (
    <div className="container-app py-8">
      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
          🎟️ Rifas Online
        </h1>
        <p className="text-gray-500 text-lg max-w-xl mx-auto">
          Escolha sua rifa favorita, selecione seus números e concorra a prêmios incríveis!
        </p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {([
          { key: 'all', label: 'Todas' },
          { key: 'active', label: 'Ativas' },
          { key: 'closed', label: 'Encerradas' },
        ] as const).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f.key
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-6 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : raffles.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">🎟️</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Nenhuma rifa encontrada
          </h2>
          <p className="text-gray-500">
            Em breve novas rifas serão publicadas. Volte mais tarde!
          </p>
        </div>
      ) : (
        <>
          {/* Rifas ativas em destaque */}
          {activeRaffles.length > 0 && (
            <section className="mb-8">
              {filter === 'all' && (
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  🔥 Rifas em andamento
                </h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {activeRaffles.map(r => (
                  <RaffleCard key={r.id} raffle={r} />
                ))}
              </div>
            </section>
          )}

          {/* Outras rifas */}
          {filter === 'all' && otherRaffles.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                📚 Histórico
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {otherRaffles.map(r => (
                  <RaffleCard key={r.id} raffle={r} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
