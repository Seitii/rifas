import { useMemo, useState } from 'react';
import { RaffleNumber } from '../../types';
import { formatNumber } from '../../utils';

interface NumberGridProps {
  numbers: RaffleNumber[];
  totalNumbers: number;
  selectedNumbers: number[];
  onToggle: (n: number) => void;
  disabled?: boolean;
}

type FilterType = 'all' | 'available' | 'reserved' | 'purchased';

export default function NumberGrid({
  numbers,
  totalNumbers,
  selectedNumbers,
  onToggle,
  disabled = false,
}: NumberGridProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');

  const numberMap = useMemo(() => {
    const map = new Map<number, RaffleNumber>();
    numbers.forEach(n => map.set(n.number, n));
    return map;
  }, [numbers]);

  const filteredNumbers = useMemo(() => {
    const allNumbers = Array.from({ length: totalNumbers }, (_, i) => i + 1);

    return allNumbers.filter(n => {
      const data = numberMap.get(n);
      const status = data?.status || 'available';

      if (search) {
        const formatted = formatNumber(n, totalNumbers);
        if (!formatted.includes(search) && !String(n).includes(search)) {
          return false;
        }
      }

      if (filter === 'all') return true;
      if (filter === 'available') return status === 'available' || selectedNumbers.includes(n);
      return status === filter;
    });
  }, [numberMap, totalNumbers, filter, search, selectedNumbers]);

  const getCellClass = (n: number): string => {
    if (selectedNumbers.includes(n)) return 'number-selected';
    const data = numberMap.get(n);
    const status = data?.status || 'available';
    return {
      available: 'number-available',
      reserved: 'number-reserved',
      purchased: 'number-purchased',
    }[status] || 'number-available';
  };

  const isClickable = (n: number): boolean => {
    if (disabled) return false;
    if (selectedNumbers.includes(n)) return true;
    const data = numberMap.get(n);
    return !data || data.status === 'available';
  };

  const filterCounts = useMemo(() => {
    const counts = { available: 0, reserved: 0, purchased: 0 };
    numbers.forEach(n => {
      if (n.status in counts) counts[n.status as keyof typeof counts]++;
    });
    counts.available += totalNumbers - numbers.length; // números sem registro = disponíveis
    return counts;
  }, [numbers, totalNumbers]);

  return (
    <div className="space-y-4">
      {/* Filtros e busca */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Buscar número..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input sm:w-40"
          maxLength={6}
        />
        <div className="flex gap-2 flex-wrap">
          {([
            { key: 'all', label: 'Todos', count: totalNumbers },
            { key: 'available', label: 'Livres', count: filterCounts.available },
            { key: 'reserved', label: 'Reservados', count: filterCounts.reserved },
            { key: 'purchased', label: 'Vendidos', count: filterCounts.purchased },
          ] as const).map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                filter === f.key
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {f.label}
              <span className={`ml-1 ${filter === f.key ? 'text-primary-100' : 'text-gray-400'}`}>
                ({f.count.toLocaleString('pt-BR')})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-green-100 border-2 border-green-300 inline-block" />
          Disponível
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-primary-600 inline-block" />
          Selecionado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-yellow-50 border-2 border-yellow-200 inline-block" />
          Reservado
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-4 rounded bg-red-50 border-2 border-red-200 inline-block" />
          Vendido
        </span>
      </div>

      {/* Grid */}
      <div className="number-grid">
        {filteredNumbers.map(n => (
          <button
            key={n}
            onClick={() => isClickable(n) && onToggle(n)}
            className={getCellClass(n)}
            title={
              selectedNumbers.includes(n)
                ? `Número ${n} — Clique para desselecionar`
                : numberMap.get(n)?.status === 'reserved'
                ? `Número ${n} — Reservado`
                : numberMap.get(n)?.status === 'purchased'
                ? `Número ${n} — Vendido`
                : `Número ${n} — Disponível`
            }
            disabled={!isClickable(n) && !selectedNumbers.includes(n)}
          >
            {formatNumber(n, totalNumbers)}
          </button>
        ))}
      </div>

      {filteredNumbers.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Nenhum número encontrado para o filtro selecionado.
        </div>
      )}
    </div>
  );
}
