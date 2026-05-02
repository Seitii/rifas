import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { raffleApi } from '../services/raffle.service';
import { Raffle, RaffleNumber, RaffleStats } from '../types';
import NumberGrid from '../components/raffle/NumberGrid';
import CheckoutModal from '../components/raffle/CheckoutModal';
import { useRaffleSocket } from '../hooks/useRaffleSocket';
import { formatCurrency, formatDate, getImageUrl, calculateProgress } from '../utils';
import toast from 'react-hot-toast';

export default function RaffleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [stats, setStats] = useState<RaffleStats | null>(null);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const [raffleRes, numbersRes] = await Promise.all([
        raffleApi.getById(id),
        raffleApi.getNumbers(id),
      ]);
      if (raffleRes.success && raffleRes.data) {
        setRaffle(raffleRes.data);
        setStats(raffleRes.data.stats || null);
      }
      if (numbersRes.success && numbersRes.data) {
        setNumbers(numbersRes.data);
      }
    } catch {
      toast.error('Rifa não encontrada');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useRaffleSocket({
    raffleId: id || null,
    onNumbersUpdated: (updatedNumbers) => {
      setNumbers(updatedNumbers);
      setSelectedNumbers(prev =>
        prev.filter(n => {
          const found = updatedNumbers.find(u => u.number === n);
          return !found || found.status === 'available';
        })
      );
    },
    onStatsUpdated: (updatedStats) => { setStats(updatedStats); },
  });

  const handleToggleNumber = (n: number) => {
    setSelectedNumbers(prev => {
      if (prev.includes(n)) return prev.filter(x => x !== n);
      if (prev.length >= 100) { toast.error('Máximo de 100 números por vez'); return prev; }
      return [...prev, n];
    });
  };

  const handleSelectRandom = () => {
    if (!raffle) return;
    const available = Array.from({ length: raffle.total_numbers }, (_, i) => i + 1)
      .filter(n => { const f = numbers.find(num => num.number === n); return !f || f.status === 'available'; });
    if (available.length === 0) { toast.error('Não há números disponíveis'); return; }
    const count = Math.min(5, available.length);
    const random = [...available].sort(() => Math.random() - 0.5).slice(0, count);
    setSelectedNumbers(random);
    toast.success(`${count} números aleatórios selecionados!`);
  };

  const handleCheckoutSuccess = (whatsappUrl: string) => {
    setShowCheckout(false);
    setSelectedNumbers([]);
    fetchData();
    setTimeout(() => { window.open(whatsappUrl, '_blank'); }, 500);
  };

  if (isLoading) {
    return (
      <div className="container-app py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="aspect-video bg-gray-200 rounded-xl" />
          <div className="lg:col-span-2 bg-gray-200 rounded-xl h-96" />
        </div>
      </div>
    );
  }

  if (!raffle) return null;

  const progress = stats ? calculateProgress(stats) : 0;
  const isActive = raffle.status === 'active';

  return (
    <div className="container-app py-6">
      <nav className="text-sm text-gray-500 mb-4">
        <button onClick={() => navigate('/')} className="hover:text-primary-600 transition-colors">
          ← Todas as rifas
        </button>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info da rifa */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card overflow-hidden">
            <img
              src={getImageUrl(raffle.images?.[0] ?? raffle.image_url)}
              alt={raffle.title}
              className="w-full aspect-video object-cover"
              onError={e => { (e.target as HTMLImageElement).src = '/placeholder-raffle.svg'; }}
            />
          </div>

          <div className="card p-5 space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <h1 className="text-xl font-bold text-gray-900">{raffle.title}</h1>
                <span className={`badge shrink-0 ${raffle.status === 'active' ? 'badge-active' : raffle.status === 'drawn' ? 'badge-drawn' : 'badge-closed'}`}>
                  {raffle.status === 'active' ? 'Ativa' : raffle.status === 'drawn' ? 'Sorteada' : 'Encerrada'}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">{raffle.description}</p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">📅 Data do sorteio:</span>
                <span className="font-medium">{formatDate(raffle.draw_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">🔢 Total de números:</span>
                <span className="font-medium">{raffle.total_numbers.toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">💰 Preço por número:</span>
                <span className="font-bold text-primary-600 text-base">{formatCurrency(Number(raffle.price_per_number))}</span>
              </div>
              {raffle.winner_number && (
                <div className="flex justify-between bg-purple-50 rounded-lg px-3 py-2">
                  <span className="text-purple-700">🏆 Número sorteado:</span>
                  <span className="font-bold text-purple-700">#{raffle.winner_number}</span>
                </div>
              )}
            </div>

            {stats && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Progresso de vendas</span><span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div className="bg-green-50 rounded-lg py-1.5">
                    <p className="text-base font-bold text-green-700">{stats.available.toLocaleString()}</p>
                    <p className="text-xs text-green-600">Livres</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg py-1.5">
                    <p className="text-base font-bold text-yellow-700">{stats.reserved.toLocaleString()}</p>
                    <p className="text-xs text-yellow-600">Reservados</p>
                  </div>
                  <div className="bg-red-50 rounded-lg py-1.5">
                    <p className="text-base font-bold text-red-700">{stats.purchased.toLocaleString()}</p>
                    <p className="text-xs text-red-600">Vendidos</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {isActive && selectedNumbers.length > 0 && (
            <div className="card p-4 border-primary-200 bg-primary-50 lg:sticky lg:top-20">
              <p className="font-semibold text-primary-900 mb-1">🎟️ {selectedNumbers.length} número(s) selecionado(s)</p>
              <p className="text-lg font-bold text-primary-700 mb-3">
                Total: {formatCurrency(selectedNumbers.length * Number(raffle.price_per_number))}
              </p>
              <button onClick={() => setShowCheckout(true)} className="btn-primary w-full btn-lg">📱 Finalizar no WhatsApp</button>
              <button onClick={() => setSelectedNumbers([])} className="btn-secondary w-full mt-2 text-sm">Limpar seleção</button>
            </div>
          )}
        </div>

        {/* Grid de números */}
        <div className="lg:col-span-2">
          <div className="card p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900">Escolha seus números</h2>
              {isActive && (
                <div className="flex gap-2">
                  <button onClick={handleSelectRandom} className="btn-secondary btn-sm">🎲 Aleatório</button>
                  {selectedNumbers.length > 0 && (
                    <button onClick={() => setSelectedNumbers([])} className="btn-sm btn border border-gray-200 text-gray-600 hover:bg-gray-100">
                      ✕ Limpar ({selectedNumbers.length})
                    </button>
                  )}
                </div>
              )}
            </div>

            {!isActive && (
              <div className="bg-gray-50 rounded-xl p-4 mb-4 text-center">
                <p className="text-gray-500">
                  {raffle.status === 'drawn' ? `🏆 Número sorteado: #${raffle.winner_number || '?'}` : '🔒 Esta rifa foi encerrada.'}
                </p>
              </div>
            )}

            <NumberGrid
              numbers={numbers}
              totalNumbers={raffle.total_numbers}
              selectedNumbers={selectedNumbers}
              onToggle={handleToggleNumber}
              disabled={!isActive}
            />

            {isActive && selectedNumbers.length > 0 && (
              <div className="mt-4 p-4 bg-primary-600 rounded-xl text-white flex items-center justify-between">
                <div>
                  <p className="font-semibold">{selectedNumbers.length} número(s)</p>
                  <p className="text-primary-100 text-sm">{formatCurrency(selectedNumbers.length * Number(raffle.price_per_number))}</p>
                </div>
                <button onClick={() => setShowCheckout(true)} className="bg-white text-primary-700 font-bold px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors">
                  Finalizar →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCheckout && (
        <CheckoutModal
          raffle={raffle}
          selectedNumbers={selectedNumbers}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
}
