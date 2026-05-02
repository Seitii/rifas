import { Link } from 'react-router-dom';
import { Raffle } from '../../types';
import { formatCurrency, formatDate, getImageUrl, calculateProgress } from '../../utils';

interface RaffleCardProps {
  raffle: Raffle;
}

export default function RaffleCard({ raffle }: RaffleCardProps) {
  const stats = raffle.stats;
  const progress = stats ? calculateProgress(stats) : 0;

  const statusLabel = {
    active: 'Ativa',
    closed: 'Encerrada',
    drawn: 'Sorteada',
  }[raffle.status];

  const statusClass = {
    active: 'badge-active',
    closed: 'badge-closed',
    drawn: 'badge-drawn',
  }[raffle.status];

  return (
    <Link to={`/rifa/${raffle.id}`} className="block">
      <article className="card-hover overflow-hidden group">
        {/* Imagem */}
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          <img
            src={getImageUrl(raffle.images?.[0] ?? raffle.image_url)}
            alt={raffle.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-raffle.svg';
            }}
          />
          <div className="absolute top-2 right-2">
            <span className={statusClass}>{statusLabel}</span>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2 mb-2">
            {raffle.title}
          </h3>

          <p className="text-xs text-gray-500 mb-3">
            📅 Sorteio: {formatDate(raffle.draw_date)}
          </p>

          {/* Preço e total */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-gray-500">Por número</p>
              <p className="text-lg font-bold text-primary-600">
                {formatCurrency(Number(raffle.price_per_number))}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-sm font-semibold text-gray-700">
                {raffle.total_numbers.toLocaleString('pt-BR')} nºs
              </p>
            </div>
          </div>

          {/* Barra de progresso */}
          {stats && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{stats.available.toLocaleString('pt-BR')} disponíveis</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-green-600">{stats.available} livres</span>
                <span className="text-red-500">{stats.purchased} vendidos</span>
              </div>
            </div>
          )}

          {/* CTA */}
          {raffle.status === 'active' && (
            <div className="mt-4">
              <span className="btn-primary btn w-full text-sm">
                🎟️ Participar
              </span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}
